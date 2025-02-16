// src/main/java/com/marian/project/repository/NotificationRepository.java
package com.marian.project.repository;

import com.marian.project.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserId(Long userId);
    // Use the new property name "isRead" in the derived query method:
    List<Notification> findByUserIdAndIsReadFalse(Long userId);
}
