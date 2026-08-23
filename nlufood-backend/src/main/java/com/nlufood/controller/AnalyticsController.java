package com.nlufood.controller;

import com.nlufood.model.Order;
import com.nlufood.model.OrderItem;
import com.nlufood.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    @Autowired
    private OrderRepository orderRepository;

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<?> getRestaurantAnalytics(@PathVariable Long restaurantId) {
        List<Order> orders = orderRepository.findByRestaurantId(restaurantId);

        double totalRevenue = 0;
        int completedCount = 0;
        int pendingCount = 0;
        int cancelledCount = 0;
        Map<String, Integer> itemSalesCount = new HashMap<>();

        for (Order o : orders) {
            if ("COMPLETED".equals(o.getStatus())) {
                totalRevenue += (o.getTotalPrice() != null ? o.getTotalPrice() : 0);
                completedCount++;
            } else if ("PENDING".equals(o.getStatus()) || "PREPARING".equals(o.getStatus()) || "DELIVERING".equals(o.getStatus())) {
                pendingCount++;
            } else if ("CANCELLED".equals(o.getStatus())) {
                cancelledCount++;
            }

            if (o.getOrderItems() != null) {
                for (OrderItem item : o.getOrderItems()) {
                    if (item.getMenuItem() != null) {
                        String name = item.getMenuItem().getName();
                        int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                        itemSalesCount.put(name, itemSalesCount.getOrDefault(name, 0) + qty);
                    }
                }
            }
        }

        // Top 5 items
        List<Map<String, Object>> topItems = itemSalesCount.entrySet().stream()
                .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
                .limit(5)
                .map(e -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("name", e.getKey());
                    m.put("sold", e.getValue());
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRevenue", totalRevenue);
        stats.put("totalOrders", orders.size());
        stats.put("completedCount", completedCount);
        stats.put("pendingCount", pendingCount);
        stats.put("cancelledCount", cancelledCount);
        stats.put("topItems", topItems);

        return ResponseEntity.ok(stats);
    }
}
