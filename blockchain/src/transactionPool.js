class TransactionPool {
  constructor() {
    this.transactionsPool = [];
  }

  getTransactionPool() {
    return JSON.parse(JSON.stringify(this.transactionsPool));
  }

  isTxForPoolValid(transaction) {
    let txPoolIns = this.transactionsPool.map((tx) => tx.txIns).flat();
    return (
      transaction.txIns.filter((txIn) =>
        txPoolIns.find(
          (txPoolIn) =>
            txPoolIn.txId == txIn.txId && txPoolIn.txIndex == txIn.txIndex
        )
      ).length == 0
    );
  }

  addToTransactionPool(transaction, UTXOs) {
    if (!transaction.validate(UTXOs)) {
      console.log('addToTransactionPool1');
      return;
    }
    if (!this.isTxForPoolValid(transaction)) {
      console.log('addToTransactionPool2');
      return;
    }

    this.transactionsPool.push(transaction);
  }

  updateTransactionPool(UTXOs) {
    const invalidTxs = this.transactionsPool.filter((tx) =>
      tx.txIns.filter((txIn) =>
        UTXOs.find(
          (utxo) => utxo.txId == txIn.tdId && utxo.txIndex == txIn.txIndex
        )
      )
    );

    if (invalidTxs.length > 0) {
      this.transactionsPool = this.transactionsPool.filter(
        (tx) =>
          !invalidTxs.find(
            (invalidTx) =>
              invalidTx.txId == tx.txId && invalidTx.txIndex == tx.txIndex
          )
      );
    }
  }
}

const transactionsPool = new TransactionPool();
module.exports = { TransactionPool, transactionsPool };
