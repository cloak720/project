package com.marian.project.service;

import com.marian.project.model.Opportunity;
import com.marian.project.model.Volunteer;
import com.marian.project.repository.OpportunityRepository;
import com.marian.project.repository.VolunteerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.sql.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OpportunityService {

    @Autowired
    private OpportunityRepository opportunityRepository;

    @Autowired
    private VolunteerRepository volunteerRepository;

    public List<Opportunity> getAllOpportunities() {
        return opportunityRepository.findAll();
    }

    public Optional<Opportunity> getOpportunityById(Long id) {
        return opportunityRepository.findById(id);
    }

    public Opportunity createOpportunity(Opportunity opportunity) {
        return opportunityRepository.save(opportunity);
    }

    public Opportunity updateOpportunity(Long id, Opportunity updatedOpportunity) {
        return opportunityRepository.findById(id)
                .map(opportunity -> {
                    opportunity.setName(updatedOpportunity.getName());
                    opportunity.setDescription(updatedOpportunity.getDescription());
                    opportunity.setCategory(updatedOpportunity.getCategory());
                    opportunity.setDeadline(updatedOpportunity.getDeadline());
                    opportunity.setLocation(updatedOpportunity.getLocation());
                    opportunity.setVolunteerLimit(updatedOpportunity.getVolunteerLimit());
                    
                    // Update availability based on current signup count
                    boolean available = isSlotAvailable(id);
                    opportunity.setAvailable(available);
                    
                    return opportunityRepository.save(opportunity);
                })
                .orElseGet(() -> {
                    updatedOpportunity.setId(id);
                    boolean available = isSlotAvailable(id);
                    updatedOpportunity.setAvailable(available);
                    return opportunityRepository.save(updatedOpportunity);
                });
    }

    public void deleteOpportunity(Long id) {
        opportunityRepository.deleteById(id);
    }

    @Transactional
    public boolean isSlotAvailable(Long opportunityId) {
        Opportunity opportunity = opportunityRepository.findById(opportunityId)
                .orElseThrow(() -> new RuntimeException("Opportunity not found"));
        long signedUpVolunteers = volunteerRepository.countByOpportunityId(opportunityId);
        boolean available = signedUpVolunteers < opportunity.getVolunteerLimit();
        opportunity.setAvailable(available);
        opportunityRepository.save(opportunity);
        return available;
    }

    public List<Opportunity> getAvailableOpportunities() {
        Date currentDate = new Date(System.currentTimeMillis());
        List<Opportunity> opportunities = opportunityRepository.findByDeadlineAfter(currentDate);
        return opportunities.stream()
                .filter(opportunity -> isSlotAvailable(opportunity.getId()))
                .collect(Collectors.toList());
    }

    public List<Volunteer> getVolunteersForOpportunity(Long opportunityId) {
        opportunityRepository.findById(opportunityId)
                .orElseThrow(() -> new RuntimeException("Opportunity not found"));
        return volunteerRepository.findByOpportunityId(opportunityId);
    }
    
    // === New Cancel Feature ===
    @Transactional
    public void cancelOpportunityApplication(Long opportunityId, Long volunteerId) {
        // Ensure the opportunity exists
        Opportunity opportunity = opportunityRepository.findById(opportunityId)
            .orElseThrow(() -> new RuntimeException("Opportunity not found"));
        // Retrieve the list of volunteers for this opportunity
        List<Volunteer> volunteerList = volunteerRepository.findByOpportunityId(opportunityId);
        // Find the volunteer record for the current user
        Optional<Volunteer> volunteerOpt = volunteerList.stream()
            .filter(vol -> vol.getUser().getId().equals(volunteerId))
            .findFirst();
        if (!volunteerOpt.isPresent()) {
            throw new RuntimeException("Volunteer application not found");
        }
        // Delete the volunteer record to cancel the application
        volunteerRepository.delete(volunteerOpt.get());
        // Update opportunity availability after cancellation
        isSlotAvailable(opportunityId);
    }
    // === End New Cancel Feature ===
}
