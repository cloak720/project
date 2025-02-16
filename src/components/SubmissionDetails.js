// src/components/SubmissionDetails.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./SubmissionDetails.css";

const SubmissionDetails = () => {
  const [requests, setRequests] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      setErrorMessage("User not logged in. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    const fetchRequests = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8080/api/requests/user",
          { withCredentials: true }
        );
        console.log("API Response:", response.data);
        setRequests(response.data);
      } catch (error) {
        setErrorMessage("Failed to fetch request details.");
        console.error("Error fetching request details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [userId, navigate]);

  const handleCancelRequest = async (requestId) => {
    try {
      await axios.delete(`http://localhost:8080/api/requests/${requestId}`, {
        withCredentials: true,
      });
      setRequests((prevRequests) =>
        prevRequests.filter((request) => request.id !== requestId)
      );
    } catch (error) {
      setErrorMessage("Failed to cancel request.");
      console.error("Error deleting request:", error);
    }
  };

  if (loading) {
    return <div className="loading">Loading your requests...</div>;
  }

  return (
    <div className="submission-details">
      <h2>Your Requests</h2>
      {errorMessage && <p className="error">{errorMessage}</p>}
      {requests.length === 0 ? (
        <p>No requests found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Request Type</th>
              <th>Description</th>
              <th>Deadline</th>
              <th>House No</th>
              <th>Status</th>
              <th>Accepted By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>{request.requestType}</td>
                <td>{request.description}</td>
                <td>
                  {request.deadline
                    ? new Date(request.deadline).toLocaleString()
                    : "Not specified"}
                </td>
                <td>{request.houseNo}</td>
                <td>{request.status || "Pending"}</td>
                <td>
                  {request.volunteer
                    ? `${request.volunteer.id}, ${request.volunteer.firstName} ${request.volunteer.lastName}`
                    : "Not accepted"}
                </td>
                <td>
                  <button
                    onClick={() => handleCancelRequest(request.id)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SubmissionDetails;
