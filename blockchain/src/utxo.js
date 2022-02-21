class UTXO {
  constructor(txId, txIndex, address, amount) {
    this.txId = txId;
    this.txIndex = txIndex;
    this.address = address;
    this.amount = amount;
  }
}

module.exports = { UTXO };
