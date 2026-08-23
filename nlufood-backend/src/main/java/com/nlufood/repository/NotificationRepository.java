package com.nlufood.repository;

import com.nlufood.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedTimeDesc(Long userId);
    long countByUserIdAndIsReadFalse(Long userId);
}
