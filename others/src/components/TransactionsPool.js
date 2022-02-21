import { useEffect, useState } from 'react';

export default function TransactionsPool() {
  const [transactionsPool, setTransactionsPool] = useState(null);
  useEffect(() => {
    fetch('http://localhost:3001/transactionsPool', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then((res) =>
        res
          ? setTransactionsPool(
              res.map((tx) => (
                <div>
                  {Object.entries(tx).map((x) => (
                    <div>
                        {`${x[0]} ${JSON.stringify(x[1])}}`}
                    </div>
                  ))}
                </div>
              ))
            )
          : null
      );
  }, []);

  return <div className='border overflow-auto p-3'>{transactionsPool}</div>;
}
