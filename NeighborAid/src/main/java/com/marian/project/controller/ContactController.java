// src/main/java/com/marian/project/controller/ContactController.java
package com.marian.project.controller;

import com.marian.project.model.ContactMessage;
import com.marian.project.service.ContactService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contact")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class ContactController {

    @Autowired
    private ContactService contactService;

    @PostMapping
    public ResponseEntity<ContactMessage> submitContact(@RequestBody ContactMessage message) {
        ContactMessage savedMessage = contactService.saveContactMessage(message);
        return ResponseEntity.ok(savedMessage);
    }

    @GetMapping
    public ResponseEntity<List<ContactMessage>> getAllContacts() {
        List<ContactMessage> messages = contactService.getAllContactMessages();
        return ResponseEntity.ok(messages);
    }
    
    // Reply to a contact message using PUT
    @PutMapping("/{id}/reply")
    public ResponseEntity<ContactMessage> replyToContact(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        System.out.println("Received reply request for ID: " + id + " with payload: " + payload);
        String reply = payload.get("reply");
        ContactMessage updatedMessage = contactService.replyToContactMessage(id, reply);
        if (updatedMessage != null) {
            return ResponseEntity.ok(updatedMessage);
        }
        return ResponseEntity.notFound().build();
    }
}
