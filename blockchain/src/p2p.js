const { Server, WebSocket } = require('ws');

const { blockChain, getUTXOs } = require('./blockchain');
const { transactionsPool } = require('./transactionPool');
const { Block } = require('./block');
const { MessageType, parse } = require('./utility');

const connectToPeers = (newPeer) => {
  const socket = new WebSocket(newPeer);
  socket.on('open', () => initSocketConnection(socket));
  socket.on('error', () => {
    console.log('error');
    socket.close();
  });
};

const sockets = [];
const getSockets = () => sockets;

const wsPORT = process.env.wsPORT || 4000;
const server = new Server({ port: wsPORT }, () =>
  console.log(`WebSocket P2P listening on ${wsPORT}`)
);
server.on('connection', (socket) => {
  initSocketConnection(socket);
  socket.send(
    JSON.stringify({
      type: MessageType.QUERY_LATEST,
      data: null,
    })
  );
});

const initSocketConnection = (socket) => {
  const closeConnection = (socket) => {
    sockets.splice(sockets.indexOf(socket), 1);
    return true;
  };
  sockets.push(socket);
  socket.on('close', () => closeConnection(socket));
  socket.on('error', () => closeConnection(socket));

  socket.on('message', (data) => {
    const obj = parse(data);
    if (obj == null) return;

    if (obj.type == MessageType.QUERY_LATEST) {
      socket.send(
        JSON.stringify({
          type: MessageType.RESPONSE_BLOCKCHAIN,
          data: JSON.stringify([blockChain.getLastBlock()]),
        })
      );
    }

    if (obj.type == MessageType.QUERY_ALL) {
      socket.send(
        JSON.stringify({
          type: MessageType.RESPONSE_BLOCKCHAIN,
          data: JSON.stringify(blockChain.getChain()),
        })
      );
    }

    if (obj.type == MessageType.QUERY_TRANSACTION_POOL) {
      socket.send(
        JSON.stringify({
          type: MessageType.RESPONSE_TRANSACTION_POOL,
          data: JSON.stringify(transactionsPool.getTransactionPool()),
        })
      );
    }

    if (obj.type == MessageType.RESPONSE_BLOCKCHAIN) {
      const receivedBlocks = parse(obj.data);
      if (receivedBlocks == null) throw new Error('Invalid blocks');
      if (receivedBlocks.length == 0) return;

      const lastBlockReceived = receivedBlocks[receivedBlocks.length - 1];
      const lastBlockHeld = blockChain.getLastBlock();
      if (!Block.isStructureValid(lastBlockReceived)) {
        console.log('ivalid block structure');
      }

      if (lastBlockReceived.index <= lastBlockHeld.index) return;

      if (lastBlockHeld.hash == lastBlockReceived.previousHash) {
        blockChain.addBlockToChain(lastBlockReceived) &&
          broadcast({
            type: MessageType.RESPONSE_BLOCKCHAIN,
            data: blockChain.getLastBlock(),
          });
      } else if (receivedBlocks.length == 1) {
        broadcast({
          type: MessageType.QUERY_ALL,
          data: null,
        });
      } else {
        blockChain.replaceChain(receivedBlocks);
      }
    }

    if (obj.type == MessageType.RESPONSE_TRANSACTION_POOL) {
      const receivedTransactions = parse(obj.data);
      if (receivedTransactions == null) return;
      receivedTransactions.forEach((tx) => {
        transactionsPool.addToTransactionPool(tx, getUTXOs);
        broadcast({
          type: MessageType.RESPONSE_TRANSACTION_POOL,
          data: JSON.stringify(transactionsPool.getTransactionPool()),
        });
      });
    }
  });
};

module.exports = { connectToPeers, getSockets };
