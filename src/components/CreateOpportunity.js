import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./OpportunityForm.css";

const CreateOpportunity = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    deadline: "",
    location: "",
    volunteerLimit: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Get user email or userId from session
      const userEmail = sessionStorage.getItem("userEmail");
      const userId = sessionStorage.getItem("userId");

      if (!userEmail || !userId) {
        console.error("User is not logged in.");
        return;
      }

      // Pass session data in request
      await axios.post(
        "http://localhost:8080/api/opportunities",
        { ...formData, userId, userEmail },
        {
          withCredentials: true, // Allow cookies to be sent with the request
        }
      );

      // Navigate to the opportunities list after creating
      navigate("/volunteer-opportunities");
    } catch (error) {
      console.error("Error creating opportunity:", error);
    }
  };

  return (
    <div className="opportunity-form">
      <h1>Create New Opportunity</h1>
      <form onSubmit={handleSubmit}>
        <label>Name:</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <label>Description:</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
        />
        <label>Category:</label>
        <input
          type="text"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        />
        <label>Deadline:</label>
        <input
          type="datetime-local"
          name="deadline"
          value={formData.deadline}
          onChange={handleChange}
          required
        />
        <label>Location:</label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          required
        />
        <label>Volunteer Limit:</label>
        <input
          type="number"
          name="volunteerLimit"
          value={formData.volunteerLimit}
          onChange={handleChange}
          required
        />
        <button type="submit">Create</button>
      </form>
    </div>
  );
};

export default CreateOpportunity;
