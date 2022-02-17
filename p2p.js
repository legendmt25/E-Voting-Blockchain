const { blockChain } = require('./blockchain');
const { Server, WebSocket } = require('ws');

const PORT = process.env.wsPORT || 3000;

const MessageType = Object.freeze({
  QUERY_LATEST: 0,
  QUERY_ALL: 1,
  RESPONSE_BLOCKCHAIN: 2,
  QUERY_TRANSACTION_POOL: 3,
  RESPONSE_TRANSACTION_POOL: 4,
});

const parse = (data) => {
  try {
    return JSON.parse(data);
  } catch (e) {
    console.log(e);
    return null;
  }
};

const broadcast = (obj) =>
  sockets.forEach((socket) =>
    socket.send(
      JSON.stringify({
        type: obj.type,
        data: obj.data,
      })
    )
  );

const connectToPeers = (newPeer) => {
  const socket = new WebSocket('ws://localhost:3000');
  socket.on('open', () => initSocketConnection(socket));
  socket.on('error', () => {
    console.log('error');
    socket.close();
  });
};

const sockets = [];
const getSockets = () => sockets;

const server = new Server({ port: PORT }, () =>
  console.log(`WebSocket P2P listening on ${PORT}`)
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
    }

    if (obj.type == MessageType.RESPONSE_BLOCKCHAIN) {
      const receivedBlocks = parse(obj.data);
      if (receivedBlocks == null) throw new Error('Invalid blocks');
      if (receivedBlocks.length == 0) return;

      const lastBlockReceived = receivedBlocks[receivedBlocks.length - 1];
      const lastBlockHeld = blockChain.getLastBlock();
      if (!blockChain.isBlockStructureValid(lastBlockReceived)) {
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
    }
  });
};

module.exports = { MessageType, parse, broadcast, connectToPeers, getSockets };
