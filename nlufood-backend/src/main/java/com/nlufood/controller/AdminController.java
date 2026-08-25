package com.nlufood.controller;

import com.nlufood.model.*;
import com.nlufood.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private VipPackageRepository vipPackageRepository;

    @Autowired
    private UserViolationRepository userViolationRepository;

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getOverview() {
        Map<String, Object> stats = new HashMap<>();
        long totalUsers = userRepository.count();
        long totalStudents = userRepository.findAll().stream().filter(u -> "STUDENT".equalsIgnoreCase(u.getRole())).count();
        long totalOwners = userRepository.findAll().stream().filter(u -> "OWNER".equalsIgnoreCase(u.getRole())).count();
        long totalRestaurants = restaurantRepository.count();
        long pendingRestaurants = restaurantRepository.findAll().stream().filter(r -> "PENDING".equalsIgnoreCase(r.getStatus())).count();
        long totalOrders = orderRepository.count();
        
        double totalRevenue = orderRepository.findAll().stream()
                .filter(o -> "COMPLETED".equalsIgnoreCase(o.getStatus()))
                .mapToDouble(Order::getTotalPrice)
                .sum();
        
        long vipMembers = userRepository.findAll().stream()
                .filter(u -> u.getMembershipTier() != null && !"NORMAL".equalsIgnoreCase(u.getMembershipTier()))
                .count();

        stats.put("totalUsers", totalUsers);
        stats.put("totalStudents", totalStudents);
        stats.put("totalOwners", totalOwners);
        stats.put("totalRestaurants", totalRestaurants);
        stats.put("pendingRestaurants", pendingRestaurants);
        stats.put("totalOrders", totalOrders);
        stats.put("totalRevenue", totalRevenue);
        stats.put("vipMembers", vipMembers);
        stats.put("totalViolations", userViolationRepository.count());

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping("/users/{id}/status")
    public ResponseEntity<User> toggleUserStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return userRepository.findById(id).map(user -> {
            String newStatus = body.getOrDefault("status", "ACTIVE");
            user.setStatus(newStatus);
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/membership")
    public ResponseEntity<User> updateUserMembership(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return userRepository.findById(id).map(user -> {
            String newTier = body.getOrDefault("tier", "NORMAL");
            user.setMembershipTier(newTier);
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/restaurants")
    public ResponseEntity<List<Restaurant>> getAllRestaurants() {
        return ResponseEntity.ok(restaurantRepository.findAll());
    }

    @PostMapping("/restaurants/{id}/approve")
    public ResponseEntity<Restaurant> approveRestaurant(@PathVariable Long id) {
        return restaurantRepository.findById(id).map(r -> {
            r.setStatus("APPROVED");
            return ResponseEntity.ok(restaurantRepository.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/restaurants/{id}/reject")
    public ResponseEntity<Restaurant> rejectRestaurant(@PathVariable Long id) {
        return restaurantRepository.findById(id).map(r -> {
            r.setStatus("REJECTED");
            return ResponseEntity.ok(restaurantRepository.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/restaurants/{id}/status")
    public ResponseEntity<Restaurant> updateRestaurantStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return restaurantRepository.findById(id).map(r -> {
            String newStatus = body.getOrDefault("status", "APPROVED");
            r.setStatus(newStatus);
            return ResponseEntity.ok(restaurantRepository.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/vip-packages")
    public ResponseEntity<List<VipPackage>> getVipPackages() {
        return ResponseEntity.ok(vipPackageRepository.findAll());
    }

    @PostMapping("/vip-packages")
    public ResponseEntity<VipPackage> saveVipPackage(@RequestBody VipPackage pkg) {
        return ResponseEntity.ok(vipPackageRepository.save(pkg));
    }

    @PutMapping("/vip-packages/{id}")
    public ResponseEntity<VipPackage> updateVipPackage(@PathVariable Long id, @RequestBody VipPackage updated) {
        return vipPackageRepository.findById(id).map(pkg -> {
            pkg.setName(updated.getName());
            pkg.setPrice(updated.getPrice());
            pkg.setDurationDays(updated.getDurationDays());
            pkg.setDiscountPercent(updated.getDiscountPercent());
            pkg.setFreeshipCount(updated.getFreeshipCount());
            pkg.setDescription(updated.getDescription());
            return ResponseEntity.ok(vipPackageRepository.save(pkg));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/vip-packages/{id}")
    public ResponseEntity<Void> deleteVipPackage(@PathVariable Long id) {
        if (vipPackageRepository.existsById(id)) {
            vipPackageRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/violations")
    public ResponseEntity<List<UserViolation>> getViolations() {
        return ResponseEntity.ok(userViolationRepository.findAll());
    }

    @PostMapping("/violations/{id}/resolve")
    public ResponseEntity<UserViolation> resolveViolation(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return userViolationRepository.findById(id).map(v -> {
            String status = body.getOrDefault("status", "RESOLVED");
            v.setStatus(status);
            if ("BANNED".equalsIgnoreCase(status) && v.getUser() != null) {
                User user = v.getUser();
                user.setStatus("BANNED");
                userRepository.save(user);
            }
            return ResponseEntity.ok(userViolationRepository.save(v));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/violations/{id}")
    public ResponseEntity<Void> deleteViolation(@PathVariable Long id) {
        if (userViolationRepository.existsById(id)) {
            userViolationRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
