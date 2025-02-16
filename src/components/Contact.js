// src/components/Contact.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./contact.css";

const Contact = () => {
  // State to control the active tab: "contact" or "feedback"
  const [activeTab, setActiveTab] = useState("contact");

  // State for the Contact Us form
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState("");
  const [contactError, setContactError] = useState("");

  // State for the Volunteer Feedback form
  const [feedbackVolunteerId, setFeedbackVolunteerId] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0); // Star rating for the volunteer
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState("");
  const [feedbackError, setFeedbackError] = useState("");

  // For demonstration, assume a logged-in user id (replace with real session data if available)
  const userId = 1;

  // Auto-fill contact form's name and email if available in sessionStorage
  useEffect(() => {
    const storedName = sessionStorage.getItem("userName");
    const storedEmail = sessionStorage.getItem("userEmail");
    if (storedName) setContactName(storedName);
    if (storedEmail) setContactEmail(storedEmail);
  }, []);

  // Handler for the Contact Us form submission
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactSuccess("");
    setContactError("");

    if (!contactName || !contactEmail || !contactSubject || !contactMessage) {
      setContactError("Please fill in all fields.");
      return;
    }

    setContactLoading(true);
    try {
      await axios.post(
        "http://localhost:8080/api/contact",
        {
          name: contactName,
          email: contactEmail,
          subject: contactSubject,
          message: contactMessage,
        },
        { withCredentials: true }
      );
      setContactSuccess("Your message has been sent successfully.");
      setContactName("");
      setContactEmail("");
      setContactSubject("");
      setContactMessage("");
    } catch (error) {
      console.error("Error submitting contact form:", error);
      setContactError("Failed to send your message. Please try again later.");
    } finally {
      setContactLoading(false);
    }
  };

  // Handler for the Volunteer Feedback form submission
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackSuccess("");
    setFeedbackError("");

    if (!feedbackVolunteerId || !feedbackMessage || feedbackRating === 0) {
      setFeedbackError("Please fill in all fields and select a rating.");
      return;
    }

    setFeedbackLoading(true);
    try {
      await axios.post(
        "http://localhost:8080/api/feedback",
        {
          userId: userId,
          volunteerId: Number(feedbackVolunteerId),
          comment: feedbackMessage,
          rating: feedbackRating,
        },
        { withCredentials: true }
      );
      setFeedbackSuccess("Your feedback has been submitted successfully.");
      setFeedbackVolunteerId("");
      setFeedbackMessage("");
      setFeedbackRating(0);
    } catch (error) {
      console.error("Error submitting feedback form:", error);
      setFeedbackError("Failed to submit feedback. Please try again later.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Function to render the star rating component
  const renderStarRating = () => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => setFeedbackRating(star)}
            style={{
              cursor: "pointer",
              fontSize: "2rem",
              color: feedbackRating >= star ? "gold" : "gray",
            }}
          >
            {feedbackRating >= star ? "★" : "☆"}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="contact-page">
      <h1>Contact Us &amp; Volunteer Feedback</h1>

      <div className="tabs">
        <button
          className={activeTab === "contact" ? "active" : ""}
          onClick={() => setActiveTab("contact")}
        >
          Contact Us
        </button>
        <button
          className={activeTab === "feedback" ? "active" : ""}
          onClick={() => setActiveTab("feedback")}
        >
          Volunteer Feedback
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "contact" && (
          <div className="contact-form-container">
            <h2>Contact Us</h2>
            <p>
              If you have any problems, suggestions, or thoughts to share, please fill out the form below.
            </p>
            <form onSubmit={handleContactSubmit} className="form">
              <div className="form-group">
                <label htmlFor="contactName">Name</label>
                <input
                  type="text"
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your Name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="contactEmail">Email</label>
                <input
                  type="email"
                  id="contactEmail"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Your Email"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="contactSubject">Subject</label>
                <input
                  type="text"
                  id="contactSubject"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  placeholder="Subject"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="contactMessage">Message</label>
                <textarea
                  id="contactMessage"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Write your problems, thoughts, or suggestions..."
                  required
                />
              </div>
              <button type="submit" disabled={contactLoading}>
                {contactLoading ? "Sending..." : "Send Message"}
              </button>
              {contactSuccess && <p className="success">{contactSuccess}</p>}
              {contactError && <p className="error">{contactError}</p>}
            </form>
          </div>
        )}

        {activeTab === "feedback" && (
          <div className="feedback-form-container">
            <h2>Volunteer Feedback</h2>
            <p>
              Please provide your feedback on the volunteer who completed your request. Let us know how they performed.
            </p>
            <form onSubmit={handleFeedbackSubmit} className="form">
              <div className="form-group">
                <label htmlFor="volunteerId">Volunteer ID</label>
                <input
                  type="number"
                  id="volunteerId"
                  value={feedbackVolunteerId}
                  onChange={(e) => setFeedbackVolunteerId(e.target.value)}
                  placeholder="Enter Volunteer ID"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="feedbackMessage">Feedback</label>
                <textarea
                  id="feedbackMessage"
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Write your feedback about the volunteer's work..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Rating</label>
                {renderStarRating()}
              </div>
              <button type="submit" disabled={feedbackLoading}>
                {feedbackLoading ? "Submitting..." : "Submit Feedback"}
              </button>
              {feedbackSuccess && <p className="success">{feedbackSuccess}</p>}
              {feedbackError && <p className="error">{feedbackError}</p>}
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Contact;
