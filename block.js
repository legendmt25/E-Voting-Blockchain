import { SHA256 } from 'crypto-js';

export const calculateHash = (index, previousHash, timestamp, data) =>
  CryptoJS.SHA256(index + previousHash + timestamp + data).toString();

export class Block {
  constructor(index, previousHash, timestamp, data) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;

    this.hash = calculateHash(index, previousHash, timestamp, data);
  }
}