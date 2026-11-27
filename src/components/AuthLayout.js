import React from "react";
import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/AppContext";
import logo from "../images/footerlogo.png";
import heroImage from "../images/community_volunteers.jpg";

const AuthLayout = ({ title, subtitle, children, footer }) => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="auth">
      <aside className="auth__art" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="auth__art-overlay">
          <Link to="/" className="brand brand--light">
            <img src={logo} alt="" width="36" height="36" />
            <span>
              Neighbor<b>Aid</b>
            </span>
          </Link>
          <blockquote>
            "Small acts, when multiplied by millions of people, can transform the world."
            <cite>Howard Zinn</cite>
          </blockquote>
        </div>
      </aside>
      <section className="auth__panel">
        <div className="auth__top">
          <Link to="/" className="brand auth__brand-mobile">
            <img src={logo} alt="" width="32" height="32" />
            <span>
              Neighbor<b>Aid</b>
            </span>
          </Link>
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
        <div className="auth__form">
          <h1>{title}</h1>
          {subtitle && <p className="auth__sub">{subtitle}</p>}
          {children}
          {footer && <p className="auth__footer">{footer}</p>}
        </div>
      </section>
    </div>
  );
};

export default AuthLayout;
