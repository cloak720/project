package com.marian.project.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
public class Volunteer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many volunteers belong to one user
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "User must be specified")
    private User user;

    // Many volunteers belong to one opportunity
    @ManyToOne
    @JoinColumn(name = "opportunity_id", nullable = false)
    @NotNull(message = "Opportunity must be specified")
    @JsonBackReference  // Use this instead of @JsonIgnore to include opportunity details
    private Opportunity opportunity;

    private String status;

    @FutureOrPresent(message = "Start date must be in the present or future")
    private LocalDate startDate;

    @Future(message = "End date must be in the future")
    private LocalDate endDate;

    // Removed totalHours field

    // New fields for rating functionality
    @Min(value = 0, message = "Rating sum cannot be negative")
    private Integer ratingSum = 0;  // Total of all ratings received

    @Min(value = 0, message = "Rating count cannot be negative")
    private Integer ratingCount = 0; // Number of ratings received

    // Transient average rating computed on the fly.
    @Transient
    public Double getAverageRating() {
        if (ratingCount == null || ratingCount == 0) {
            return 0.0;
        }
        return ratingSum.doubleValue() / ratingCount;
    }

    @Size(max = 1000, message = "Notes cannot exceed 1000 characters")
    private String notes;

    // Default constructor sets default values
    public Volunteer() {
        this.status = "PENDING";
        // totalHours removed
    }

    // Getters and Setters

    public Long getId() { 
        return id; 
    }
    public void setId(Long id) { 
        this.id = id; 
    }
    
    public User getUser() { 
        return user; 
    }
    public void setUser(User user) { 
        this.user = user; 
    }
    
    public Opportunity getOpportunity() { 
        return opportunity; 
    }
    public void setOpportunity(Opportunity opportunity) { 
        this.opportunity = opportunity; 
    }
    
    public String getStatus() { 
        return status; 
    }
    public void setStatus(String status) { 
        this.status = status; 
    }
    
    public LocalDate getStartDate() { 
        return startDate; 
    }
    public void setStartDate(LocalDate startDate) { 
        this.startDate = startDate; 
    }
    
    public LocalDate getEndDate() { 
        return endDate; 
    }
    public void setEndDate(LocalDate endDate) { 
        this.endDate = endDate; 
    }
    
    public Integer getRatingSum() { 
        return ratingSum; 
    }
    public void setRatingSum(Integer ratingSum) { 
        this.ratingSum = ratingSum; 
    }
    
    public Integer getRatingCount() { 
        return ratingCount; 
    }
    public void setRatingCount(Integer ratingCount) { 
        this.ratingCount = ratingCount; 
    }
    
    public String getNotes() { 
        return notes; 
    }
    public void setNotes(String notes) { 
        this.notes = notes; 
    }
}
