package com.marian.project.controller;

import com.marian.project.model.Feedback;
import com.marian.project.repository.RequestRepository;
import com.marian.project.service.FeedbackService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @Autowired
    private RequestRepository requestRepository;

    private static boolean isAdmin(HttpSession session) {
        Integer role = (Integer) session.getAttribute("role");
        return role != null && role == 0;
    }

    /**
     * A resident rates a volunteer. The author comes from the session (the old frontend
     * hardcoded userId = 1), and you can only rate someone who completed one of your requests.
     */
    @PostMapping
    public ResponseEntity<?> createFeedback(@RequestBody Feedback feedback, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        Integer role = (Integer) session.getAttribute("role");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Please log in again.");
        }
        if (role == null || role != 1) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only residents can rate volunteers.");
        }
        if (feedback.getRating() == null || feedback.getRating() < 1 || feedback.getRating() > 5) {
            return ResponseEntity.badRequest().body("Rating must be between 1 and 5 stars.");
        }
        if (feedback.getComment() != null && feedback.getComment().length() > 1000) {
            return ResponseEntity.badRequest().body("Comments can be up to 1000 characters.");
        }
        Long volunteerId = feedback.getVolunteerId();
        boolean helpedThisUser = volunteerId != null && requestRepository.findByUserId(userId).stream()
                .anyMatch(r -> "COMPLETED".equalsIgnoreCase(r.getStatus())
                        && r.getVolunteer() != null
                        && volunteerId.equals(r.getVolunteer().getId()));
        if (!helpedThisUser) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You can only rate volunteers who completed one of your requests.");
        }
        feedback.setUserId(userId);
        feedback.setReply(null);
        return ResponseEntity.ok(feedbackService.createFeedback(feedback));
    }

    @GetMapping("/volunteer/{volunteerId}")
    public ResponseEntity<List<Feedback>> getFeedbackByVolunteer(@PathVariable Long volunteerId) {
        return ResponseEntity.ok(feedbackService.getFeedbackByVolunteer(volunteerId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Feedback>> getFeedbackByUser(@PathVariable Long userId, HttpSession session) {
        Long sessionUserId = (Long) session.getAttribute("userId");
        if (!isAdmin(session) && (sessionUserId == null || !sessionUserId.equals(userId))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(feedbackService.getFeedbackByUser(userId));
    }

    @GetMapping
    public ResponseEntity<List<Feedback>> getAllFeedback(HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(feedbackService.getAllFeedback());
    }

    @PutMapping("/{id}/reply")
    public ResponseEntity<Feedback> replyToFeedback(@PathVariable Long id, @RequestBody Map<String, String> payload, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        Feedback updatedFeedback = feedbackService.updateFeedbackReply(id, payload.get("reply"));
        return updatedFeedback != null ? ResponseEntity.ok(updatedFeedback) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFeedback(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return feedbackService.deleteFeedback(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
