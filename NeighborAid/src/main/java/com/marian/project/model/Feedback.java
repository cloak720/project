// src/main/java/com/marian/project/model/Feedback.java
package com.marian.project.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "feedbacks")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ID of the user who gave the feedback
    private Long userId;         

    // ID of the volunteer for whom the feedback is given
    private Long volunteerId;  

    private String comment;
    
    // NEW: Field to store the star rating given by the user
    private Integer rating;
    
    // Optional: Field to store the admin reply
    private String reply;

    public Feedback() {
    }

    public Feedback(Long userId, Long volunteerId, String comment, Integer rating) {
        this.userId = userId;
        this.volunteerId = volunteerId;
        this.comment = comment;
        this.rating = rating;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public Long getUserId() {
        return userId;
    }
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    public Long getVolunteerId() {
        return volunteerId;
    }
    public void setVolunteerId(Long volunteerId) {
        this.volunteerId = volunteerId;
    }
    public String getComment() {
        return comment;
    }
    public void setComment(String comment) {
        this.comment = comment;
    }
    public Integer getRating() {
        return rating;
    }
    public void setRating(Integer rating) {
        this.rating = rating;
    }
    public String getReply() {
        return reply;
    }
    public void setReply(String reply) {
        this.reply = reply;
    }
}
