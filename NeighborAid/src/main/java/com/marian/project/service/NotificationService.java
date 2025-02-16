// src/main/java/com/marian/project/service/NotificationService.java
package com.marian.project.service;

import com.marian.project.model.Notification;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    // Dummy in-memory store
    private List<Notification> notificationList = new ArrayList<>();

    public List<Notification> getNotificationsByUserId(Long userId) {
        return notificationList.stream()
                .filter(n -> n.getId().equals(userId))
                .collect(Collectors.toList());
    }

    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationList.stream()
                .filter(n -> n.getUserId().equals(userId) && !n.isRead())
                .collect(Collectors.toList());
    }

    public Notification createNotification(Notification notification) {
        notification.setId((long) (notificationList.size() + 1));
        notificationList.add(notification);
        return notification;
    }

    public void markAsRead(Long id) {
        for (Notification n : notificationList) {
            if (n.getId().equals(id)) {
                n.setRead(true);
                break;
            }
        }
    }
}
