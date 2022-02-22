class UTXO {
  constructor(txId, txIndex, address, vote) {
    this.txId = txId;
    this.txIndex = txIndex;
    this.address = address;
    this.vote = vote;
  }
}

module.exports = { UTXO };
