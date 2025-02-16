package com.marian.project.controller;

import com.marian.project.model.Request;
import com.marian.project.service.RequestService;
import com.marian.project.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
public class RequestController {

    @Autowired
    private RequestService requestService;

    @Autowired
    private UserService userService;  // If needed elsewhere

    // Get pending requests (for volunteers)
    @GetMapping("/pending")
    public ResponseEntity<List<Request>> getPendingRequests(HttpSession session) {
        Integer role = (Integer) session.getAttribute("role");
        Long userId = (Long) session.getAttribute("userId");
        System.out.println("Session userId: " + userId + ", role: " + role);
        
        if (role == null || role != 2) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(requestService.getPendingRequests());
    }

    @GetMapping("/all")
    public ResponseEntity<List<Request>> getAllRequests(HttpSession session) {
        Integer role = (Integer) session.getAttribute("role");
        if (role == null || role != 0) { // Only admin allowed
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(requestService.getAllRequests());
    }

    // Accept a request (for volunteers)
    @PutMapping("/{requestId}/accept")
    public ResponseEntity<Request> acceptRequest(@PathVariable Long requestId, HttpSession session) {
        Long volunteerId = (Long) session.getAttribute("userId");
        if (volunteerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(requestService.acceptRequest(requestId, volunteerId));
    }

    // Get accepted requests (for volunteers)
    @GetMapping("/accepted")
    public ResponseEntity<List<Request>> getAcceptedRequests(HttpSession session) {
        Long volunteerId = (Long) session.getAttribute("userId");
        if (volunteerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(requestService.getAcceptedRequestsByVolunteer(volunteerId));
    }

    // Create a new request (for users)
    @PostMapping("/create")
    public ResponseEntity<Request> createRequest(@RequestBody Request request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            Request savedRequest = requestService.saveRequest(request, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    // Get requests for the logged-in user
    @GetMapping("/user")
    public ResponseEntity<List<Request>> getRequestsByUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(requestService.getRequestsByUser(userId));
    }

    @PutMapping("/{requestId}/complete")
    public ResponseEntity<Request> markComplete(@PathVariable Long requestId, HttpSession session) {
        Long volunteerId = (Long) session.getAttribute("userId");
        if (volunteerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            Request updatedRequest = requestService.markComplete(requestId, volunteerId);
            return ResponseEntity.ok(updatedRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    // Get requests by user ID (for admins)
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Request>> getRequestsByUserId(@PathVariable Long userId, HttpSession session) {
        Integer role = (Integer) session.getAttribute("role");
        if (role == null || role != 0) { 
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(requestService.getRequestsByUser(userId));
    }

    // Delete a request (admin or user)
    @DeleteMapping("/{requestId}")
    public ResponseEntity<Void> deleteRequest(@PathVariable Long requestId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        Integer role = (Integer) session.getAttribute("role");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            if (role != null && role == 0) {
                // Admin can delete any request.
                requestService.deleteRequestByAdmin(requestId);
            } else {
                // Non-admin users can only delete their own requests.
                requestService.deleteRequest(requestId, userId);
            }
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}
