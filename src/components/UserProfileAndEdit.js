import { useState, useEffect } from 'react';
import axios from 'axios';
import "./UserProfileAndEdit.css";

const UserProfileAndEdit = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNo: '',
    age: '',
    houseNo: '',
    email: '',
    role: 1 // Default role set to 1 (user)
  });

  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = sessionStorage.getItem('userId'); // Get userId from sessionStorage
      console.log('Fetched userId:', userId);  // Log to check if the userId is correct

      if (!userId) {
        setError('User ID not found. Please log in again.');
        return;
      }

      try {
        console.log(`Making API call to: http://localhost:8080/api/user/${userId}`); // Log the request URL
        const response = await axios.get(`http://localhost:8080/api/user/${userId}`, {
          withCredentials: true
        });
        console.log('API response:', response); // Log the API response for debugging
        if (response.status === 200) {
          setFormData({
            firstName: response.data.firstName,
            lastName: response.data.lastName,
            phoneNo: response.data.phoneNo,
            age: response.data.age,
            houseNo: response.data.houseNo,
            email: response.data.email,
            role: response.data.role
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('There was an error fetching user data.');
      }
    };

    fetchUserData();
  }, []);  // The empty dependency array ensures this effect runs once on component mount
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = sessionStorage.getItem('userId'); // Get userId from sessionStorage
    if (!userId) {
      setError('User ID not found. Please log in again.');
      return;
    }

    try {
      // Ensure role is an integer before sending it to the backend
      const updatedData = {
        ...formData,
        role: parseInt(formData.role, 10)
      };

      const response = await axios.put(
        `http://localhost:8080/api/user/${userId}`,
        updatedData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Check if the update was successful
      if (response.status === 200) {
        alert('User updated successfully');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError('There was an error updating the user.');
    }
  };

  return (
    <div className="user-profile-container">
      <h1>User Profile</h1>
      {error && <p className="error-message">{error}</p>}
      <div className="profile-details">
        <p><strong>First Name:</strong> {formData.firstName}</p>
        <p><strong>Last Name:</strong> {formData.lastName}</p>
        <p><strong>Phone Number:</strong> {formData.phoneNo}</p>
        <p><strong>Age:</strong> {formData.age}</p>
        <p><strong>House Number:</strong> {formData.houseNo}</p>
        <p><strong>Email:</strong> {formData.email}</p>
        <p><strong>Role:</strong> {formData.role === 0 ? 'Admin' : formData.role === 1 ? 'User' : 'Volunteer'}</p>
      </div>

      <button className="edit-button" onClick={() => setIsEditing(true)}>Edit Details</button>

      {isEditing && (
        <form className="edit-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="phoneNo"
            placeholder="Phone Number"
            value={formData.phoneNo}
            onChange={handleInputChange}
            required
          />
          <input
            type="number"
            name="age"
            placeholder="Age"
            value={formData.age}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="houseNo"
            placeholder="House Number"
            value={formData.houseNo}
            onChange={handleInputChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          
          <button type="submit" className="save-button">Save Changes</button>
          <button type="button" className="cancel-button" onClick={() => setIsEditing(false)}>Cancel</button>
        </form>
      )}
    </div>
  );
};

export default UserProfileAndEdit;
