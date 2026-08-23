package com.nlufood.repository;

import com.nlufood.model.SavedVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedVoucherRepository extends JpaRepository<SavedVoucher, Long> {
    List<SavedVoucher> findByUserId(Long userId);
    Optional<SavedVoucher> findByUserIdAndPromoCodeId(Long userId, Long promoCodeId);
}
