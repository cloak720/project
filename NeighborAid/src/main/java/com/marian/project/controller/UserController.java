package com.marian.project.controller;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.marian.project.model.User;
import com.marian.project.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    private static boolean isAdmin(HttpSession session) {
        Integer role = (Integer) session.getAttribute("role");
        return role != null && role == 0;
    }

    @GetMapping("/all")
    public ResponseEntity<List<User>> getAllUsers(HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody User user) {
        // Public sign-up may only create residents (1) or volunteers (2); admins are created by hand.
        if (user.getRole() == null || (user.getRole() != 1 && user.getRole() != 2)) {
            return ResponseEntity.badRequest().body("Choose whether you're joining as a resident or a volunteer.");
        }
        if (user.getAge() == null || user.getAge() < 18) {
            return ResponseEntity.badRequest().body("You must be 18 or older to join.");
        }
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body("Email is required.");
        }
        if (user.getPassword() == null || user.getPassword().length() < 8 || user.getPassword().length() > 128) {
            return ResponseEntity.badRequest().body("Passwords must be between 8 and 128 characters.");
        }
        user.setEmail(user.getEmail().trim().toLowerCase());
        if (userService.isEmailRegistered(user.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("An account with this email already exists. Try logging in.");
        }
        user.setId(null);
        user.setBanned(false);
        userService.registerUser(user);
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest, HttpServletRequest request) {
        try {
            String email = loginRequest.getEmail() == null ? "" : loginRequest.getEmail().trim();
            User user = userService.authenticate(email, loginRequest.getPassword());
            if (user != null) {
                // New session ID on every login, so a session ID planted before login (session fixation) is useless.
                HttpSession session = request.getSession(true);
                request.changeSessionId();
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
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "message", "Login failed: Invalid email or password.",
                "loginStatus", "failed"
            ));
        } catch (RuntimeException ex) {
            // Thrown for banned users
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "message", ex.getMessage(),
                "loginStatus", "failed"
            ));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok("Logged out successfully");
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<?> getUserByEmail(@PathVariable String email, HttpSession session) {
        String sessionEmail = (String) session.getAttribute("userEmail");
        if (sessionEmail == null || !sessionEmail.equalsIgnoreCase(email)) {
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
        if (user.getAge() != null && user.getAge() < 18) {
            return ResponseEntity.badRequest().body("You must be 18 or older.");
        }
        if (user.getEmail() != null) {
            user.setEmail(user.getEmail().trim().toLowerCase());
            boolean takenBySomeoneElse = userService.findByEmail(user.getEmail())
                .map(existing -> !existing.getId().equals(id))
                .orElse(false);
            if (takenBySomeoneElse) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("That email is already used by another account.");
            }
        }
        User updatedUser = userService.updateUser(id, user);
        // Keep the session in step, otherwise email-based lookups (e.g. joining opportunities) break.
        session.setAttribute("userEmail", updatedUser.getEmail());
        return ResponseEntity.ok(updatedUser);
    }

    @PutMapping("/{id}/ban")
    public ResponseEntity<?> banUser(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }
        try {
            return ResponseEntity.ok(userService.banUser(id));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ex.getMessage());
        }
    }

    @PutMapping("/{id}/unban")
    public ResponseEntity<?> unbanUser(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }
        try {
            return ResponseEntity.ok(userService.unbanUser(id));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ex.getMessage());
        }
    }

    /** Self-service account deletion: removes the logged-in person's account and data, then ends the session. */
    @DeleteMapping("/me")
    public ResponseEntity<?> deleteOwnAccount(HttpSession session) {
        Long sessionUserId = (Long) session.getAttribute("userId");
        if (sessionUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Please log in again.");
        }
        try {
            userService.deleteUser(sessionUserId);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        }
        session.invalidate();
        return ResponseEntity.noContent().build();
    }

    // The admin dashboard has always had a Delete button; this is the endpoint it calls.
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }
        try {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        }
    }
}
