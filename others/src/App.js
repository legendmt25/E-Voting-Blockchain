import './App.css';
import { Link, Outlet } from 'react-router-dom';
import { Navbar } from 'react-bootstrap';

function App() {
  return (
    <div className="min-vh-100">
      <Navbar bg="light">
        <Navbar.Brand className="ms-5">
          <Link
            to="/blockchain"
            className="navbar-brand text-primary fs-3 d-inline-block p-2"
          >
            Blockchain
          </Link>
        </Navbar.Brand>
      </Navbar>
      <div className="App container">
        <Outlet />
      </div>
    </div>
  );
}

export default App;
