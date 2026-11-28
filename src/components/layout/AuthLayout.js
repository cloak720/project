import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/AppContext";
import Logo from "../art/Logo";
import { DoorScene } from "../art/Scenes";
import { fadeUp } from "../ui";

/** Split screen for log in and sign up: illustrated porch on one side, the form on the other. */
const AuthLayout = ({ kicker, title, lede, children, footer, wide }) => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="auth">
      <aside className="auth__art">
        <Logo />
        <DoorScene className="auth__scene" />
        <blockquote className="auth__quote">
          “Every street has someone who needs a hand, and someone with a hand to spare.”
        </blockquote>
      </aside>

      <section className="auth__panel">
        <div className="auth__top">
          <span className="auth__brand-mobile">
            <Logo />
          </span>
          <Link to="/" className="arrow-link auth__home">
            Back to the front page
          </Link>
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          >
            {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
          </button>
        </div>
        <motion.div className={`auth__form ${wide ? "auth__form--wide" : ""}`} {...fadeUp}>
          {kicker && <p className="kicker">{kicker}</p>}
          <h1>{title}</h1>
          {lede && <p className="lede auth__lede">{lede}</p>}
          {children}
          {footer && <p className="auth__footer">{footer}</p>}
        </motion.div>
      </section>
    </div>
  );
};

export default AuthLayout;
