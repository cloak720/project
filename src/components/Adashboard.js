// src/components/Adashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Adashboard.css';

const Adashboard = () => {
  // State variables for data
  const [opportunities, setOpportunities] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);      // Contact messages
  const [feedbacks, setFeedbacks] = useState([]);      // Volunteer feedback
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState("users");
  
  // States for managing reply inputs for contact messages
  const [replyContact, setReplyContact] = useState({});
  const [replyContactVisible, setReplyContactVisible] = useState({});

  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if admin is logged in (role "0")
    const userId = sessionStorage.getItem("userId");
    const role = sessionStorage.getItem("role");
    if (!userId || role !== "0") {
      navigate("/login");
      return;
    }
    fetchData();
  }, [navigate]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [
        oppRes,
        reqRes,
        userRes,
        contactRes,
        feedbackRes
      ] = await Promise.all([
        axios.get("http://localhost:8080/api/opportunities/all", { withCredentials: true }),
        axios.get("http://localhost:8080/api/requests/all", { withCredentials: true }),
        axios.get("http://localhost:8080/api/user/all", { withCredentials: true }),
        axios.get("http://localhost:8080/api/contact", { withCredentials: true }),
        axios.get("http://localhost:8080/api/feedback", { withCredentials: true })
      ]);
      setOpportunities(oppRes.data);
      setRequests(reqRes.data);
      setUsers(userRes.data);
      setMessages(contactRes.data);
      setFeedbacks(feedbackRes.data);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError("Failed to fetch admin dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  // --- Ban/Unban Functions ---
  const banUser = async (userId) => {
    try {
      await axios.put(`http://localhost:8080/api/user/${userId}/ban`, {}, { withCredentials: true });
      setUsers(prevUsers =>
        prevUsers.map(user => user.id === userId ? { ...user, banned: true } : user)
      );
      alert("User banned successfully");
    } catch (error) {
      console.error("Error banning user:", error);
      alert("Failed to ban user");
    }
  };

  const unbanUser = async (userId) => {
    try {
      await axios.put(`http://localhost:8080/api/user/${userId}/unban`, {}, { withCredentials: true });
      setUsers(prevUsers =>
        prevUsers.map(user => user.id === userId ? { ...user, banned: false } : user)
      );
      alert("User unbanned successfully");
    } catch (error) {
      console.error("Error unbanning user:", error);
      alert("Failed to unban user");
    }
  };
  // --- End Ban/Unban Functions ---

  // --- Delete Functions ---
  const deleteUser = async (userId, userRole) => {
    if (userRole === 0) return; // Do not delete admin accounts
    try {
      await axios.delete(`http://localhost:8080/api/user/${userId}`, { withCredentials: true });
      setUsers(prev => prev.filter(user => user.id !== userId));
      alert("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const deleteRequest = async (requestId) => {
    try {
      await axios.delete(`http://localhost:8080/api/requests/${requestId}`, { withCredentials: true });
      setRequests(prev => prev.filter(request => request.id !== requestId));
      alert("Request deleted successfully");
    } catch (error) {
      console.error("Error deleting request:", error);
      alert("Failed to delete request");
    }
  };

  const deleteOpportunity = async (oppId) => {
    try {
      await axios.delete(`http://localhost:8080/api/opportunities/${oppId}`, { withCredentials: true });
      setOpportunities(prev => prev.filter(o => o.id !== oppId));
      alert("Opportunity deleted successfully");
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      alert("Failed to delete opportunity");
    }
  };
  // --- End Delete Functions ---

  // --- Reply Function for Contact Messages ---
  const handleContactReply = async (messageId) => {
    const replyText = replyContact[messageId];
    if (!replyText) {
      alert("Please enter a reply.");
      return;
    }
    try {
      // Use PUT instead of POST (backend expects PUT)
      await axios.put(
        `http://localhost:8080/api/contact/${messageId}/reply`,
        { reply: replyText },
        { withCredentials: true }
      );
      alert("Reply sent successfully.");
      setMessages(prev =>
        prev.map(msg => msg.id === messageId ? { ...msg, reply: replyText } : msg)
      );
      setReplyContact(prev => ({ ...prev, [messageId]: "" }));
      setReplyContactVisible(prev => ({ ...prev, [messageId]: false }));
    } catch (error) {
      console.error("Error replying to contact message:", error);
      alert("Failed to send reply.");
    }
  };
  // --- End Reply Function ---

  if (loading) {
    return <div>Loading admin dashboard...</div>;
  }
  if (error) {
    return <div className="error">{error}</div>;
  }
  
  // Dashboard statistics
  const totalOpportunities = opportunities.length;
  const totalRequests = requests.length;
  const pendingRequestsCount = requests.filter(r => r.status === "PENDING").length;
  const acceptedRequestsCount = requests.filter(r => r.status === "ACCEPTED").length;
  const completedRequestsCount = requests.filter(r => r.status.toLowerCase() === "completed").length;
  const totalUsers = users.length;

  // Helper: Get volunteer name from users array by volunteerId
  const getVolunteerName = (volunteerId) => {
    const volunteer = users.find(u => u.id === volunteerId);
    return volunteer ? `${volunteer.firstName} ${volunteer.lastName}` : "Unknown Volunteer";
  };

  return (
    <div className="admin-page">
      {/* Persistent Dashboard Header */}
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="stats">
          <div className="stat-item">
          <center><h3>Total Opportunities</h3>
              <p>{totalOpportunities}</p></center>
          </div>
          <div className="stat-item">
          <center> <h3>Total Requests</h3>
             <p>{totalRequests}</p></center>
          </div>
          <div className="stat-item">
          <center><h3>Pending Requests</h3>
             <p>{pendingRequestsCount}</p></center>
          </div>
          <div className="stat-item">
          <center> <h3>Accepted Requests</h3>
            <p>{acceptedRequestsCount}</p></center>
          </div>
          <div className="stat-item">
          <center> <h3>Completed Requests</h3>
           <p>{completedRequestsCount}</p></center>
          </div>
          <div className="stat-item">
          <center> <h3>Total Users</h3>
            <p>{totalUsers}</p></center>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs">
        <button onClick={() => setActiveTab("users")} className={activeTab === "users" ? "active" : ""}>
          Users
        </button>
        <button onClick={() => setActiveTab("requests")} className={activeTab === "requests" ? "active" : ""}>
          Requests
        </button>
        <button onClick={() => setActiveTab("opportunities")} className={activeTab === "opportunities" ? "active" : ""}>
          Opportunities
        </button>
        <button onClick={() => setActiveTab("contacts")} className={activeTab === "contacts" ? "active" : ""}>
          Contact Messages
        </button>
        <button onClick={() => setActiveTab("feedback")} className={activeTab === "feedback" ? "active" : ""}>
          Volunteer Feedback
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "users" && (
          <div className="users-tab">
            <h2>Users</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Age</th>
                  <th>Phone No</th>
                  <th>House No</th>
                  <th>Banned</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.firstName}</td>
                    <td>{user.lastName}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.age}</td>
                    <td>{user.phoneNo}</td>
                    <td>{user.houseNo}</td>
                    <td>{user.banned ? "Yes" : "No"}</td>
                    <td>
                      {user.role !== 0 && (
                        <>
                          {user.banned ? (
                            <button onClick={() => unbanUser(user.id)}>Unban</button>
                          ) : (
                            <button onClick={() => banUser(user.id)}>Ban</button>
                          )}
                          <button onClick={() => deleteUser(user.id, user.role)}>Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "requests" && (
          <div className="requests-tab">
            <h2>Requests</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Deadline</th>
                  <th>Urgency</th>
                  <th>Phone No</th>
                  <th>House No</th>
                  <th>Status</th>
                  <th>Posted By</th>
                  <th>Accepted By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(request => (
                  <tr key={request.id}>
                    <td>{request.id}</td>
                    <td>{request.requestType}</td>
                    <td>{request.description}</td>
                    <td>{request.deadline ? new Date(request.deadline).toLocaleDateString() : "N/A"}</td>
                    <td>{request.urgency}</td>
                    <td>{request.phoneNumber}</td>
                    <td>{request.houseNo}</td>
                    <td>{request.status}</td>
                    <td>{request.user ? `${request.user.firstName} ${request.user.lastName}` : "N/A"}</td>
                    <td>{request.volunteer ? `${request.volunteer.firstName} ${request.volunteer.lastName}` : "Not accepted"}</td>
                    <td>
                      <button onClick={() => deleteRequest(request.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "opportunities" && (
          <div className="opportunities-tab">
            <h2>Opportunities</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Deadline</th>
                  <th>Volunteer Limit</th>
                  <th>Volunteers Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map(opportunity => (
                  <tr key={opportunity.id}>
                    <td>{opportunity.id}</td>
                    <td>{opportunity.name}</td>
                    <td>{opportunity.description}</td>
                    <td>{opportunity.category}</td>
                    <td>{opportunity.location}</td>
                    <td>{opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString() : "N/A"}</td>
                    <td>{opportunity.volunteerLimit}</td>
                    <td>
                      {opportunity.volunteers && opportunity.volunteers.length > 0
                        ? opportunity.volunteers.map(vol => 
                            vol.user 
                              ? `${vol.id} - ${vol.user.firstName} ${vol.user.lastName}`
                              : `${vol.id}`
                          ).join(", ")
                        : "None"}
                    </td>
                    <td>
                      <button onClick={() => deleteOpportunity(opportunity.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="messages-tab">
            <h2>Contact Messages</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Reply</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map(msg => (
                  <tr key={msg.id}>
                    <td>{msg.id}</td>
                    <td>{msg.name}</td>
                    <td>{msg.email}</td>
                    <td>{msg.subject}</td>
                    <td>{msg.message}</td>
                    <td>{msg.reply ? msg.reply : "No reply"}</td>
                    <td>
                      <button onClick={() =>
                        setReplyContactVisible(prev => ({
                          ...prev,
                          [msg.id]: !prev[msg.id]
                        }))
                      }>
                        {replyContactVisible[msg.id] ? "Cancel" : "Reply"}
                      </button>
                      {replyContactVisible[msg.id] && (
                        <div>
                          <textarea
                            value={replyContact[msg.id] || ""}
                            onChange={(e) =>
                              setReplyContact(prev => ({
                                ...prev,
                                [msg.id]: e.target.value
                              }))
                            }
                            placeholder="Type your reply here"
                          />
                          <button onClick={() => handleContactReply(msg.id)}>
                            Submit Reply
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "feedback" && (
          <div className="messages-tab">
            <h2>Volunteer Feedback</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Volunteer</th>
                  <th>User ID</th>
                  <th>Comment</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map(fb => (
                  <tr key={fb.id}>
                    <td>{fb.id}</td>
                    <td>{fb.volunteerId} - {getVolunteerName(fb.volunteerId)}</td>
                    <td>{fb.userId}</td>
                    <td>{fb.comment}</td>
                    <td>{fb.rating != null ? fb.rating : "N/A"}</td>
                    <td>
                      <button onClick={() => {
                        axios.delete(`http://localhost:8080/api/feedback/${fb.id}`, { withCredentials: true })
                          .then(() => {
                            setFeedbacks(prev => prev.filter(item => item.id !== fb.id));
                            alert("Feedback deleted successfully");
                          })
                          .catch(error => {
                            console.error("Error deleting feedback:", error);
                            alert("Failed to delete feedback");
                          });
                      }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Adashboard;
