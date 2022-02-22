const ecInstance = require('elliptic');
const { existsSync, readFileSync, unlinkSync, writeFileSync } = require('fs');
const path = require('path');
const { Transaction } = require('./transaction');
const { TxOut } = require('./txout');
const { TxIn } = require('./txin');

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

  findTxOutsForAmount(votesNumber, UTXOs) {
    const myUTXOs = this.getWalletUTXOs(UTXOs);
    let currentVotes = 0;
    const includedUTXOs = [];
    myUTXOs.forEach((utxo) => {
      includedUTXOs.push(utxo);
      currentVotes += utxo.vote;
      if (currentVotes >= votesNumber) return;
    });
    return { includedUTXOs, leftVotes: currentVotes - votesNumber };
  }

  createTransaction(receiverAddresses, votes, UTXOs, txPool) {
    const filtered = this.filterTxPoolIns(UTXOs, txPool);
    const { includedUTXOs, leftVotes } = this.findTxOutsForAmount(
      votes.length,
      UTXOs
    );

    const txIns = includedUTXOs.map((utxo) => {
      let txIn = new TxIn(utxo.txIndex);
      txIn.txId = utxo.txId;
      return txIn;
    });

    const tx = new Transaction(
      txIns,
      this.createTxOuts(receiverAddresses, votes, leftVotes)
    );
    tx.txIns.forEach((txIn) => (txIn.signiture = txIn.sign(tx, UTXOs)));
    return tx;
  }

  createTxOuts(receiverAddresses, votes, leftVotes) {
    let txOuts = [];
    for (let i = 0; i < votes.length; ++i) {
      if (votes[i]) {
        txOuts.push(new TxOut(receiverAddresses[i], Number(votes[i])));
      }
    }
    if (leftVotes != 0) {
      txOuts.push(new TxOut(wallet.getPublicKey(), leftVotes));
    }
    return txOuts;
  }
}

const wallet = new Wallet(PRIVATE_KEY_LOCATION);

module.exports = { Wallet, wallet };
