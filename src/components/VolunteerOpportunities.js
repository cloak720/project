// src/components/VolunteerOpportunities.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./VolunteerOpportunities.css";

const VolunteerOpportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [volunteers, setVolunteers] = useState({}); // To store volunteers for each opportunity
  const [loadingVolunteers, setLoadingVolunteers] = useState({}); // Loading state for volunteers

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const userId = sessionStorage.getItem("userId");
        if (!userId) {
          console.error("User is not logged in.");
          return;
        }
        const response = await axios.get("http://localhost:8080/api/opportunities/available", {
          params: { userId },
          withCredentials: true,
        });
        setOpportunities(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching opportunities:", error);
        setOpportunities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  const handleViewVolunteers = async (opportunityId) => {
    if (volunteers[opportunityId] || loadingVolunteers[opportunityId]) return;

    setLoadingVolunteers((prevState) => ({
      ...prevState,
      [opportunityId]: true,
    }));

    try {
      const userId = sessionStorage.getItem("userId");
      if (!userId) {
        console.error("User is not logged in.");
        return;
      }
      const response = await axios.get(`http://localhost:8080/api/opportunities/${opportunityId}/volunteers`, {
        params: { userId },
        withCredentials: true,
      });
      setVolunteers((prevVolunteers) => ({
        ...prevVolunteers,
        [opportunityId]: response.data,
      }));
    } catch (error) {
      console.error("Error fetching volunteers:", error);
    } finally {
      setLoadingVolunteers((prevState) => ({
        ...prevState,
        [opportunityId]: false,
      }));
    }
  };

  const handleDelete = async (id) => {
    try {
      const userId = sessionStorage.getItem("userId");
      if (!userId) {
        console.error("User is not logged in.");
        return;
      }
      await axios.delete(`http://localhost:8080/api/opportunities/${id}`, {
        params: { userId },
        withCredentials: true,
      });
      setOpportunities(opportunities.filter((opportunity) => opportunity.id !== id));
    } catch (error) {
      console.error("Error deleting opportunity:", error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="volunteer-opportunities">
      <h1>Volunteer Opportunities</h1>
      <Link to="/create-opportunity" className="btn-primary">
        Create New Opportunity
      </Link>
      <div className="opportunity-list">
        {opportunities.length > 0 ? (
          opportunities.map((opportunity) => (
            <div key={opportunity.id} className="opportunity-card">
              <h2>{opportunity.name}</h2>
              <p>{opportunity.description}</p>
              <p>
                <strong>Category:</strong> {opportunity.category}
              </p>
              <p>
                <strong>Location:</strong> {opportunity.location}
              </p>
              <p>
                <strong>Deadline:</strong>{" "}
                {opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString() : "No deadline"}
              </p>
              <p>
                <strong>Volunteer Limit:</strong> {opportunity.volunteerLimit}
              </p>
              <div className="card-buttons">
                <Link to={`/edit-opportunity/${opportunity.id}`} className="btn-edit">
                  Edit
                </Link>
                <button className="btn-delete" onClick={() => handleDelete(opportunity.id)}>
                  Delete
                </button>
                <button className="btn-volunteers" onClick={() => handleViewVolunteers(opportunity.id)}>
                  View Volunteers
                </button>
              </div>
              {loadingVolunteers[opportunity.id] && <p>Loading volunteers...</p>}
              {volunteers[opportunity.id] && !loadingVolunteers[opportunity.id] && (
                <div className="volunteer-list">
                  <h3>Volunteers:</h3>
                  <ul>
                    {volunteers[opportunity.id].map((volunteer) => (
                      <li key={volunteer.id}>
                        <strong>
                          {volunteer.user.firstName} {volunteer.user.lastName}
                        </strong>
                        <br />
                        Email: {volunteer.user.email}
                        <br />
                        Phone: {volunteer.user.phoneNo}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No opportunities available.</p>
        )}
      </div>
    </div>
  );
};

export default VolunteerOpportunities;
