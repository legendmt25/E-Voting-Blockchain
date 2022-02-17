const { SHA256 } = require('crypto-js');

const calculateHash = (
  index,
  previousHash,
  timestamp,
  data,
  difficulty,
  minterBalance,
  minterAddress
) =>
  SHA256(
    index + previousHash + timestamp + data + difficulty,
    minterBalance,
    minterAddress
  ).toString();

class Block {
  constructor(
    index,
    previousHash,
    timestamp,
    data,
    difficulty,
    minterBalance,
    minterAddress
  ) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.difficulty = difficulty;
    this.minterBalance = minterBalance;
    this.minterAddress = minterAddress;

    this.hash = calculateHash(
      index,
      previousHash,
      timestamp,
      data,
      difficulty,
      minterBalance,
      minterAddress
    );
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.genesisBlock()];
  }
  genesisBlock() {
    return new Block(0, 'null', Date.now(), 'genesis block');
  }

  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  isBlockValid(prevBlock, nextBlock) {
    if (prevBlock.index + 1 != nextBlock.index) return false;
    if (prevBlock.hash != nextBlock.previousHash) return false;
    if (nextBlock.hash != calculateHash(nextBlock)) return false;

    return true;
  }

  getChain() {
    return this.chain;
  }

  isBlockStructureValid(block) {
    return (
      typeof block.index == 'number' &&
      typeof block.hash == 'string' &&
      typeof block.previousHash == 'string' &&
      typeof block.timestamp == 'number' &&
      typeof block.data == 'string'
    );
  }

  addBlockToChain(nextBlock) {
    if (!this.isBlockValid(this.getLastBlock(), nextBlock)) {
      return false;
    }
    this.chain.push(nextBlock);
    return true;
  }

  isChainValid(chain = this.chain) {
    for (let i = 1; i < chain.length; ++i) {
      if (!this.isBlockValid(chain[i - 1], chain[i])) {
        return false;
      }
    }
    return false;
  }

  replaceChain(newChain) {
    if (newChain.length > this.chain.length && this.isChainValid(newChain)) {
      this.chain = newChain;
    }
  }
}

const blockChain = new Blockchain();

module.exports = { Block, Blockchain, calculateHash, blockChain };
