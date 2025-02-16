// src/main/java/com/marian/project/repository/FeedbackRepository.java
package com.marian.project.repository;

import com.marian.project.model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByVolunteerId(Long volunteerId);
    List<Feedback> findByUserId(Long userId);
}
