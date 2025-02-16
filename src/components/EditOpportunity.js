// src/components/EditOpportunity.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./OpportunityForm.css";

const EditOpportunity = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    deadline: "",
    location: "",
    volunteerLimit: "",
  });

  useEffect(() => {
    const fetchOpportunity = async () => {
      try {
        // Retrieve session data (email, userId, etc.)
        const userEmail = sessionStorage.getItem("userEmail");
        const userId = sessionStorage.getItem("userId");

        if (!userEmail || !userId) {
          console.error("User is not logged in.");
          return;
        }

        const response = await axios.get(`http://localhost:8080/api/opportunities/${id}`, {
          params: { userEmail, userId }, // Send session data as query parameters
          withCredentials: true,
        });
        setFormData(response.data);
      } catch (error) {
        console.error("Error fetching opportunity:", error);
      }
    };

    fetchOpportunity();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Retrieve session data (email, userId, etc.)
      const userEmail = sessionStorage.getItem("userEmail");
      const userId = sessionStorage.getItem("userId");

      if (!userEmail || !userId) {
        console.error("User is not logged in.");
        return;
      }

      // Include session data in the request body
      await axios.put(`http://localhost:8080/api/opportunities/${id}`, 
        { ...formData, userEmail, userId }, 
        { withCredentials: true }
      );
      navigate("/volunteer-opportunities");
    } catch (error) {
      console.error("Error updating opportunity:", error);
    }
  };

  return (
    <div className="opportunity-form">
      <h1>Edit Opportunity</h1>
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
        <button type="submit">Update</button>
      </form>
    </div>
  );
};

export default EditOpportunity;
