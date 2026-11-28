package com.marian.project.controller;

import com.marian.project.model.ContactMessage;
import com.marian.project.service.ContactService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    @Autowired
    private ContactService contactService;

    private static boolean isAdmin(HttpSession session) {
        Integer role = (Integer) session.getAttribute("role");
        return role != null && role == 0;
    }

    @PostMapping
    public ResponseEntity<?> submitContact(@RequestBody ContactMessage message, HttpSession session) {
        // Logged-in people always message from their account email so replies reach them.
        String sessionEmail = (String) session.getAttribute("userEmail");
        if (sessionEmail != null) {
            message.setEmail(sessionEmail);
        }
        if (message.getEmail() == null || message.getEmail().isBlank()
                || message.getSubject() == null || message.getSubject().isBlank()
                || message.getMessage() == null || message.getMessage().isBlank()) {
            return ResponseEntity.badRequest().body("Email, subject and message are required.");
        }
        if (message.getSubject().length() > 150 || message.getMessage().length() > 2000
                || (message.getName() != null && message.getName().length() > 120)) {
            return ResponseEntity.badRequest().body("That message is too long.");
        }
        message.setId(null);
        message.setReply(null);
        return ResponseEntity.ok(contactService.saveContactMessage(message));
    }

    /** Every message, for the admin inbox. Previously open to anyone, which exposed all users' messages. */
    @GetMapping
    public ResponseEntity<List<ContactMessage>> getAllContacts(HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(contactService.getAllContactMessages());
    }

    /** The logged-in person's own messages and the replies to them (used for notifications). */
    @GetMapping("/mine")
    public ResponseEntity<List<ContactMessage>> getMyContacts(HttpSession session) {
        String email = (String) session.getAttribute("userEmail");
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<ContactMessage> mine = contactService.getAllContactMessages().stream()
                .filter(m -> m.getEmail() != null && m.getEmail().equalsIgnoreCase(email))
                .collect(Collectors.toList());
        return ResponseEntity.ok(mine);
    }

    @PutMapping("/{id}/reply")
    public ResponseEntity<ContactMessage> replyToContact(@PathVariable Long id, @RequestBody Map<String, String> payload, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        ContactMessage updatedMessage = contactService.replyToContactMessage(id, payload.get("reply"));
        if (updatedMessage != null) {
            return ResponseEntity.ok(updatedMessage);
        }
        return ResponseEntity.notFound().build();
    }
}
