import { useEffect, useState } from 'react';
import {
  FormControl,
  InputGroup,
  Button,
  Table,
  Form,
  Image,
} from 'react-bootstrap';
import TransactionsPool from './TransactionsPool';

function transformToTableElements(res) {
  return res.map((utxo, index) => (
    <tr key={index}>
      {Object.values(utxo).map((el) => (
        <td key={el}>{el}</td>
      ))}
    </tr>
  ));
}

async function mintBlock() {
  return await fetch('http://localhost:3001/mintBlock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
    .then((res) => res.json())
    .then((res) => console.log(res));
}

export default function Wallet() {
  const [UTXOs, setUTXOs] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/myutxos', { method: 'GET' })
      .then((res) => res.json())
      .then((res) => (res ? setUTXOs(transformToTableElements(res)) : null));
  }, []);

  let obj = {
    receiver1:
      '0427f704c8f2c812742848d20de7e6109ecfdabcfa97551424ac732129762cfb4283f204b7b349177e539b31a0a6cf3e06b85ac38f21be11ff51df9475685076f0',
    receiver2:
      '0427f704c8f2c812742848d20de7e6109ecfdabcfa97551424ac732129762cfb4283f204b7b349177e539b31a0a6cf3e06b85ac38f21be11ff51df9475685076f0',
    receiver3:
      '0427f704c8f2c812742848d20de7e6109ecfdabcfa97551424ac732129762cfb4283f204b7b349177e539b31a0a6cf3e06b85ac38f21be11ff51df9475685076f0',

    vote0: false,
    vote1: false,
    vote2: false,
  };
  const handleChange = (value, element) => (obj[element] = value);

  async function sendTransaction() {
    fetch('http://localhost:3001/mintTransaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addresses: [obj.receiver1, obj.receiver2, obj.receiver3],
        votes: [obj.vote0, obj.vote1, obj.vote2],
      }),
    });
  }

  const imgStyle = {
    objectFit: 'contain',
    height: 200,
    width: 200,
  };

  return (
    <div className="row d-flex flex-column align-items-center">
      <div className="mt-3 col-md-7">
        <div className="d-flex">
          <InputGroup className="mb-3">
            <Image
              src="http://localhost:3001/person1.jpg"
              roundedCircle
              thumbnail
              style={imgStyle}
            />
            <Form.Check
              onChange={(event) => handleChange(event.target.checked, 'vote0')}
              label="vote"
            />
          </InputGroup>
          <InputGroup className="mb-3">
            <Image
              src="http://localhost:3001/person2.jpg"
              roundedCircle
              thumbnail
              style={imgStyle}
            ></Image>
            <Form.Check
              onChange={(event) => handleChange(event.target.checked, 'vote1')}
              label="vote"
            />
          </InputGroup>
          <InputGroup className="mb-3">
            <Image
              src="http://localhost:3001/person3.avif"
              roundedCircle
              thumbnail
              style={imgStyle}
            ></Image>
            <Form.Check
              onChange={(event) => handleChange(event.target.checked, 'vote2')}
              label="vote"
            />
          </InputGroup>
        </div>

        <Button className="shadow-sm" onClick={sendTransaction}>
          Send
        </Button>
      </div>

      <div>
        <Button className="shadow-sm" onClick={mintBlock}>
          Mint Block
        </Button>
        <div className="border-top p-2 mt-2">
          <Table striped responsive>
            <thead>
              <tr>
                <th>TxId</th>
                <th>TxIndex</th>
                <th>address</th>
                <th>amount</th>
              </tr>
            </thead>
            <tbody>{UTXOs}</tbody>
          </Table>
        </div>
        <TransactionsPool></TransactionsPool>
      </div>
    </div>
  );
}
