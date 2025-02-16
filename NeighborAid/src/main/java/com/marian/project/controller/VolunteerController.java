package com.marian.project.controller;

import com.marian.project.service.OpportunityService;
import com.marian.project.service.VolunteerService;
import com.marian.project.repository.UserRepository;
import com.marian.project.model.User;
import com.marian.project.model.Volunteer;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/volunteers")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class VolunteerController {

    @Autowired
    private VolunteerService volunteerService;
    
    @Autowired
    private OpportunityService opportunityService;
    
    @Autowired
    private UserRepository userRepository;

    @PostMapping("/opportunities/{opportunityId}/accept")
    public ResponseEntity<?> acceptOpportunity(@PathVariable Long opportunityId, HttpSession session) {
        // Retrieve the email stored in session (set during login)
        String email = (String) session.getAttribute("userEmail");
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not logged in.");
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found with email: " + email);
        }

        try {
            Volunteer volunteer = volunteerService.acceptOpportunity(user.getId(), opportunityId);
            return ResponseEntity.ok(volunteer);
        } catch (IllegalArgumentException ex) {
            System.out.println("🔴 NOT FOUND ERROR: " + ex.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
        } catch (IllegalStateException ex) {
            System.out.println("⚠️ CONFLICT ERROR: " + ex.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
        } catch (Exception ex) {
            System.out.println("❌ SERVER ERROR: " + ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body("An error occurred: " + ex.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Volunteer>> getAllVolunteers() {
        List<Volunteer> volunteers = volunteerService.getAllVolunteers();
        return ResponseEntity.ok(volunteers);
    }
    
    // === New Cancel Endpoint ===
    @DeleteMapping("/opportunities/{opportunityId}/cancel")
    public ResponseEntity<?> cancelApplication(@PathVariable Long opportunityId, HttpSession session) {
        Long volunteerId = (Long) session.getAttribute("userId");
        if (volunteerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            opportunityService.cancelOpportunityApplication(opportunityId, volunteerId);
            return ResponseEntity.ok("Application canceled successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
    // === End New Cancel Endpoint ===
}
