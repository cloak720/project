// src/main/java/com/marian/project/repository/ContactMessageRepository.java
package com.marian.project.repository;

import com.marian.project.model.ContactMessage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {
    // You can add custom query methods here if needed.
}
