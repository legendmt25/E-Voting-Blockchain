const { SHA256 } = require('crypto-js');
const { TxIn } = require('./txin');
const { TxOut } = require('./txout');
const { Transaction } = require('./transaction');

const BASE_VOTES = 3;

const MessageType = Object.freeze({
  QUERY_LATEST: 0,
  QUERY_ALL: 1,
  RESPONSE_BLOCKCHAIN: 2,
  QUERY_TRANSACTION_POOL: 3,
  RESPONSE_TRANSACTION_POOL: 4,
});

function coinbaseTransaction(address, blockIndex) {
  const txIn = new TxIn(blockIndex);
  return new Transaction([txIn], [new TxOut(address, BASE_VOTES)]);
}

const calculateHashByBlock = (block) => {
  return SHA256(
    block.index +
      block.previousHash +
      block.timestamp +
      JSON.stringify(block.data) +
      block.difficulty +
      block.minterBalance +
      block.minterAddress
  ).toString();
};

const parse = (data) => {
  try {
    return JSON.parse(data);
  } catch (e) {
    console.log(e);
    return null;
  }
};

const broadcast = (obj) =>
  require('./p2p.js')
    .getSockets()
    .forEach((socket) =>
      socket.send(
        JSON.stringify({
          type: obj.type,
          data: obj.data,
        })
      )
    );

module.exports = {
  coinbaseTransaction,
  calculateHashByBlock,
  broadcast,
  parse,
  MessageType,
};
