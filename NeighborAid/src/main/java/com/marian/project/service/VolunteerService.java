package com.marian.project.service;

import com.marian.project.model.Volunteer;
import com.marian.project.repository.VolunteerRepository;
import com.marian.project.repository.UserRepository;
import com.marian.project.repository.OpportunityRepository;
import com.marian.project.model.User;
import com.marian.project.model.Opportunity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class VolunteerService {

    @Autowired
    private VolunteerRepository volunteerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OpportunityRepository opportunityRepository;

    @Transactional
    public Volunteer acceptOpportunity(Long userId, Long opportunityId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));
        Opportunity opportunity = opportunityRepository.findById(opportunityId)
                .orElseThrow(() -> new IllegalArgumentException("Opportunity not found with ID: " + opportunityId));

        // Prevent duplicate application
        if (volunteerRepository.existsByUserIdAndOpportunityId(userId, opportunityId)) {
            throw new IllegalStateException("User has already applied for this opportunity.");
        }

        // Check if there is room for another volunteer
        long currentVolunteers = volunteerRepository.countByOpportunityId(opportunityId);
        if (opportunity.getVolunteerLimit() != null && currentVolunteers >= opportunity.getVolunteerLimit()) {
            throw new IllegalStateException("Volunteer limit reached for this opportunity.");
        }

        Volunteer volunteer = new Volunteer();
        volunteer.setUser(user);
        volunteer.setOpportunity(opportunity);
        volunteer.setStatus("PENDING");

        // Note: The Volunteer entity no longer contains the totalHours field.
        volunteer = volunteerRepository.save(volunteer);

        // Initialize the opportunity's volunteer list if null, then add the new volunteer
        if (opportunity.getVolunteers() == null) {
            opportunity.setVolunteers(new java.util.ArrayList<>());
        }
        opportunity.getVolunteers().add(volunteer);
        opportunityRepository.save(opportunity);

        return volunteer;
    }

    public List<Volunteer> getAllVolunteers() {
        return volunteerRepository.findAll();
    }
}
