class TxOut {
  constructor(address, vote) {
    this.address = address;
    this.vote = vote;
  }

  isStructureValid() {
    return typeof this.address == 'string' && typeof this.vote == 'number';
  }
}

module.exports = { TxOut };
