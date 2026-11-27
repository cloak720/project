package com.marian.project.controller;

import com.marian.project.model.Opportunity;
import com.marian.project.model.Volunteer;
import com.marian.project.repository.VolunteerRepository;
import com.marian.project.service.OpportunityService;

import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/opportunities")
public class OpportunityController {

    @Autowired
    private OpportunityService opportunityService;

    @Autowired
    private VolunteerRepository volunteerRepository;

    private static boolean isAdmin(HttpSession session) {
        Integer role = (Integer) session.getAttribute("role");
        return role != null && role == 0;
    }

    @GetMapping("/available")
    public ResponseEntity<List<Opportunity>> getAvailableOpportunities() {
        return ResponseEntity.ok(opportunityService.getAvailableOpportunities());
    }

    @GetMapping("/all")
    public ResponseEntity<List<Opportunity>> getAllOpportunities(HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(opportunityService.getAllOpportunities());
    }

    /** Opportunities the logged-in volunteer has joined, including ones that are now full. */
    @GetMapping("/mine")
    public ResponseEntity<List<Opportunity>> getMyOpportunities(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<Opportunity> mine = volunteerRepository.findByUserId(userId).stream()
                .map(Volunteer::getOpportunity)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        return ResponseEntity.ok(mine);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Opportunity> getOpportunityById(@PathVariable Long id) {
        return opportunityService.getOpportunityById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createOpportunity(@RequestBody Opportunity opportunity, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins can create opportunities.");
        }
        opportunity.setId(null);
        opportunity.setVolunteers(null);
        return ResponseEntity.status(HttpStatus.CREATED).body(opportunityService.createOpportunity(opportunity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateOpportunity(@PathVariable Long id, @RequestBody Opportunity opportunity, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins can edit opportunities.");
        }
        long joined = volunteerRepository.countByOpportunityId(id);
        if (opportunity.getVolunteerLimit() == null || opportunity.getVolunteerLimit() < Math.max(1, joined)) {
            return ResponseEntity.badRequest().body(
                "The volunteer limit can't be lower than the " + joined + " people who have already joined.");
        }
        return ResponseEntity.ok(opportunityService.updateOpportunity(id, opportunity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteOpportunity(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins can delete opportunities.");
        }
        opportunityService.deleteOpportunity(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/volunteers")
    public ResponseEntity<List<Volunteer>> getVolunteersForOpportunity(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(opportunityService.getVolunteersForOpportunity(id));
    }
}
