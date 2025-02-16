package com.marian.project.controller;

import com.marian.project.model.Opportunity;
import com.marian.project.model.Volunteer;
import com.marian.project.service.OpportunityService;

import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/opportunities")
public class OpportunityController {

    @Autowired
    private OpportunityService opportunityService;

    @GetMapping("/available")
    public ResponseEntity<List<Opportunity>> getAvailableOpportunities() {
        List<Opportunity> availableOpportunities = opportunityService.getAvailableOpportunities();
        return ResponseEntity.ok(availableOpportunities);
    }
    @GetMapping("/all")
    public ResponseEntity<List<Opportunity>> getAllOpportunities(HttpSession session) {
        Integer role = (Integer) session.getAttribute("role");
        if (role == null || role != 0) { // Only admin allowed
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(opportunityService.getAllOpportunities());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Opportunity> getOpportunityById(@PathVariable Long id) {
        return opportunityService.getOpportunityById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Opportunity> createOpportunity(@RequestBody Opportunity opportunity) {
        System.out.println("Received request to create opportunity: " + opportunity);
        Opportunity createdOpportunity = opportunityService.createOpportunity(opportunity);
        return ResponseEntity.status(201).body(createdOpportunity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Opportunity> updateOpportunity(@PathVariable Long id, @RequestBody Opportunity opportunity) {
        Opportunity updatedOpportunity = opportunityService.updateOpportunity(id, opportunity);
        return ResponseEntity.ok(updatedOpportunity);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOpportunity(@PathVariable Long id) {
        opportunityService.deleteOpportunity(id);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/{id}/volunteers")
    public ResponseEntity<List<Volunteer>> getVolunteersForOpportunity(@PathVariable Long id) {
        List<Volunteer> volunteers = opportunityService.getVolunteersForOpportunity(id);
        return ResponseEntity.ok(volunteers);
    }

}
