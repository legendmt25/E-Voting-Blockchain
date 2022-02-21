import { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function Blockchain() {
  const [blockchain, setBlockchain] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/blocks', { method: 'GET' })
      .then((res) => res.json())
      .then((res) =>
        res
          ? setBlockchain(
              res.map((block) => (
                <div
                  key={block.index}
                  className="w-25 text-break p-3 bg-light shadow rounded mt-5"
                >
                  <div>
                    <span className="text-muted">Block Id: </span>
                    <span className="text-primary">{block.index}</span>
                  </div>
                  <div>
                    <span className="text-muted">Hash: </span>
                    <span className="text-primary">{block.hash}</span>
                  </div>
                  <div>
                    <span className="text-muted">Previous hash: </span>
                    <span className="text-primary">{block.previousHash}</span>
                  </div>
                  <Link to={{ pathname: `/block/${block.index}` }}>
                    <Button className="py-2 px-3 mt-3 shadow-sm">Show</Button>
                  </Link>
                </div>
              ))
            )
          : null
      );
  }, []);

  return <div className="d-flex flex-wrap">{blockchain}</div>;
}
