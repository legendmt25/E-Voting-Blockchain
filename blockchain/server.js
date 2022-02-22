const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const { getSockets, connectToPeers } = require('./src/p2p');
const { wallet } = require('./src/wallet');
const { blockChain, getUTXOs } = require('./src/blockchain');
const { transactionsPool } = require('./src/transactionPool');
const path = require('path');

const httpPORT = process.env.PORT || 3001;

async function startServer() {
  const app = express();
  app.use(bodyParser.json());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(cors());

  app.use('/blocks', (req, res) => {
    res.status(200).send(blockChain.getChain());
  });

  app.post('/block/:id', (req, res) => {
    res.status(200).send(blockChain.getChain()[parseInt(req.body.id)]);
  });

  app.post('/addPeer', (req, res) => {
    connectToPeers(req.body.peer);
    res.status(200).send('/peers');
  });

  app.get('/peers', (req, res) => {
    console.log(getSockets());
    res.status(200).send(getSockets());
  });

  app.get('/balance', (req, res) => {
    res.status(200).send({ balance: wallet.getBalance(getUTXOs()) });
  });

  app.get('/transactionsPool', (req, res) => {
    res.send(transactionsPool.getTransactionPool());
  });

  app.post('/mintBlock', (req, res) => {
    const block = blockChain.generateNextBlock();
    if (!block) res.status(400).send('could not generate block');
    else res.status(200).send(block);
  });

  app.post('/mintTransaction', (req, res) => {
    const addresses = req.body.addresses;
    const votes = req.body.votes;
    if (!addresses || !votes) {
      res.status(400).send();
      return;
    }
    res.send(blockChain.sendTransaction(addresses, votes));
  });

  app.get('/utxos', (req, res) => {
    res.send(getUTXOs());
  });

  app.get('/myutxos', (req, res) => {
    res.send(wallet.getWalletUTXOs(getUTXOs()));
  });

  app.get('/address', (req, res) => {
    res.send(wallet.getPublicKey());
  });

  app.listen(httpPORT, () => console.log(`Server running on ${httpPORT}`));
}

startServer();
