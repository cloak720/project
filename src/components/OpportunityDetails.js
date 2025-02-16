import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import "./OpportunityDetails.css";

const OpportunityDetails = () => {
  const { id } = useParams();
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOpportunity = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/opportunities/${id}`
        );
        setOpportunity(response.data);
      } catch (error) {
        console.error("Error fetching opportunity:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunity();
  }, [id]);

  if (loading) return <div className="loading">Loading opportunity details...</div>;
  if (!opportunity) return <div>Opportunity not found</div>;

  return (
    <div className="opportunity-details-container">
      <h1>{opportunity.name}</h1>
      <div className="details-section">
        <div className="main-info">
          <p className="description">{opportunity.description}</p>
          <div className="meta-info">
            <div className="meta-item">
              <span className="label">Category:</span>
              <span className="value">{opportunity.category}</span>
            </div>
            <div className="meta-item">
              <span className="label">Location:</span>
              <span className="value">{opportunity.location}</span>
            </div>
            <div className="meta-item">
              <span className="label">Deadline:</span>
              <span className="value">
                {new Date(opportunity.deadline).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetails;