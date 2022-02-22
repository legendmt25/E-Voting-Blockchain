const { Block } = require('./block');
const { transactionsPool } = require('./transactionPool');
const { Transaction } = require('./transaction');
const { TxIn } = require('./txin');
const { TxOut } = require('./txout');
const { wallet } = require('./wallet');
const {
  broadcast,
  MessageType,
  coinbaseTransaction,
  calculateHashByBlock,
} = require('./utility');

const BLOCK_GENERATION_INTERVAL = 10;
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10;

class Blockchain {
  constructor() {
    this.chain = [this.genesisBlock()];
  }
  genesisBlock() {
    const genesisTransaction = new Transaction(
      [new TxIn(0)],
      [new TxOut(wallet.getPublicKey(), 3)]
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
      0,
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

  generateNextBlockWithTransactions(receiverAddress, vote) {
    return this.generateRawNextBlock([
      coinbaseTransaction(wallet.getPublicKey(), this.getLastBlock().index + 1),
      wallet.createTransaction(
        receiverAddress,
        vote,
        getUTXOs(),
        transactionsPool.getTransactionPool()
      ),
    ]);
  }

  sendTransaction(receiverAddress, votes) {
    const tx = wallet.createTransaction(
      receiverAddress,
      votes,
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

module.exports = { Blockchain, blockChain, getUTXOs };
