const ecInstance = require('elliptic');
const ec = new ecInstance.ec('secp256k1');

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

module.exports = { TxIn };
const { wallet } = require('./wallet');
