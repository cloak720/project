import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./RequestPage.css";

const RequestPage = () => {
  const [formData, setFormData] = useState({
    requestType: "",
    description: "",
    category: "",
    deadline: "", // Will store datetime-local format
    urgency: "Low",
    phoneNumber: "",
    houseNo: "", // Added house number field
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const userId = sessionStorage.getItem("userId"); // Fetching user ID from session storage

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const userHouseNo = sessionStorage.getItem("houseNo"); // Fetching house number from session storage
    if (userHouseNo) {
      setFormData((prevData) => ({
        ...prevData,
        houseNo: userHouseNo,
      }));
    }
  }, [userId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const { requestType, description, category, deadline, urgency, phoneNumber, houseNo } = formData;

    // Validate phone number
    if (!/^\d{10,15}$/.test(phoneNumber)) {
      setErrorMessage("Invalid phone number. Enter 10-15 digits.");
      setIsSubmitting(false);
      return;
    }

    // Validate category
    if (!category) {
      setErrorMessage("Please select a category.");
      setIsSubmitting(false);
      return;
    }

    // Format deadline to ISO string
    const formattedDeadline = new Date(deadline).toISOString();

    const dataToSend = {
      requestType,
      description,
      category,
      deadline: formattedDeadline, // Ensure correct format
      urgency,
      phoneNumber,
      houseNo,
    };

    try {
      const response = await axios.post(
        "http://localhost:8080/api/requests/create",
        dataToSend,
        { withCredentials: true } // Include credentials (cookies/session)
      );

      if (response.status === 201) {
        alert("Request submitted successfully!");
        navigate(`/submission/${response.data.id}`);
      }
    } catch (error) {
      console.error("API Error:", error.response || error.message);
      setErrorMessage("Failed to create request. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="request-page">
      <header></header>
      <h2>Submit a Request</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Request Name:</label>
          <input
            type="text"
            name="requestType"
            value={formData.requestType}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
          ></textarea>
        </div>
        <div>
          <label>Category:</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          >
            <option value="">Select a category</option>
            <option value="Medical">Medical</option>
            <option value="Household">Household</option>
            <option value="Transport">Transport</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label>Deadline:</label>
          <input
            type="datetime-local"
            name="deadline"
            value={formData.deadline}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Urgency:</label>
          <select
            name="urgency"
            value={formData.urgency}
            onChange={handleInputChange}
            required
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        <div>
          <label>Phone Number:</label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>House Number:</label>
          <input
            type="text"
            name="houseNo"
            value={formData.houseNo}
            onChange={handleInputChange}
            required
          />
        </div>
        {errorMessage && <p className="error">{errorMessage}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default RequestPage;
