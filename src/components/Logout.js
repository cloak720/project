import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        const response = await axios.post("http://localhost:8080/api/user/logout", {}, { withCredentials: true });
        console.log(response.data); // Log server response for better understanding

        sessionStorage.clear();
        localStorage.removeItem("user");

        // Redirect to login page after successful logout
        navigate("/login");
      } catch (err) {
        console.error("Logout failed:", err.response ? err.response.data : err.message);
      }
    };

    handleLogout();
  }, [navigate]);

  return (
    <div>
      <h2>Logging out...</h2>
    </div>
  );
};

export default Logout;
