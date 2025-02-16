import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Uregister.css";

const Uregister = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [houseNo, setHouseNo] = useState("");
    const [phoneNo, setPhoneNo] = useState("");
    const [age, setAge] = useState("");
    const [role, setRole] = useState(1); // Default role: 1 (user)
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [error, setError] = useState({});
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    // Update the theme in localStorage and apply to the body class
    // Reusable validation function for fields
    const validateForm = (name, value) => {
        let errors = {};
        let isValid = true;

        // Check only the current field being validated
        switch (name) {
            case "firstName":
            case "lastName":
                if (/\d/.test(value)) {
                    errors[name] = "Name should not contain numbers.";
                    isValid = false;
                }
                break;
            case "age":
                if (value < 13 || value <= 0 || isNaN(value)) {
                    errors[name] = "Age should be 13 or above.";
                    isValid = false;
                }
                break;
            case "password":
                if (value.length < 6) {
                    errors[name] = "Password must be at least 6 characters long.";
                    isValid = false;
                } else if (!/\d/.test(value) || !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
                    errors[name] = "Password must contain at least one number and one special character.";
                    isValid = false;
                }
                break;
            case "confirmPassword":
                if (value !== password) {
                    errors[name] = "Passwords do not match.";
                    isValid = false;
                }
                break;
            case "email":
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    errors[name] = "Please enter a valid email address.";
                    isValid = false;
                }
                break;
            case "phoneNo":
                if (!/^\d{10}$/.test(value)) {
                    errors[name] = "Phone number must be exactly 10 digits.";
                    isValid = false;
                }
                break;
            default:
                break;
        }

        setError(errors);
        return isValid;
    };

    // Handle each input change and validate in real-time
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Update state dynamically based on the input field
        switch (name) {
            case "firstName":
                setFirstName(value);
                break;
            case "lastName":
                setLastName(value);
                break;
            case "email":
                setEmail(value);
                break;
            case "password":
                setPassword(value);
                break;
            case "confirmPassword":
                setConfirmPassword(value);
                break;
            case "houseNo":
                setHouseNo(value);
                break;
            case "phoneNo":
                setPhoneNo(value);
                break;
            case "age":
                setAge(value);
                break;
            case "role":
                setRole(value);
                break;
            default:
                break;
        }
        validateForm(name, value); // Validate only the current field
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        // Validate Terms and Conditions checkbox
        if (!agreeToTerms) {
            setError({ ...error, agreeToTerms: "You must agree to the terms and conditions." });
            return;
        }

        const formData = {
            firstName,
            lastName,
            email,
            password,
            houseNo,
            phoneNo,
            age: parseInt(age),
            role: parseInt(role),
        };

        let isValid = true;
        Object.keys(formData).forEach((field) => {
            if (!validateForm(field, formData[field])) {
                isValid = false;
            }
        });

        if (!isValid || password !== confirmPassword) {
            setError({ ...error, confirmPassword: "Passwords do not match" });
            return;
        }

        try {
            const response = await axios.post("http://localhost:8080/api/user/register", formData);
            if (response.data) {
                setSuccess("Registration successful! Redirecting to login...");
                setTimeout(() => navigate("/login"), 2000);
            }
            
        } catch (err) {
            console.error("Registration Error:", err.response);
            setError({ general: err.response?.data || "Registration failed. Please try again." });
        }
        
    };

    return (
        <div className={`uregister-page `}>
            <div className="register-container">
                <h2>REGISTER</h2>
                {/* Success and Error Messages */}
                {success && <p className="success-message">{success}</p>}
                {error.general && <p className="error-message">{error.general}</p>}

                {/* Registration Form */}
                <form onSubmit={handleRegister}>
                    {/* First Name */}
                    <div className="input-container">
                        <input
                            type="text"
                            name="firstName"
                            placeholder="First Name"
                            value={firstName}
                            onChange={handleInputChange}
                        />
                        {error.firstName && <p className="error-message">{error.firstName}</p>}
                    </div>

                    {/* Last Name */}
                    <div className="input-container">
                        <input
                            type="text"
                            name="lastName"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={handleInputChange}
                        />
                        {error.lastName && <p className="error-message">{error.lastName}</p>}
                    </div>

                    {/* Email */}
                    <div className="input-container">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={email}
                            onChange={handleInputChange}
                        />
                        {error.email && <p className="error-message">{error.email}</p>}
                    </div>

                    {/* Password */}
                    <div className="input-container">
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={password}
                            onChange={handleInputChange}
                        />
                        {error.password && <p className="error-message">{error.password}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div className="input-container">
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={handleInputChange}
                        />
                        {error.confirmPassword && <p className="error-message">{error.confirmPassword}</p>}
                    </div>

                    {/* House Number */}
                    <div className="input-container">
                        <input
                            type="text"
                            name="houseNo"
                            placeholder="House Number"
                            value={houseNo}
                            onChange={handleInputChange}
                        />
                    </div>

                    {/* Phone Number */}
                    <div className="input-container">
                        <input
                            type="tel"
                            name="phoneNo"
                            placeholder="Phone Number"
                            value={phoneNo}
                            onChange={handleInputChange}
                        />
                        {error.phoneNo && <p className="error-message">{error.phoneNo}</p>}
                    </div>

                    {/* Age */}
                    <div className="input-container">
                        <input
                            type="number"
                            name="age"
                            placeholder="Age"
                            value={age}
                            onChange={handleInputChange}
                        />
                        {error.age && <p className="error-message">{error.age}</p>}
                    </div>

                    {/* Role Selection */}
                    <div className="role-select">
                        <label>Role:</label>
                        <select name="role" value={role} onChange={handleInputChange}>
                            <option value="1">User</option>
                            <option value="2">Volunteer</option>
                        </select>
                    </div>

                    {/* Terms and Conditions Checkbox */}
                    <div className="terms-container">
                        <label>
                            <input
                                type="checkbox"
                                name="agreeToTerms"
                                checked={agreeToTerms}
                                onChange={(e) => setAgreeToTerms(e.target.checked)}
                            />
                            I agree to the <Link to="/terms">Terms and Conditions</Link>
                        </label>
                        {error.agreeToTerms && <p className="error-message">{error.agreeToTerms}</p>}
                    </div>

                    {/* Register Button */}
                    <button type="submit" className="register-button">
                        Register
                    </button>
                </form>

                {/* Login Link */}
                <p className="login-link">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Uregister;