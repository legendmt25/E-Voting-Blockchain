class TxOut {
  constructor(address, amount) {
    this.address = address;
    this.amount = amount;
  }

  isStructureValid() {
    return typeof this.address == 'string' && typeof this.amount == 'number';
  }
}

module.exports = { TxOut };
