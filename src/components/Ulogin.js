import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FaSun, FaMoon } from "react-icons/fa";
import "./Ulogin.css";

const Ulogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Apply the theme to the document body
    document.body.className = theme;

    const userId = sessionStorage.getItem("userId");
    const userRole = sessionStorage.getItem("role");

    // If there's no userId or role, we stay on the login page
    if (!userId || !userRole) return;

    // Redirect based on existing session
    if (userRole === "1") navigate("/"); // User home
    else if (userRole === "2") navigate("/volunteer-home"); // Volunteer home
    else if (userRole === "0") navigate("/admin-dashboard"); // Admin home

  }, [navigate, theme]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:8080/api/user/login",
        { email, password },
        { withCredentials: true }
      );

      if (response.status === 200) {
        const { role, userId, email } = response.data;

        // Set sessionStorage with the necessary data (without authToken)
        sessionStorage.setItem("userEmail", email);
        sessionStorage.setItem("userId", userId);
        sessionStorage.setItem("role", role);

        // Redirect user based on their role
        if (role === 1) {
          navigate("/"); // User's home page
        } else if (role === 2) {
          navigate("/volunteer-home"); // Volunteer dashboard
        } else if (role === 0) {
          navigate("/admin-dashboard"); // Admin dashboard
        }
      }
    } catch (error) {
      // If the backend returns 403 (for example, for banned users), display its message.
      if (error.response?.status === 403) {
        // Check if the response data has a message, otherwise default.
        setError(error.response.data?.message || "Access forbidden.");
      } else if (error.response?.status === 401) {
        setError("Incorrect email or password.");
      } else {
        setError("Login failed. Please try again.");
      }
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return (
    <div className="ulogin__loginPage">
      <div className="ulogin__loginContainer">
        <div className="ulogin__headerWithToggle">
          <h2 id="abc">LOGIN</h2>
          <div className="ulogin__themeToggle" onClick={toggleTheme}>
            {theme === "light" ? (
              <FaMoon className="ulogin_moonIcon" />
            ) : (
              <FaSun className="ulogin_sunIcon" />
            )}
          </div>
        </div>
        {error && <p className="ulogin__error">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="ulogin__inputContainer">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ulogin__input"
              required
            />
          </div>
          <div className="ulogin__inputContainer">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ulogin__input"
              required
            />
          </div>
          <button type="submit" className="ulogin__button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="ulogin__ard">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Ulogin;
