const { SHA256 } = require('crypto-js');

const { TransactionsPool, transactionsPool } = require('./transactionPool');
const { UTXO, Transaction, TxIn, TxOut } = require('./transaction');
const { broadcast, MessageType } = require('./p2p');
const { wallet } = require('./wallet');
const { coinbaseTransaction } = require('./utility');

const BLOCK_GENERATION_INTERVAL = 10;
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10;
const MINTING_WITHOUT_COIN_INDEX = 100;

const calculateHashByBlock = (block) => {
  return SHA256(
    block.index +
      block.previousHash +
      block.timestamp +
      JSON.stringify(block.data) +
      block.difficulty +
      block.minterBalance +
      block.minterAddress
  ).toString();
};

class Block {
  constructor(
    index,
    previousHash,
    timestamp,
    data,
    difficulty,
    minterBalance,
    minterAddress
  ) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.difficulty = difficulty;
    this.minterBalance = minterBalance;
    this.minterAddress = minterAddress;
    this.hash = calculateHashByBlock(this);
  }

  isStructureValid() {
    return (
      typeof this.index == 'number' &&
      typeof this.hash == 'string' &&
      typeof this.previousHash == 'string' &&
      typeof this.timestamp == 'number' &&
      typeof this.data == 'object' &&
      typeof this.difficulty == 'number' &&
      typeof this.minterBalance == 'number' &&
      typeof this.minterAddress == 'string'
    );
  }

  validateBlockTransactions(UTXOs) {
    let temp = this.data
      .map((tx) => tx.txIns)
      .flat()
      .map((el) => el.txId + el.txIndex);
    return (
      this.data[0].validateCoinbase(this.index) &&
      temp.length == new Set(temp).length &&
      this.data.subarray(1).filter((el) => !el.validate(UTXOs)).length == 0
    );
  }

  updateUTXOs(UTXOs) {
    const newUTXOs = this.data
      .map((tx) =>
        tx.txOuts.map(
          (txOut, index) => new UTXO(tx.id, index, txOut.address, txOut.amount)
        )
      )
      .reduce((a, b) => a.concat(b));
    const consumedUTXOs = this.data
      .map((tx) => tx.txIns)
      .reduce((a, b) => a.concat(b))
      .map((txIn) => new UTXO(txIn.txId, txIn.txIndex, '', 0));
    console.log(consumedUTXOs);

    return UTXOs.filter(
      (utxo) =>
        !consumedUTXOs.find(
          (consumedUTXO) =>
            consumedUTXO.txId == utxo.txId &&
            consumedUTXO.txIndex == utxo.txIndex
        )
    ).concat(newUTXOs);
  }

  processTransactions(UTXOs) {
    if (this.validateBlockTransactions(UTXOs))
      throw new Error('process transactions');
    return this.updateUTXOs(UTXOs);
  }

  isBlockStakingValid() {
    this.difficulty++;

    if (this.index <= MINTING_WITHOUT_COIN_INDEX) {
      this.minterBalance += 1;
    }

    const balanceOverDifficulty =
      (Math.pow(2, 256) * this.minterBalance) / this.difficulty;
    const stakingHash = SHA256(
      this.previousHash + this.minterAddress + this.timestamp
    ).toString();
    const decimalStakingHash = parseInt(stakingHash, 16);
    return balanceOverDifficulty >= decimalStakingHash;
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.genesisBlock()];
  }
  genesisBlock() {
    const genesisTransaction = new Transaction(
      [new TxIn(0)],
      [new TxOut(wallet.getPublicKey(), 50)]
    );

    return new Block(
      0,
      '91a73664bc84c0baa1fc75ea6e4aa6d1d20c5df664c724e3159aefc2e1186627 ',
      Date.now(),
      [genesisTransaction],
      0,
      0,
      wallet.getPublicKey()
    );
  }

  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  isNextBlockValid(prevBlock, nextBlock) {
    return (
      prevBlock.index + 1 == nextBlock.index &&
      prevBlock.hash == nextBlock.previousHash &&
      nextBlock.hash == calculateHashByBlock(nextBlock)
    );
  }

  getChain() {
    return this.chain;
  }

  addBlockToChain(nextBlock) {
    if (!this.isNextBlockValid(this.getLastBlock(), nextBlock))
      throw new Error('Invalid next block');
    const temp = nextBlock.processTransactions(getUTXOs());
    if (!temp) throw new Error('addBlockToChain');
    setUTXOs(temp);
    transactionsPool.updateTransactionPool(UTXOs);
    this.chain.push(nextBlock);
    return true;
  }

  isChainValid(chain = this.chain) {
    let tempUTXOs = [];
    for (let i = 1; i < chain.length; ++i) {
      if (!this.isNextBlockValid(chain[i - 1], chain[i])) return null;
      tempUTXOs = this.chain[i].processTransactions([]);
      if (tempUTXOs) return null;
    }

    return tempUTXOs;
  }

  replaceChain(newChain) {
    const tempUTXOs = this.isChainValid(newChain);

    if (tempUTXOs && newChain.length > this.chain.length) {
      this.chain = newChain;
      setUTXOs(tempUTXOs);
      transactionsPool.updateTransactionPool(UTXOs);
      broadcast({
        type: MessageType.RESPONSE_BLOCKCHAIN,
        data: JSON.stringify([this.getLastBlock()]),
      });
    }
  }

  getDiffucilty() {
    const latestBlock = this.getLastBlock();
    if (
      latestBlock.index & (DIFFICULTY_ADJUSTMENT_INTERVAL == 0) &&
      latestBlock.index != 0
    ) {
    }
    return latestBlock.difficulty;
  }

  getLastAdjustedBlock() {
    return this.chain[this.chain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
  }

  getAdjustedDifficulty() {
    const timeExpected =
      BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
    const timeTaken =
      this.getLastBlock().timestamp - this.getLastAdjustedBlock().timestamp;

    let raise = timeTaken < timeExpected / 2 || -(timeTaken > timeExpected * 2);
    return this.getLastAdjustedBlock().difficulty + raise;
  }

  isTimestampValid(prevBlock, nextBlock) {
    return (
      prevBlock.timestamp - 60000 < nextBlock.timestamp &&
      nextBlock.timestamp < Date.now()
    );
  }

  generateRawNextBlock(data) {
    const previousBlock = this.getLastBlock();
    let block = new Block(
      previousBlock.index + 1,
      previousBlock.hash,
      Date.now(),
      data,
      this.getDiffucilty(),
      wallet.getBalance(getUTXOs()),
      wallet.getPublicKey()
    );
    if (this.addBlockToChain(block) && block.isBlockStakingValid()) {
      broadcast({
        type: MessageType.RESPONSE_BLOCKCHAIN,
        data: JSON.stringify([this.getLastBlock()]),
      });
      return block;
    }
    return null;
  }

  generateNextBlock() {
    return this.generateRawNextBlock(
      [
        coinbaseTransaction(
          wallet.getPublicKey(),
          this.getLastBlock().index + 1
        ),
      ].concat(transactionsPool.getTransactionPool())
    );
  }

  generateNextBlockWithTransactions(receiverAddress, amount) {
    return this.generateRawNextBlock([
      coinbaseTransaction(wallet.getPublicKey(), this.getLastBlock().index + 1),
      wallet.createTransaction(
        receiverAddress,
        amount,
        getUTXOs(),
        transactionsPool.getTransactionPool()
      ),
    ]);
  }

  sendTransaction(receiverAddress, amount) {
    const tx = wallet.createTransaction(
      receiverAddress,
      amount,
      getUTXOs(),
      transactionsPool.getTransactionPool()
    );
    transactionsPool.addToTransactionPool(tx, getUTXOs());
    broadcast({
      type: MessageType.RESPONSE_TRANSACTION_POOL,
      data: JSON.stringify(transactionsPool.getTransactionPool()),
    });
    return tx;
  }
}

const blockChain = new Blockchain();

let UTXOs = blockChain.chain[0].processTransactions([]);

const setUTXOs = (newUTXOs) => (UTXOs = newUTXOs);
const getUTXOs = () => JSON.parse(JSON.stringify(UTXOs));

module.exports = { Block, Blockchain, blockChain, getUTXOs };
