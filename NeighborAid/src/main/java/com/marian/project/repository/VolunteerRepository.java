package com.marian.project.repository;

import com.marian.project.model.Volunteer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VolunteerRepository extends JpaRepository<Volunteer, Long> {
    List<Volunteer> findByUserId(Long userId);
    List<Volunteer> findByOpportunityId(Long opportunityId);
    boolean existsByUserIdAndOpportunityId(Long userId, Long opportunityId);
    long countByOpportunityId(Long opportunityId);
    List<Volunteer> findByOpportunityIdAndStatus(Long opportunityId, String status);
}
