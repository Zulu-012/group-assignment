// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        CareerGuide
      </Link>
      
      <ul className="navbar-nav">
        {user ? (
          <>
            <li className="navbar-user">
              <div className="user-info">
                <span>Welcome, {user.name || user.email}</span>
                <span className="user-role">{user.role}</span>
              </div>
              <Link to="/dashboard" className="btn btn-outline">
                Dashboard
              </Link>
              <button onClick={onLogout} className="btn btn-danger">
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/login" className="btn btn-outline">
                Login
              </Link>
            </li>
            <li>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;