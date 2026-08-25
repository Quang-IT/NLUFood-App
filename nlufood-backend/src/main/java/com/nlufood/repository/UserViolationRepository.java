package com.nlufood.repository;

import com.nlufood.model.UserViolation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserViolationRepository extends JpaRepository<UserViolation, Long> {
    List<UserViolation> findByUserId(Long userId);
}
