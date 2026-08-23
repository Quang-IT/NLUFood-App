package com.nlufood.controller;

import com.nlufood.model.PromoCode;
import com.nlufood.repository.PromoCodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/promocodes")
@CrossOrigin(origins = "*")
public class PromoCodeController {

    @Autowired
    private PromoCodeRepository promoCodeRepository;

    @GetMapping
    public List<PromoCode> getAllActivePromoCodes() {
        return promoCodeRepository.findAll().stream()
                .filter(p -> p.isActive() && (p.getExpiryDate() == null || p.getExpiryDate().isAfter(LocalDateTime.now())))
                .toList();
    }

    @PostMapping
    public PromoCode createPromoCode(@RequestBody PromoCode promoCode) {
        return promoCodeRepository.save(promoCode);
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validatePromoCode(@RequestParam String code, @RequestParam double orderValue) {
        Optional<PromoCode> promoOpt = promoCodeRepository.findByCodeIgnoreCaseAndActiveTrue(code);
        if (promoOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Mã khuyến mãi không tồn tại hoặc đã hết hạn!"));
        }

        PromoCode promo = promoOpt.get();

        if (promo.getExpiryDate() != null && promo.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Mã khuyến mãi đã quá hạn sử dụng!"));
        }

        if (orderValue < promo.getMinOrderValue()) {
            return ResponseEntity.ok(Map.of("success", false, "message", 
                "Đơn hàng tối thiểu phải từ " + String.format("%,.0f", promo.getMinOrderValue()) + "đ để áp dụng mã này!"));
        }

        double discountAmount = 0;
        if ("FLAT".equalsIgnoreCase(promo.getDiscountType())) {
            discountAmount = promo.getDiscountValue();
        } else if ("PERCENTAGE".equalsIgnoreCase(promo.getDiscountType())) {
            discountAmount = orderValue * (promo.getDiscountValue() / 100.0);
            if (promo.getMaxDiscountAmount() > 0 && discountAmount > promo.getMaxDiscountAmount()) {
                discountAmount = promo.getMaxDiscountAmount();
            }
        }

        // Không cho phép giảm quá tổng giá trị đơn hàng
        if (discountAmount > orderValue) {
            discountAmount = orderValue;
        }

        return ResponseEntity.ok(Map.of(
            "success", true,
            "code", promo.getCode(),
            "discountAmount", discountAmount,
            "description", promo.getDescription()
        ));
    }
}
