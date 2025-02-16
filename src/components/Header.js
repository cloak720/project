// src/components/Header.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaBell } from 'react-icons/fa';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Retrieve user data from session storage
  const userRole = sessionStorage.getItem('role');
  const userEmail = sessionStorage.getItem('userEmail');

  // Determine if current page is an auth page.
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  // Always call hooks before conditional returns.
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get("http://localhost:8080/api/contact", { withCredentials: true });
        // Filter messages that belong to this user (by email) and that have an admin reply.
        const notifs = res.data.filter(msg => 
          msg.email && msg.email.toLowerCase() === userEmail?.toLowerCase() &&
          msg.reply && msg.reply.trim() !== ""
        );
        setNotifications(notifs);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    if (userEmail) {
      fetchNotifications();
    }
  }, [userEmail]);

  // Logout handler
  const handleLogout = async () => {
    try {
      const userEmailStored = sessionStorage.getItem('userEmail');
      const userId = sessionStorage.getItem('userId');
      if (!userEmailStored || !userId) {
        console.error("User is not logged in.");
        return;
      }
      await axios.post('http://localhost:8080/api/user/logout', { userEmail: userEmailStored, userId }, {
        withCredentials: true,
      });
    } finally {
      sessionStorage.clear();
      navigate('/login');
    }
  };

  // If on an auth page, do not render header.
  if (isAuthPage) return null;

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo Section */}
        <div className="logo-section">
          <Link to="/" className="logo-link">
            <span className="logo-text">NeighbourAid</span>
          </Link>
        </div>

        {/* Notification Section */}
        <div className="notification-container">
          <button 
            className="notification-button" 
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <FaBell size={24} />
            {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
          </button>
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h3>Notifications ({notifications.length})</h3>
                <button 
                  onClick={() => {
                    setNotifications([]); // Clear notifications
                    setShowNotifications(false); // Close dropdown
                  }}
                >
                  Mark all read
                </button>
              </div>
              {notifications.length === 0 ? (
                <div className="empty-notifications">
                  No new notifications
                </div>
              ) : (
                <ul>
                  {notifications.map(notif => (
                    <li key={notif.id}>
                      <div className="notification-icon">
                        <FaBell size={16} />
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">
                          {notif.subject}
                        </div>
                        <div className="notification-message">
                          {notif.reply}
                        </div>
                        <div className="notification-time">
                          <span>Admin response</span>
                          {notif.createdAt && (
                            <span>· {new Date(notif.createdAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          {userRole === "1" && (
            <>
              <Link to="/" className="nav-item">
                <span>Home</span>
              </Link>
              <Link to="/user-profile" className="nav-item">
                <span>Profile</span>
              </Link>
              <Link to="/user-request" className="nav-item">
                <span>Requests</span>
              </Link>
              <Link to="/volunteer-opportunities" className="nav-item">
                <span>Opportunities</span>
              </Link>
              <Link to="/contact" className="nav-item">
                <span>Contact</span>
              </Link>
            </>
          )}

          {userRole === "2" && (
            <>
              <Link to="/volunteer-home" className="nav-item">
                <span>Dashboard</span>
              </Link>
              <Link to="/volunteer-opportunities" className="nav-item">
                <span>Opportunities</span>
              </Link>
              <Link to="/user-profile" className="nav-item">
                <span>Profile</span>
              </Link>
              <Link to="/contact" className="nav-item">
                <span>Contact</span>
              </Link>
            </>
          )}

          {userRole === "0" && (
            <>
              <Link to="/admin-dashboard" className="nav-item">
                <span>Dashboard</span>
              </Link>
              <Link to="/volunteer-opportunities" className="nav-item">
                <span>Manage Ops</span>
              </Link>
              <Link to="/user-profile" className="nav-item">
                <span>Profile</span>
              </Link>
            </>
          )}
          {/* Logout Button */}
          <center>
            <button onClick={handleLogout} className="nav-item logout-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
              <span>Logout</span>
            </button>
          </center>
        </nav>

        {/* Mobile Menu Toggle Button */}
        <button 
          className="menu-toggle" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation"
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </div>
    </header>
  );
};

export default Header;
