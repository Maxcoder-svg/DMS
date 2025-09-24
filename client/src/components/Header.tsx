import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, Bell, Settings } from 'lucide-react';

function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>DMS</h1>
          <span>Discipline Management System</span>
        </Link>

        {isAuthenticated ? (
          <nav className="nav">
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/tasks/new" className="nav-link">
              New Task
            </Link>
            <Link to="/notifications/test" className="nav-link">
              <Bell size={18} />
              Notifications
            </Link>
            
            <div className="user-menu">
              <span className="user-name">
                <User size={18} />
                {user?.username}
              </span>
              <button onClick={handleLogout} className="logout-btn">
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </nav>
        ) : (
          <nav className="nav">
            <Link to="/login" className="nav-link">
              Login
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Header;