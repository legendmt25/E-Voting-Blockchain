const { SHA256 } = require('crypto-js');
const ecInstance = require('elliptic');
const COIN_BASE_AMMOUNT = 50;

const ec = new ecInstance.ec('secp256k1');

class UTXO {
  constructor(txId, txIndex, address, amount) {
    this.txId = txId;
    this.txIndex = txIndex;
    this.address = address;
    this.amount = amount;
  }
}

class TxIn {
  constructor(index) {
    this.txId = '';
    this.txIndex = index;
    this.signiture = '';
  }

  isStructureValid() {
    return (
      typeof this.txId == 'string' &&
      typeof this.txIndex == 'number' &&
      typeof this.signiture == 'string'
    );
  }

  validate(tx, UTXOs) {
    const refUTXO = this.findUTXO(UTXOs);
    const refAddress = refUTXO.address;
    if (!refAddress) throw Error('validate TxIn');
    return ec.keyFromPublic(refAddress, 'hex').verify(tx.id, this.signiture);
  }

  findUTXO(UTXOs) {
    return UTXOs.find(
      (el) => el.txId == this.txId && el.txIndex == this.txIndex
    );
  }

  getAmount(UTXOs) {
    return this.findUTXO(UTXOs).amount;
  }

  sign(tx, UTXOs) {
    const foundUTXO = this.findUTXO(UTXOs);
    if (
      foundUTXO.address !=
      ec.keyFromPrivate(wallet.getPrivateKey(), 'hex').getPublic().encode('hex')
    )
      throw new Error('signTxIn');
    return ec
      .keyFromPrivate(wallet.getPrivateKey(), 'hex')
      .sign(tx.id, 'base64')
      .toDER('hex');
  }
}

class TxOut {
  constructor(address, amount) {
    this.address = address;
    this.amount = amount;
  }

  isStructureValid() {
    return typeof this.address == 'string' && typeof this.amount == 'number';
  }
}

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

module.exports = { Transaction, TxIn, TxOut, UTXO, ec };
const { wallet } = require('./wallet');
