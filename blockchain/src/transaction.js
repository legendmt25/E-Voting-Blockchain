const { SHA256 } = require('crypto-js');

const COIN_BASE_AMMOUNT = 50;

class Transaction {
  constructor(txIns, txOuts) {
    this.txIns = txIns;
    this.txOuts = txOuts;
    this.id = this.getTransactionId();
  }

  getTransactionId() {
    return SHA256(
      this.txIns
        .map((txIn) => txIn.txOutId + txIn.txOutIndex)
        .reduce((a, b) => a + b, '') +
        this.txOuts
          .map((txOut) => txOut.address + txOut.amount)
          .reduce((a, b) => a + b, '')
    ).toString();
  }

  signTxIn(txInIndex, UTXOs) {
    this.txIns[txInIndex].sign(this, UTXOs);
  }

  validate(UTXOs) {
    return (
      this.isStructureValid() &&
      this.getTransactionId() == this.id &&
      this.txIns.filter((el) => !el.validate(this, UTXOs)).length == 0 &&
      this.txIns.map((el) => el.getAmount(UTXOs)).reduce((a, b) => a + b) <=
        this.txOuts.reduce((a, b) => a.amount + b.amount)
    );
  }

  validateCoinbase(blockIndex) {
    return (
      this.getTransactionId() == this.id &&
      this.txIns.length == 1 &&
      this.txOuts.length == 1 &&
      this.txIns[0].txIndex == blockIndex &&
      this.txOuts[0].amount == COIN_BASE_AMMOUNT
    );
  }

  isStructureValid() {
    return (
      typeof this.id == 'string' &&
      Array.isArray(this.txIns) &&
      Array.isArray(this.txOuts) &&
      this.txOuts.filter((el) => !el.isStructureValid()).length == 0 &&
      this.txIns.filter((el) => !el.isStructureValid()).length == 0
    );
  }
}

module.exports = { Transaction };
const { wallet } = require('./wallet');
