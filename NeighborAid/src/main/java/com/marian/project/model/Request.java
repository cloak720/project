package com.marian.project.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "requests")
public class Request {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Request type cannot be blank")
    private String requestType;

    @NotBlank(message = "Description cannot be blank")
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    private String status = "PENDING";

    @NotBlank(message = "Category cannot be blank")
    private String category;

    @NotBlank(message = "Deadline cannot be blank")
    private String deadline;

    @NotBlank(message = "Urgency cannot be blank")
    private String urgency;

    @NotBlank(message = "Phone number cannot be blank")
    @Pattern(regexp = "^\\d{10,15}$", message = "Phone number must be 10-15 digits")
    private String phoneNumber;

    @NotBlank(message = "House number cannot be blank")
    private String houseNo;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Optional: If you assign a volunteer (as a User) to handle the request
    @ManyToOne
    @JoinColumn(name = "volunteer_id")
    private User volunteer;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getRequestType() { return requestType; }
    public void setRequestType(String requestType) { this.requestType = requestType; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getDeadline() { return deadline; }
    public void setDeadline(String deadline) { this.deadline = deadline; }
    
    public String getUrgency() { return urgency; }
    public void setUrgency(String urgency) { this.urgency = urgency; }
    
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    
    public String getHouseNo() { return houseNo; }
    public void setHouseNo(String houseNo) { this.houseNo = houseNo; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public User getVolunteer() { return volunteer; }
    public void setVolunteer(User volunteer) { this.volunteer = volunteer; }
}
