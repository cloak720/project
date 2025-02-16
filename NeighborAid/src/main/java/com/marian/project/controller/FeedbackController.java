// src/main/java/com/marian/project/controller/FeedbackController.java
package com.marian.project.controller;

import com.marian.project.model.Feedback;
import com.marian.project.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @PostMapping
    public ResponseEntity<Feedback> createFeedback(@RequestBody Feedback feedback) {
        // Expects feedback to include userId, volunteerId, comment, and rating
        return ResponseEntity.ok(feedbackService.createFeedback(feedback));
    }

    @GetMapping("/volunteer/{volunteerId}")
    public ResponseEntity<List<Feedback>> getFeedbackByVolunteer(@PathVariable Long volunteerId) {
        return ResponseEntity.ok(feedbackService.getFeedbackByVolunteer(volunteerId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Feedback>> getFeedbackByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(feedbackService.getFeedbackByUser(userId));
    }
    
    @GetMapping
    public ResponseEntity<List<Feedback>> getAllFeedback() {
        return ResponseEntity.ok(feedbackService.getAllFeedback());
    }
    
    @PutMapping("/{id}/reply")
    public ResponseEntity<Feedback> replyToFeedback(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String reply = payload.get("reply");
        Feedback updatedFeedback = feedbackService.updateFeedbackReply(id, reply);
        if (updatedFeedback != null) {
            return ResponseEntity.ok(updatedFeedback);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    // New Delete Endpoint for Feedback
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFeedback(@PathVariable Long id) {
        boolean deleted = feedbackService.deleteFeedback(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
