const { SHA256 } = require('crypto-js');

const BASE_VOTES = 3;

class Transaction {
  constructor(txIns, txOuts) {
    this.txIns = txIns;
    this.txOuts = txOuts;
    this.id = this.getTransactionId();
  }

  getTransactionId() {
    return SHA256(
      this.txIns
        .map((txIn) => txIn.txId + txIn.txIndex)
        .reduce((a, b) => a + b, '') +
        this.txOuts
          .map((txOut) => txOut.address + txOut.vote)
          .reduce((a, b) => a + b, '')
    ).toString();
  }

  validate(UTXOs) {
    return (
      this.isStructureValid() &&
      this.getTransactionId() == this.id &&
      this.txIns.filter((el) => !el.validate(this, UTXOs)).length == 0
    );
  }

  validateCoinbase(blockIndex) {
    return (
      this.getTransactionId() == this.id &&
      this.txIns.length == 1 &&
      this.txOuts.length == 1 &&
      this.txIns[0].txIndex == blockIndex &&
      this.txOuts[0].vote == BASE_VOTES
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
