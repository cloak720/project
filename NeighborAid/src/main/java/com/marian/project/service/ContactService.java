// src/main/java/com/marian/project/service/ContactService.java
package com.marian.project.service;

import com.marian.project.model.ContactMessage;
import com.marian.project.repository.ContactMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ContactService {

    @Autowired
    private ContactMessageRepository contactMessageRepository;

    public ContactMessage saveContactMessage(ContactMessage message) {
        return contactMessageRepository.save(message);
    }
    
    // Retrieve all contact messages
    public List<ContactMessage> getAllContactMessages() {
        return contactMessageRepository.findAll();
    }
    
    // Update a contact message with an admin reply
    public ContactMessage replyToContactMessage(Long id, String reply) {
        ContactMessage message = contactMessageRepository.findById(id).orElse(null);
        if (message != null) {
            message.setReply(reply);
            return contactMessageRepository.save(message);
        }
        return null;
    }
}
