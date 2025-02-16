// src/main/java/com/marian/project/model/Notification.java
package com.marian.project.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;  // The ID of the user who receives the notification

    private String message;

    // Rename the field from 'read' to 'isRead'
    @Column(name = "is_read", nullable = false)
    private boolean isRead;

    // Default constructor (required by JPA)
    public Notification() {
    }

    // Optional parameterized constructor
    public Notification(Long userId, String message, boolean isRead) {
        this.userId = userId;
        this.message = message;
        this.isRead = isRead;
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
    public String getMessage() {
        return message;
    }
    public void setMessage(String message) {
        this.message = message;
    }
    public boolean isRead() {
        return isRead;
    }
    public void setRead(boolean isRead) {
        this.isRead = isRead;
    }
}
