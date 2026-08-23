package com.nlufood.repository;

import com.nlufood.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByRestaurantIdAndStudentIdOrderByTimestampAsc(Long restaurantId, Long studentId);

    List<ChatMessage> findByRestaurantIdOrderByTimestampDesc(Long restaurantId);

    List<ChatMessage> findByStudentIdOrderByTimestampDesc(Long studentId);

    long countByRestaurantIdAndStudentIdAndSenderRoleAndIsReadFalse(Long restaurantId, Long studentId, String senderRole);

    @Query("SELECT DISTINCT c.studentId FROM ChatMessage c WHERE c.restaurantId = :restaurantId")
    List<Long> findDistinctStudentIdsByRestaurantId(Long restaurantId);

    @Query("SELECT DISTINCT c.restaurantId FROM ChatMessage c WHERE c.studentId = :studentId")
    List<Long> findDistinctRestaurantIdsByStudentId(Long studentId);
}
