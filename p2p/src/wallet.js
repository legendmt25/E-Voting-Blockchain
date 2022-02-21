const ecInstance = require('elliptic');
const { existsSync, readFileSync, unlinkSync, writeFileSync } = require('fs');
const path = require('path');
const { TxIn, Transaction, TxOut } = require('./transaction');

const ec = new ecInstance.ec('secp256k1');
const PRIVATE_KEY_LOCATION =
  process.env.PRIVATE_KEY || path.join(__dirname, 'wallet/private_key');

class Wallet {
  constructor(privateKeyLocation) {
    this.privateKeyLocation = privateKeyLocation;
    if (existsSync(this.privateKeyLocation)) return;
    writeFileSync(this.privateKeyLocation, this.generatePrivateKey());
  }

  getPrivateKey() {
    return readFileSync(this.privateKeyLocation, 'utf-8');
  }
  getPublicKey() {
    return ec.keyFromPrivate(this.getPrivateKey(), 'hex').getPublic('hex');
  }

  generatePrivateKey() {
    return ec.genKeyPair().getPrivate().toString(16);
  }

  deleteWallet() {
    if (!existsSync(this.privateKeyLocation)) return;
    unlinkSync(this.privateKeyLocation);
  }

  getBalance(UTXOs) {
    return UTXOs.filter((utxo) => utxo.address == this.getPublicKey())
      .map((utxo) => utxo.amount)
      .reduce((a, b) => a + b, 0);
  }

  filterTxPoolIns(UTXOs, transactionsPool) {
    const txIns = transactionsPool.map((tx) => tx.txIns).flat();
    return UTXOs.filter(
      (utxo) =>
        !txIns.find(
          (txIn) => txIn.txId == utxo.txId && txIn.txIndex == utxo.txIndex
        )
    );
  }

  getWalletUTXOs(UTXOs) {
    return UTXOs.filter((utxo) => utxo.address == this.getPublicKey());
  }

  findTxOutsForAmount(amount, UTXOs) {
    const myUTXOs = this.getWalletUTXOs(UTXOs);
    let currentAmount = 0;
    const includedUTXOs = [];
    myUTXOs.forEach((utxo) => {
      includedUTXOs.push(utxo);
      currentAmount += utxo.amount;
      if (currentAmount + utxo.amount > amount) return;
    });
    return { includedUTXOs, leftAmount: currentAmount - amount };
  }

  createTransaction(receiverAddress, amount, UTXOs, txPool) {
    const filtered = this.filterTxPoolIns(UTXOs, txPool);
    const { includedUTXOs, leftAmount } = this.findTxOutsForAmount(
      amount,
      UTXOs
    );
    const txIns = includedUTXOs.map((utxo) => {
      let txIn = new TxIn(utxo.txIndex);
      txIn.txId = utxo.txId;
      return txIn;
    });

    const tx = new Transaction(
      txIns,
      this.createTxOuts(receiverAddress, amount, leftAmount)
    );
    tx.txIns.forEach((txIn) => (txIn.signiture = txIn.sign(tx, UTXOs)));
    return tx;
  }

  createTxOuts(receiverAddress, amount, leftAmount) {
    if (leftAmount == 0) {
      return [new TxOut(receiverAddress, amount)];
    }
    return [
      new TxOut(receiverAddress, amount),
      new TxOut(this.getPublicKey(), leftAmount),
    ];
  }
}

const wallet = new Wallet(PRIVATE_KEY_LOCATION);

module.exports = { Wallet, wallet };
