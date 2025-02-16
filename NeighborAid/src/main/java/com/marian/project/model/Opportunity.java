package com.marian.project.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.sql.Date;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
public class Opportunity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name cannot be blank")
    @Size(max = 100, message = "Name cannot exceed 100 characters")
    private String name;

    @NotBlank(message = "Description cannot be blank")
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @NotBlank(message = "Category cannot be blank")
    private String category;

    @NotBlank(message = "Location cannot be blank")
    private String location;

    @Future(message = "Deadline must be in the future")
    private Date deadline;

    @Min(value = 1, message = "Volunteer limit must be at least 1")
    @Column(nullable = false)
    private Integer volunteerLimit = 1; // Default value to avoid null

    @OneToMany(mappedBy = "opportunity", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonManagedReference  // Allows the volunteers list to be serialized.
    private List<Volunteer> volunteers;

    @Column(nullable = false)
    private Boolean available = true;

    @Column(nullable = false)
    private String status = "PENDING";

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public Date getDeadline() { return deadline; }
    public void setDeadline(Date deadline) { this.deadline = deadline; }
    
    public Integer getVolunteerLimit() { return volunteerLimit; }
    public void setVolunteerLimit(Integer volunteerLimit) { this.volunteerLimit = volunteerLimit; }
    
    public List<Volunteer> getVolunteers() { return volunteers; }
    public void setVolunteers(List<Volunteer> volunteers) { this.volunteers = volunteers; }
    
    public Boolean getAvailable() { return available; }
    public void setAvailable(Boolean available) { this.available = available; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
