import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function Block() {
  let { id } = useParams();
  const [block, setBlock] = useState({});

  useEffect(() => {
    fetch(`http://localhost:3001/block/:id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
      }),
    })
      .then((res) => res.json())
      .then((res) => setBlock(res));
  }, [id]);

  const transactions = (transactions) =>
    transactions
      ? transactions.map((tx, index) => (
          <div key={index}>
            <span className="fs-6 text-muted ps-2">Transaction: {tx.id}</span>
            <div className="d-flex border p-3 mx-5 mt-3">
              <div className="w-50 text-break">
                {tx.txIns.map((txIn, index) => (
                  <div key={index} className="d-flex flex-column">
                    <span>id: {txIn.txId}</span>
                    <span>index: {txIn.txIndex}</span>
                    <span>signiture: {txIn.signiture}</span>
                  </div>
                ))}
              </div>
              <div className="w-50 text-break">
                {tx.txOuts.map((txOut, index) => (
                  <div key={index} className="d-flex flex-column">
                    <span>address: {txOut.address}</span>
                    <span>vote: {txOut.vote}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      : null;

  return (
    <div>
      <h2 className="fs-2">Block {block.index}</h2>
      <div className="text-muted fs-6 ps-2">hash: {block.hash}</div>
      <div className="text-muted fs-6 ps-2">previous hash: {block.previousHash}</div>
      <div>
        <span className="fs-3">Transactions:</span>
        <div>{transactions(block.data)}</div>
      </div>
    </div>
  );
}
