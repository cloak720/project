// src/components/Home.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from "react-icons/fa";
import { motion } from "framer-motion";
import footerlogo from "../images/footerlogo.png";
import community_volunteers from "../images/community_volunteers.jpg";
import "./Home.css";

const Home = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = sessionStorage.getItem("userId");
    const userRole = sessionStorage.getItem("role");

    if (!userId || !userRole) {
      console.log("Session data not found, redirecting to login...");
      sessionStorage.clear();
      setIsLoading(false);
      navigate("/login");
      return;
    }

    setUser({ 
      id: userId, 
      role: userRole, 
      firstName: sessionStorage.getItem("userName"), 
      email: sessionStorage.getItem("userEmail")
    });
    setIsLoading(false);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:8080/api/user/logout", {}, { withCredentials: true });
      sessionStorage.clear();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ display: "flex" }}>
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? "" : "collapsed"}`}>
        <div className="sidebar-header">Neighbor-Aid</div>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/user-profile">Edit Profile</Link></li>
          <li><Link to="/user-request">Apply Request</Link></li>
          <li><Link to="/volunteer-opportunities">Volunteering Opportunities</Link></li>
          <li><Link to="/submission/:requestId">My Requests</Link></li>
          {user && user.role === 2 && <li><Link to="/volunteer-dashboard">Volunteer Dashboard</Link></li>}
          {user && user.role === 0 && <li><Link to="/admin-dashboard">Admin Dashboard</Link></li>}
          <li><button onClick={handleLogout}>Logout</button></li>
        </ul>
      </div>

      <div className={`main-content ${isSidebarOpen ? "" : "collapsed"}`}>
        {/* Toggle Button */}
        <button 
          className="toggle-button" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? "×" : "☰"}
        </button>

        <div style={{ padding: "20px" }}>
          {/* Hero Section */}
          {!isSidebarOpen && (
            <motion.section
              className="hero-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <div>
                {user && <h1>Welcome to Neighbor-Aid, {user.firstName || "User"}</h1>}
                <p>Your platform for connecting neighbors and volunteers, making a difference one request at a time.</p>
                <Link to="/user-request">Get Started</Link>
              </div>
              <div>
                <img src={community_volunteers} alt="Community Volunteers" />
              </div>
            </motion.section>
          )}

          {/* Platform Overview */}
          <motion.section
            className="platform-overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <h2>About Neighbor-Aid</h2>
            <p>
              Neighbor-Aid connects individuals with volunteers who are eager to help. Whether it's for simple tasks like running errands or larger community projects, our platform ensures you receive the assistance you need.
            </p>
            <ul>
              <li>Connect with neighbors in need</li>
              <li>Volunteer opportunities in your community</li>
              <li>Empower people to make a difference locally</li>
            </ul>
          </motion.section>

          {/* User Feedback (Testimonials) */}
          <motion.section
            className="user-feedback"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
          >
            <h2>What Our Users Are Saying</h2>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="testimonial">
                <p>"Neighbor-Aid helped me find a volunteer opportunity that truly made a difference in my community. I highly recommend it!"</p>
                <h3>- Sarah Johnson</h3>
              </div>
              <div className="testimonial">
                <p>"A fantastic platform that connects neighbors in need with those willing to help. I've been able to contribute to so many great causes."</p>
                <h3>- John Doe</h3>
              </div>
            </div>
          </motion.section>

          {/* New Contact Section */}
          <motion.section
            className="contact-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.5 }}
          >
            <h2>Have Feedback?</h2>
            <p>
              We value your feedback on the work done by our volunteers. Click the button below to share your thoughts.
            </p>
            <Link to="/contact">
              <button className="contact-button">Contact Us</button>
            </Link>
          </motion.section>

          {/* Footer Section */}
          <motion.footer
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 2 }}
          >
            <div>
              <img src={footerlogo} alt="Neighbor-Aid Footer Logo" />
            </div>
            <ul>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="#">Blog</Link></li>
            </ul>
            <div className="social-icons">
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
                <FaFacebook size={30} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <FaTwitter size={30} />
              </a>
              <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">
                <FaLinkedin size={30} />
              </a>
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
                <FaInstagram size={30} />
              </a>
            </div>
          </motion.footer>
        </div>
      </div>
    </div>
  );
};

export default Home;
