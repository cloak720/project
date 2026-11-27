import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/AppContext";
import { Logo } from "../../components/art/Logo";
import NeighborhoodMap from "../../components/art/NeighborhoodMap";

/** Split-screen frame for login and registration: the form on the left, artwork on the right. */
const AuthLayout = ({ title, subtitle, children, footer, aside }) => {
  const { theme, toggle } = useTheme();
  return (
    <div className="auth">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="auth__panel">
        <header className="auth__top">
          <Link to="/" className="brand" aria-label="NeighborAid home">
            <Logo />
          </Link>
          <button
            type="button"
            className="icon-btn"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </header>
        <motion.main
          id="main"
          tabIndex={-1}
          className="auth__form"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <h1 className="auth__title">{title}</h1>
          {subtitle && <p className="auth__sub">{subtitle}</p>}
          {children}
          {footer && <p className="auth__footer">{footer}</p>}
        </motion.main>
        <footer className="auth__legal">
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <span>© {new Date().getFullYear()} NeighborAid</span>
        </footer>
      </div>

      <aside className="auth__art" aria-hidden="true">
        <div className="auth__art-grid" />
        <div className="auth__map">
          <NeighborhoodMap />
        </div>
        <div className="auth__card auth__card--a">
          <span className="badge badge--info">
            <span className="badge__dot" /> In progress
          </span>
          <strong>Lift to the clinic</strong>
          <span className="muted small">Accepted by Lena · Thu 2:00 pm</span>
        </div>
        <div className="auth__card auth__card--b">
          <CheckCircle2 size={16} className="text-success" />
          <span className="small">
            <strong>Groceries delivered.</strong> Thanks, Sam!
          </span>
        </div>
        <div className="auth__quote">
          {aside || (
            <>
              <p>“The tap had been dripping for weeks. Someone two doors down fixed it in ten minutes.”</p>
              <span>Resident, Riverside</span>
            </>
          )}
        </div>
      </aside>
    </div>
  );
};

export default AuthLayout;
