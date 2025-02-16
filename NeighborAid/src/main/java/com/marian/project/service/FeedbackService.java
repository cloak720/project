// src/main/java/com/marian/project/service/FeedbackService.java
package com.marian.project.service;

import com.marian.project.model.Feedback;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class FeedbackService {

    // Dummy in-memory store
    private List<Feedback> feedbackList = new ArrayList<>();

    public Feedback createFeedback(Feedback feedback) {
        // Assume the Feedback entity includes a field for rating
        feedback.setId((long) (feedbackList.size() + 1));
        feedbackList.add(feedback);
        return feedback;
    }

    // Retrieve feedback by volunteerId (i.e. which volunteer the feedback is for)
    public List<Feedback> getFeedbackByVolunteer(Long volunteerId) {
        List<Feedback> result = new ArrayList<>();
        for (Feedback fb : feedbackList) {
            if (fb.getVolunteerId() != null && fb.getVolunteerId().equals(volunteerId)) {
                result.add(fb);
            }
        }
        return result;
    }

    public List<Feedback> getFeedbackByUser(Long userId) {
        List<Feedback> result = new ArrayList<>();
        for (Feedback fb : feedbackList) {
            if (fb.getUserId() != null && fb.getUserId().equals(userId)) {
                result.add(fb);
            }
        }
        return result;
    }
    
    // Retrieve all feedback entries
    public List<Feedback> getAllFeedback() {
        return new ArrayList<>(feedbackList);
    }
    
    // Update feedback with an admin reply
    public Feedback updateFeedbackReply(Long id, String reply) {
        for (Feedback fb : feedbackList) {
            if (fb.getId().equals(id)) {
                fb.setReply(reply);
                return fb;
            }
        }
        return null;
    }
    
    // Delete feedback by id
    public boolean deleteFeedback(Long id) {
        return feedbackList.removeIf(feedback -> feedback.getId().equals(id));
    }
}
