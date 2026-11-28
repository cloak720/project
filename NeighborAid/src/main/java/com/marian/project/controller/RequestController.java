package com.marian.project.controller;

import com.marian.project.model.Request;
import com.marian.project.service.RequestService;
import com.marian.project.service.UserService;
import jakarta.servlet.http.HttpSession;
import com.marian.project.RequestValidation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/requests")
public class RequestController {

    @Autowired
    private RequestService requestService;

    @Autowired
    private RequestValidation validation;

    @Autowired
    private UserService userService;  // If needed elsewhere

    // Get pending requests (for volunteers)
    @GetMapping("/pending")
    public ResponseEntity<List<Request>> getPendingRequests(HttpSession session) {
        Integer role = (Integer) session.getAttribute("role");
        if (role == null || role != 2) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        // The resident's phone number is only shared with the volunteer who accepts the request.
        List<Request> open = requestService.getPendingRequests().stream()
                .map(Request::withoutContactDetails)
                .collect(Collectors.toList());
        return ResponseEntity.ok(open);
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
    public ResponseEntity<?> acceptRequest(@PathVariable Long requestId, HttpSession session) {
        Long volunteerId = (Long) session.getAttribute("userId");
        Integer role = (Integer) session.getAttribute("role");
        if (volunteerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (role == null || role != 2) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only volunteers can accept requests.");
        }
        try {
            return ResponseEntity.ok(requestService.acceptRequest(requestId, volunteerId));
        } catch (RuntimeException e) {
            // Usually another volunteer got there first.
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
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
    public ResponseEntity<?> createRequest(@RequestBody Request request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        Integer role = (Integer) session.getAttribute("role");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (role == null || role != 1) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only residents can post requests.");
        }
        var invalid = validation.problems(request);
        if (invalid.isPresent()) {
            return invalid.get();
        }

        try {
            // Status and volunteer are server-controlled; ignore whatever the client sent.
            request.setId(null);
            request.setStatus("PENDING");
            request.setVolunteer(null);
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
    public ResponseEntity<?> markComplete(@PathVariable Long requestId, HttpSession session) {
        Long volunteerId = (Long) session.getAttribute("userId");
        if (volunteerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            Request updatedRequest = requestService.markComplete(requestId, volunteerId);
            return ResponseEntity.ok(updatedRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
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
    public ResponseEntity<?> deleteRequest(@PathVariable Long requestId, HttpSession session) {
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
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }
}
