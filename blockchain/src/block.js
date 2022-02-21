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

module.exports = { Block };
