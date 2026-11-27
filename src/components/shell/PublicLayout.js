import React, { Suspense, useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { ArrowRight, Moon, Sun } from "lucide-react";
import { useSession, useTheme } from "../../context/AppContext";
import { homePathFor } from "../../lib/auth";
import { Logo } from "../art/Logo";

const MarketingNav = () => {
  const session = useSession();
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={`mnav ${scrolled ? "is-scrolled" : ""}`}>
      <div className="container mnav__inner">
        <Link to="/" className="brand" aria-label="NeighborAid home">
          <Logo />
        </Link>
        <nav className="mnav__links" aria-label="Main">
          <a href="/#how">How it works</a>
          <a href="/#features">Features</a>
          <a href="/#roles">Get involved</a>
        </nav>
        <div className="mnav__actions">
          <button
            type="button"
            className="icon-btn"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          {session ? (
            <Link to={homePathFor(session.role)} className="btn btn--primary">
              Open dashboard <ArrowRight size={15} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn--ghost mnav__login">
                Log in
              </Link>
              <Link to="/register" className="btn btn--primary">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

const Footer = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer__grid">
        <div>
          <Link to="/" className="brand" aria-label="NeighborAid home">
            <Logo size={24} />
          </Link>
          <p className="footer__tagline">Help from the people next door. Errands, rides, repairs and community projects.</p>
        </div>
        <div>
          <h3>Product</h3>
          <ul>
            <li>
              <a href="/#how">How it works</a>
            </li>
            <li>
              <a href="/#features">Features</a>
            </li>
          </ul>
        </div>
        <div>
          <h3>Join</h3>
          <ul>
            <li>
              <Link to="/register?role=1">Ask for help</Link>
            </li>
            <li>
              <Link to="/register?role=2">Volunteer</Link>
            </li>
            <li>
              <Link to="/login">Log in</Link>
            </li>
          </ul>
        </div>
        <div>
          <h3>Legal</h3>
          <ul>
            <li>
              <Link to="/terms">Terms</Link>
            </li>
            <li>
              <Link to="/privacy">Privacy</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer__base">
        <span>© {new Date().getFullYear()} NeighborAid</span>
        <span>Built for neighborhoods, not for profit.</span>
      </div>
    </div>
  </footer>
);

const PublicLayout = () => (
  <div className="public">
    <a href="#main" className="skip-link">
      Skip to content
    </a>
    <MarketingNav />
    <main id="main" tabIndex={-1}>
      <Suspense fallback={<div style={{ minHeight: "70vh" }} />}>
        <Outlet />
      </Suspense>
    </main>
    <Footer />
  </div>
);

export default PublicLayout;
