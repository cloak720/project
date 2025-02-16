package com.marian.project.repository;

import com.marian.project.model.Opportunity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.sql.Date;
import java.util.List;

public interface OpportunityRepository extends JpaRepository<Opportunity, Long> {
    List<Opportunity> findByCategory(String category);
    List<Opportunity> findByDeadlineAfter(Date currentDate);
}
