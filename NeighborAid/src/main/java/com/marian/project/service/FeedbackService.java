package com.marian.project.service;

import com.marian.project.model.Feedback;
import com.marian.project.repository.FeedbackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

// Feedback used to live in an in-memory list and vanished on every restart.
// It is a JPA entity with a repository, so store it in the database like everything else.
@Service
public class FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    public Feedback createFeedback(Feedback feedback) {
        feedback.setId(null);
        return feedbackRepository.save(feedback);
    }

    public List<Feedback> getFeedbackByVolunteer(Long volunteerId) {
        return feedbackRepository.findByVolunteerId(volunteerId);
    }

    public List<Feedback> getFeedbackByUser(Long userId) {
        return feedbackRepository.findByUserId(userId);
    }

    public List<Feedback> getAllFeedback() {
        return feedbackRepository.findAll();
    }

    public Feedback updateFeedbackReply(Long id, String reply) {
        return feedbackRepository.findById(id)
                .map(fb -> {
                    fb.setReply(reply);
                    return feedbackRepository.save(fb);
                })
                .orElse(null);
    }

    public boolean deleteFeedback(Long id) {
        if (!feedbackRepository.existsById(id)) {
            return false;
        }
        feedbackRepository.deleteById(id);
        return true;
    }
}
