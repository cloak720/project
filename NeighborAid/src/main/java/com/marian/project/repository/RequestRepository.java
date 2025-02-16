package com.marian.project.repository;

import com.marian.project.model.Request;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RequestRepository extends JpaRepository<Request, Long> {
    List<Request> findByStatus(String status);
    List<Request> findByVolunteerIdAndStatus(Long volunteerId, String status);
    List<Request> findByUserId(Long userId);
    List<Request> findByVolunteerId(Long volunteerId);
}
