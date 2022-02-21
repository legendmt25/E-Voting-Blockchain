const { TxIn, TxOut, Transaction } = require('./transaction');

const COIN_BASE_AMMOUNT = 50;
function coinbaseTransaction(address, blockIndex) {
  const txIn = new TxIn(blockIndex);
  return new Transaction([txIn], [new TxOut(address, COIN_BASE_AMMOUNT)]);
}

module.exports = { coinbaseTransaction };
