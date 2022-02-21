import { useEffect, useState } from 'react';
import { FormControl, InputGroup, Button, Table } from 'react-bootstrap';
import TransactionsPool from './TransactionsPool';

function transformToTableElements(res) {
  return res.map((utxo) => (
    <tr key={utxo.txId}>
      {Object.values(utxo).map((el) => (
        <td>{el}</td>
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

  let obj = { receiver: '', amount: 0 };
  const handleChange = (event, element) => {
    event.preventDefault();
    obj[element] = event.target.value;
  };

  async function sendTransaction() {
    fetch('http://localhost:3001/mintTransaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: obj.receiver,
        amount: obj.amount,
      }),
    });
  }

  return (
    <div className="row d-flex flex-column align-items-center">
      <div className="mt-3 col-md-7">
        <InputGroup className="mb-3 shadow-sm">
          <InputGroup.Text>Receiver</InputGroup.Text>
          <FormControl
            onChange={(event) => handleChange(event, 'receiver')}
          ></FormControl>
        </InputGroup>
        <InputGroup className="mb-3 shadow-sm">
          <InputGroup.Text>Amount</InputGroup.Text>
          <FormControl
            onChange={(event) => handleChange(event, 'amount')}
          ></FormControl>
        </InputGroup>
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
