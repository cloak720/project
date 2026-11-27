import React from "react";
import { Link } from "react-router-dom";
import logo from "../images/footerlogo.png";

const Footer = () => (
  <footer className="site-footer">
    <div className="container site-footer__inner">
      <div className="site-footer__brand">
        <img src={logo} alt="" width="40" height="40" />
        <div>
          <strong>NeighborAid</strong>
          <p>Neighbors helping neighbors, one request at a time.</p>
        </div>
      </div>
      <nav className="site-footer__links" aria-label="Footer">
        <Link to="/terms">Terms</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/contact">Contact</Link>
      </nav>
      <p className="site-footer__copy">© {new Date().getFullYear()} NeighborAid</p>
    </div>
  </footer>
);

export default Footer;
