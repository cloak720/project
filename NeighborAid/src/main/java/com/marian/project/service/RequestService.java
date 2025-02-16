package com.marian.project.service;

import com.marian.project.model.Request;
import com.marian.project.model.User;
import com.marian.project.repository.RequestRepository;
import com.marian.project.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class RequestService {
    @Autowired
    private RequestRepository requestRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Request> getPendingRequests() {
        return requestRepository.findByStatus("PENDING");
    }

    public List<Request> getAcceptedRequestsByVolunteer(Long volunteerId) {
        return requestRepository.findByVolunteerId(volunteerId);
    }

    public List<Request> getRequestsByUser(Long userId) {
        return requestRepository.findByUserId(userId);
    }
    
    // Get all requests (for admin)
    public List<Request> getAllRequests() {
        return requestRepository.findAll();
    }

    @Transactional
    public Request saveRequest(Request request, Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != 1) { 
            throw new RuntimeException("Only users can create requests");
        }

        request.setUser(user);
        return requestRepository.save(request);
    }

    @Transactional
    public Request acceptRequest(Long requestId, Long volunteerId) {
        Request request = requestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!"PENDING".equals(request.getStatus())) { 
            throw new RuntimeException("Request is already accepted");
        }

        User volunteer = userRepository.findById(volunteerId)
            .orElseThrow(() -> new RuntimeException("Volunteer not found"));

        request.setVolunteer(volunteer);
        request.setStatus("ACCEPTED");
        return requestRepository.save(request);
    }

    @Transactional
    public void deleteRequest(Long requestId, Long userId) {
        Request request = requestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Request not found"));

        // For non-admin users, ensure the request belongs to them.
        if (!request.getUser().getId().equals(userId)) { 
            throw new RuntimeException("You can only delete your own requests");
        }

        requestRepository.deleteById(requestId);
    }
    
    // NEW: Admin deletion method that does not check ownership.
    @Transactional
    public void deleteRequestByAdmin(Long requestId) {
        Request request = requestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Request not found"));
        requestRepository.deleteById(requestId);
    }

    public Request findById(Long requestId) {
        return requestRepository.findById(requestId).orElse(null);
    }

    @Transactional
    public Request markComplete(Long requestId, Long volunteerId) {
        Request request = requestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!"ACCEPTED".equalsIgnoreCase(request.getStatus())) {
            throw new RuntimeException("Only accepted requests can be marked as completed");
        }

        if (request.getVolunteer() == null || !request.getVolunteer().getId().equals(volunteerId)) {
            throw new RuntimeException("You are not authorized to complete this request");
        }

        request.setStatus("COMPLETED");
        return requestRepository.save(request);
    }
}
