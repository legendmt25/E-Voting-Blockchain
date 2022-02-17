const express = require('express');
const bodyParser = require('body-parser');
const { blockChain } = require('./blockchain');
const { getSockets, connectToPeers } = require('./p2p');

const httpPORT = process.env.PORT || 3001;

async function startServer() {
  const app = express();
  app.use(bodyParser.json());

  app.use('/blocks', (req, res) => {
    res.status(200).send(blockChain.getChain());
  });

  app.post('/addPeer', (req, res) => {
    connectToPeers(req.body.peer);
    res.send('/peers');
  });

  app.get('/peers', (req, res) => {
    res.status(200).send(getSockets());
  });

  app.listen(httpPORT, () => console.log(`Server running on ${httpPORT}`));
}

startServer();
