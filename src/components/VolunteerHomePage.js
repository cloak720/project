// src/components/VolunteerHomePage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './VolunteerHomePage.css';

const VolunteerHomePage = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const userId = sessionStorage.getItem('userId');
  const userRole = sessionStorage.getItem('role');

  useEffect(() => {
    if (!userId || userRole !== '2') {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        switch (activeTab) {
          case 'requests': {
            const [pendingRes, acceptedRes] = await Promise.all([
              axios.get('http://localhost:8080/api/requests/pending', { withCredentials: true }),
              axios.get('http://localhost:8080/api/requests/accepted', { withCredentials: true })
            ]);
            setPendingRequests(pendingRes.data);
            setAcceptedRequests(acceptedRes.data);
            break;
          }
          case 'opportunities': {
            const oppRes = await axios.get('http://localhost:8080/api/opportunities/available', { withCredentials: true });
            setOpportunities(Array.isArray(oppRes.data) ? oppRes.data : []);
            break;
          }
          default:
            console.log('Unknown tab:', activeTab);
        }
      } catch (err) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, userId, userRole, navigate]);

  // Accept a pending request
  const handleAcceptRequest = async (requestId) => {
    try {
      await axios.put(`http://localhost:8080/api/requests/${requestId}/accept`, {}, { withCredentials: true });
      const [pendingRes, acceptedRes] = await Promise.all([
        axios.get('http://localhost:8080/api/requests/pending', { withCredentials: true }),
        axios.get('http://localhost:8080/api/requests/accepted', { withCredentials: true })
      ]);
      setPendingRequests(pendingRes.data);
      setAcceptedRequests(acceptedRes.data);
    } catch (err) {
      setError('Failed to accept request');
    }
  };

  // Mark an accepted request as completed
  const handleCompleteRequest = async (requestId) => {
    try {
      const response = await axios.put(
        `http://localhost:8080/api/requests/${requestId}/complete`,
        {},
        { withCredentials: true }
      );
      setAcceptedRequests((prevRequests) =>
        prevRequests.map((request) =>
          request.id === requestId ? response.data : request
        )
      );
    } catch (err) {
      setError('Failed to mark request as completed');
      console.error("Error marking complete:", err);
    }
  };

  // Accept an opportunity (if not already applied)
  const handleAcceptOpportunity = async (opportunityId, alreadyApplied) => {
    if (alreadyApplied) {
      setError("You have already applied for this opportunity.");
      return;
    }
    try {
      await axios.post(
        `http://localhost:8080/api/volunteers/opportunities/${opportunityId}/accept`,
        {},
        { withCredentials: true }
      );
      // Update local opportunities state to include the current volunteer as "applied"
      setOpportunities((prevOpportunities) =>
        prevOpportunities.map((opportunity) => {
          if (opportunity.id === opportunityId) {
            const updatedVolunteers = opportunity.volunteers ? [...opportunity.volunteers] : [];
            updatedVolunteers.push({ 
              user: { 
                id: userId, 
                firstName: 'You', 
                lastName: '' 
              } 
            });
            return { ...opportunity, volunteers: updatedVolunteers };
          }
          return opportunity;
        })
      );
    } catch (err) {
      if (err.response?.status === 409) {
        setError("You have already applied for this opportunity.");
      } else {
        setError(err.response?.data || "Failed to accept opportunity");
      }
      console.error("Backend Error:", err.response?.data);
    }
  };

  const acceptedOpportunities = opportunities.filter((opportunity) => 
    opportunity.volunteers && opportunity.volunteers.some((vol) => String(vol.user.id) === String(userId))
  );
  const availableOpportunities = opportunities.filter((opportunity) => 
    !opportunity.volunteers || !opportunity.volunteers.some((vol) => String(vol.user.id) === String(userId))
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="volunteer-container">
      <nav className="tabs">
        <button className={activeTab === 'requests' ? 'active' : ''} onClick={() => setActiveTab('requests')}>
          Requests
        </button>
        <button className={activeTab === 'opportunities' ? 'active' : ''} onClick={() => setActiveTab('opportunities')}>
          Opportunities
        </button>
      </nav>

      <div className="content">
        {error && <p className="error">{error}</p>}

        {activeTab === 'requests' && (
          <div className="requests-section">
            <div className="section-header">
              <h2>Pending Requests</h2>
            </div>
            <div className="requests-grid">
              {pendingRequests.map((request) => (
                <div key={request.id} className="request-card">
                  <div className="card-header">
                    <h3>{request.requestType}</h3>
                    <span className={`category-tag ${request.category || 'other'}`}>
                      {request.category || 'General'}
                    </span>
                  </div>
                  <div className="card-body">
                    <p className="card-description">{request.description}</p>
                    <div className="request-details">
                      {request.user && (
                        <p>
                          <strong>Requested by:</strong> {request.user.firstName} {request.user.lastName}
                        </p>
                      )}
                      <p><strong>Phone:</strong> {request.phoneNumber}</p>
                      <p><strong>House No:</strong> {request.houseNo}</p>
                      <p>
                        <strong>Deadline:</strong>{" "}
                        {request.deadline ? new Date(request.deadline).toLocaleDateString() : "No deadline"}
                      </p>
                      <p><strong>Urgency:</strong> {request.urgency}</p>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button className="accept-btn" onClick={() => handleAcceptRequest(request.id)}>
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="section-header">
              <h2>Accepted Requests</h2>
            </div>
            <div className="commitments-list">
              {acceptedRequests.map((request) => (
                <div key={request.id} className="commitment-card">
                  <div className="commitment-header">
                    <h3>{request.requestType}</h3>
                    <span className={`status-badge ${request.status}`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="commitment-description">{request.description}</p>
                  <div className="request-details">
                    {request.user && (
                      <p>
                        <strong>Requested by:</strong> {request.user.firstName} {request.user.lastName}
                      </p>
                    )}
                    <p><strong>Phone:</strong> {request.phoneNumber}</p>
                    <p><strong>House No:</strong> {request.houseNo}</p>
                    <p>
                      <strong>Deadline:</strong>{" "}
                      {request.deadline ? new Date(request.deadline).toLocaleDateString() : "No deadline"}
                    </p>
                    <p><strong>Urgency:</strong> {request.urgency}</p>
                  </div>
                  <div className="card-meta">
                    <div className="meta-item">
                      <i className="fas fa-calendar-alt" />
                      {request.deadline ? new Date(request.deadline).toLocaleDateString() : "No deadline"}
                    </div>
                  </div>
                  <div className="card-actions">
                    <button 
                      onClick={() => handleCompleteRequest(request.id)} 
                      className="complete-btn"
                      disabled={request.status.toLowerCase() === "completed"}
                    >
                      {request.status.toLowerCase() === "completed" ? "Completed" : "Mark Completed"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'opportunities' && (
          <div className="opportunities-section">
            <h2>Accepted Opportunities</h2>
            {acceptedOpportunities.length > 0 ? (
              acceptedOpportunities.map((opportunity) => (
                <div key={opportunity.id} className="opportunity-card">
                  <div className="card-header">
                    <h3>{opportunity.name}</h3>
                    <span className={`category-tag ${opportunity.category || 'other'}`}>
                      {opportunity.category || 'General'}
                    </span>
                  </div>
                  <div className="card-body">
                    <p className="card-description">{opportunity.description}</p>
                    <div className="card-meta">
                      <div className="meta-item">
                        <i className="fas fa-map-marker-alt" />
                        {opportunity.location || 'Not specified'}
                      </div>
                      <div className="meta-item">
                        <i className="fas fa-calendar-alt" />
                        {opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString() : 'No deadline'}
                      </div>
                      <div className="meta-item">
                        <i className="fas fa-users" />
                        {opportunity.volunteerLimit} Volunteer Limit
                      </div>
                      <div className="meta-item">
                        <i className="fas fa-user-check" />
                        {opportunity.volunteers ? opportunity.volunteers.length : 0} Accepted
                      </div>
                    </div>
                    {opportunity.volunteers && opportunity.volunteers.length > 0 && (
                      <div className="volunteers-list">
                        <p><strong>Volunteers Joined:</strong></p>
                        <ul>
                          {opportunity.volunteers.map((vol) => (
                            <li key={vol.user.id}>
                              {vol.user.firstName} {vol.user.lastName} (ID: {vol.user.id})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="card-actions">
                    {(() => {
                      const alreadyApplied = opportunity.volunteers &&
                        opportunity.volunteers.some((vol) => String(vol.user.id) === String(userId));
                      return alreadyApplied ? (
                        <button className="applied-btn" disabled>
                          Applied
                        </button>
                      ) : (
                        <button
                          className="accept-btn"
                          onClick={() => handleAcceptOpportunity(opportunity.id, alreadyApplied)}
                        >
                          Accept Opportunity
                        </button>
                      );
                    })()}
                  </div>
                </div>
              ))
            ) : (
              <p>You haven't accepted any opportunities yet.</p>
            )}

            <h2>Available Opportunities</h2>
            {availableOpportunities.length > 0 ? (
              availableOpportunities.map((opportunity) => (
                <div key={opportunity.id} className="opportunity-card">
                  <div className="card-header">
                    <h3>{opportunity.name}</h3>
                    <span className={`category-tag ${opportunity.category || 'other'}`}>
                      {opportunity.category || 'General'}
                    </span>
                  </div>
                  <div className="card-body">
                    <p className="card-description">{opportunity.description}</p>
                    <div className="card-meta">
                      <div className="meta-item">
                        <i className="fas fa-map-marker-alt" />
                        {opportunity.location || 'Not specified'}
                      </div>
                      <div className="meta-item">
                        <i className="fas fa-calendar-alt" />
                        {opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString() : 'No deadline'}
                      </div>
                      <div className="meta-item">
                        <i className="fas fa-users" />
                        {opportunity.volunteerLimit} Volunteer Limit
                      </div>
                      <div className="meta-item">
                        <i className="fas fa-user-check" />
                        {opportunity.volunteers ? opportunity.volunteers.length : 0} Accepted
                      </div>
                    </div>
                  </div>
                  <div className="card-actions">
                    {(() => {
                      const alreadyApplied = opportunity.volunteers &&
                        opportunity.volunteers.some((vol) => String(vol.user.id) === String(userId));
                      return alreadyApplied ? (
                        <button className="applied-btn" disabled>
                          Applied
                        </button>
                      ) : (
                        <button
                          className="accept-btn"
                          onClick={() => handleAcceptOpportunity(opportunity.id, alreadyApplied)}
                        >
                          Accept Opportunity
                        </button>
                      );
                    })()}
                  </div>
                </div>
              ))
            ) : (
              <p>No available opportunities.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerHomePage;
