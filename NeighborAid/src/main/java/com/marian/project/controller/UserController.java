package com.marian.project.controller;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.marian.project.model.User;
import com.marian.project.service.UserService;
import jakarta.servlet.http.HttpSession;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;
    
    @GetMapping("/all")
    public ResponseEntity<List<User>> getAllUsers(HttpSession session) {
        Integer role = (Integer) session.getAttribute("role");
        if (role == null || role != 0) { // Only admin (role 0) allowed
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        User savedUser = userService.registerUser(user);
        if (savedUser != null) {
            return ResponseEntity.ok("User registered successfully");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Registration failed");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest, HttpSession session) {
        try {
            User user = userService.authenticate(loginRequest.getEmail(), loginRequest.getPassword());
            if (user != null) {
                // Store user data in session
                session.setAttribute("userEmail", user.getEmail());
                session.setAttribute("userId", user.getId());
                session.setAttribute("role", user.getRole());

                return ResponseEntity.ok(Map.of(
                    "message", "Login successful! Welcome " + user.getFirstName(),
                    "role", user.getRole(),
                    "userId", user.getId(),
                    "firstName", user.getFirstName(),
                    "lastName", user.getLastName(),
                    "email", user.getEmail(),
                    "phone", user.getPhoneNo(),
                    "loginStatus", "success"
                ));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "message", "Login failed: Invalid email or password.",
                    "loginStatus", "failed"
                ));
            }
        } catch (RuntimeException ex) {
            // Handles the case where the user is banned
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "message", ex.getMessage(),
                "loginStatus", "failed"
            ));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpSession session) {
        // Invalidate the session to log the user out
        session.invalidate();
        return ResponseEntity.ok("Logged out successfully");
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<?> getUserByEmail(@PathVariable String email, HttpSession session) {
        String sessionEmail = (String) session.getAttribute("userEmail");

        if (sessionEmail == null || !sessionEmail.equals(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }
        
        return ResponseEntity.ok(userService.findByEmail(email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id, HttpSession session) {
        Long sessionUserId = (Long) session.getAttribute("userId");
        if (sessionUserId == null || !sessionUserId.equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User user, HttpSession session) {
        Long sessionUserId = (Long) session.getAttribute("userId");

        if (sessionUserId == null || !sessionUserId.equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }

        User updatedUser = userService.updateUser(id, user);
        return ResponseEntity.ok(updatedUser);
    }

    // Ban a user (admin only)
    @PutMapping("/{id}/ban")
    public ResponseEntity<?> banUser(@PathVariable Long id, HttpSession session) {
        // Check if the logged-in user is an admin (role 0)
        Integer role = (Integer) session.getAttribute("role");
        if (role == null || role != 0) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }
        
        try {
            User updatedUser = userService.banUser(id);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ex.getMessage());
        }
    }

    // Unban a user (admin only)
    @PutMapping("/{id}/unban")
    public ResponseEntity<?> unbanUser(@PathVariable Long id, HttpSession session) {
        // Check if the logged-in user is an admin (role 0)
        Integer role = (Integer) session.getAttribute("role");
        if (role == null || role != 0) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }
        
        try {
            User updatedUser = userService.unbanUser(id);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ex.getMessage());
        }
    }
}
