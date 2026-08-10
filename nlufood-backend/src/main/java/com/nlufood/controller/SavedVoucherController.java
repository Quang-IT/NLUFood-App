package com.nlufood.controller;

import com.nlufood.model.PromoCode;
import com.nlufood.model.SavedVoucher;
import com.nlufood.model.User;
import com.nlufood.repository.PromoCodeRepository;
import com.nlufood.repository.SavedVoucherRepository;
import com.nlufood.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/vouchers")
@CrossOrigin(origins = "*")
public class SavedVoucherController {

    @Autowired
    private SavedVoucherRepository savedVoucherRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PromoCodeRepository promoCodeRepository;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SavedVoucher>> getUserVouchers(@PathVariable Long userId) {
        return ResponseEntity.ok(savedVoucherRepository.findByUserId(userId));
    }

    @PostMapping("/save")
    public ResponseEntity<?> saveVoucher(@RequestParam Long userId, @RequestParam String code) {
        Map<String, Object> response = new HashMap<>();
        Optional<User> userOpt = userRepository.findById(userId);
        Optional<PromoCode> promoOpt = promoCodeRepository.findByCodeIgnoreCase(code.trim());

        if (userOpt.isEmpty() || promoOpt.isEmpty()) {
            response.put("success", false);
            response.put("message", "Mã giảm giá hoặc người dùng không tồn tại.");
            return ResponseEntity.badRequest().body(response);
        }

        User user = userOpt.get();
        PromoCode promo = promoOpt.get();

        Optional<SavedVoucher> existing = savedVoucherRepository.findByUserIdAndPromoCodeId(userId, promo.getId());
        if (existing.isPresent()) {
            response.put("success", false);
            response.put("message", "Bạn đã lưu mã giảm giá này vào Ví Voucher rồi!");
            return ResponseEntity.badRequest().body(response);
        }

        SavedVoucher savedVoucher = new SavedVoucher(user, promo);
        savedVoucherRepository.save(savedVoucher);

        response.put("success", true);
        response.put("message", "Lưu mã giảm giá vào Ví Voucher thành công! 🎉");
        response.put("voucher", savedVoucher);
        return ResponseEntity.ok(response);
    }
}
