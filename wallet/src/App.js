import './App.css';
import { Link, Outlet } from 'react-router-dom';
import { Navbar } from 'react-bootstrap';
import { useEffect, useState } from 'react';

function App() {
  let [balance, setBalance] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/balance', { method: 'GET' })
      .then(async (res) => res.json())
      .then((res) => (res ? setBalance(res.balance) : null));
  }, [balance]);  

  return (
    <div className="min-vh-100">
      <Navbar bg="light">
        <Navbar.Brand className="ms-5">
          <Link
            to="/mywallet"
            className="navbar-brand text-primary fs-3 d-inline-block p-2"
          >
            My Wallet
          </Link>
        </Navbar.Brand>
        <Navbar.Text>Balance: {balance}</Navbar.Text>
      </Navbar>
      <div className="App container">
        <Outlet />
      </div>
    </div>
  );
}

export default App;
