const { SHA256 } = require('crypto-js');
const { calculateHashByBlock } = require('./utility');
const { UTXO } = require('./utxo');
const MINTING_WITHOUT_COIN_INDEX = 100;

class Block {
  constructor(
    index,
    previousHash,
    timestamp,
    data,
    difficulty,
    minterVotes,
    minterAddress
  ) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.difficulty = difficulty;
    this.minterVotes = minterVotes;
    this.minterAddress = minterAddress;
    this.hash = calculateHashByBlock(this);
  }

  static isStructureValid(block = this) {
    return (
      typeof block.index == 'number' &&
      typeof block.hash == 'string' &&
      typeof block.previousHash == 'string' &&
      typeof block.timestamp == 'number' &&
      typeof block.data == 'object' &&
      typeof block.difficulty == 'number' &&
      typeof block.minterVotes == 'number' &&
      typeof block.minterAddress == 'string'
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
          (txOut, index) => new UTXO(tx.id, index, txOut.address, txOut.vote)
        )
      )
      .reduce((a, b) => a.concat(b));
    const consumedUTXOs = this.data
      .map((tx) => tx.txIns)
      .reduce((a, b) => a.concat(b))
      .map((txIn) => new UTXO(txIn.txId, txIn.txIndex, '', 0));

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
      this.minterVotes += 1;
    }

    const balanceOverDifficulty =
      (Math.pow(2, 256) * this.minterVotes) / this.difficulty;
    const stakingHash = SHA256(
      this.previousHash + this.minterAddress + this.timestamp
    ).toString();
    const decimalStakingHash = parseInt(stakingHash, 16);
    return balanceOverDifficulty >= decimalStakingHash;
  }
}

module.exports = { Block };
