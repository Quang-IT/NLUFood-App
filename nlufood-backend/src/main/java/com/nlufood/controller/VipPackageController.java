package com.nlufood.controller;

import com.nlufood.model.User;
import com.nlufood.model.VipPackage;
import com.nlufood.repository.UserRepository;
import com.nlufood.repository.VipPackageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vip-packages")
@CrossOrigin(origins = "*")
public class VipPackageController {

    @Autowired
    private VipPackageRepository vipPackageRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<VipPackage>> getAllVipPackages() {
        return ResponseEntity.ok(vipPackageRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getVipPackageById(@PathVariable Long id) {
        return vipPackageRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/subscribe/{userId}")
    public ResponseEntity<?> subscribeVipPackage(@PathVariable Long id, @PathVariable Long userId) {
        VipPackage pkg = vipPackageRepository.findById(id).orElse(null);
        if (pkg == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Gói VIP không tồn tại!"));
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Người dùng không tồn tại!"));
        }

        // Determine tier based on package name/price
        String tier = "GOLD";
        if (pkg.getName().toLowerCase().contains("đồng") || pkg.getName().toLowerCase().contains("silver") || pkg.getName().toLowerCase().contains("bạc")) {
            tier = "SILVER";
        } else if (pkg.getName().toLowerCase().contains("kim cương") || pkg.getName().toLowerCase().contains("diamond")) {
            tier = "DIAMOND";
        } else if (pkg.getName().toLowerCase().contains("vàng") || pkg.getName().toLowerCase().contains("gold")) {
            tier = "GOLD";
        }

        user.setMembershipTier(tier);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đăng ký thành công " + pkg.getName() + "!",
                "membershipTier", tier,
                "package", pkg
        ));
    }
}
