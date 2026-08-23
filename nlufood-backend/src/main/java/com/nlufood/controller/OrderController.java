package com.nlufood.controller;

import com.nlufood.model.Order;
import com.nlufood.model.Notification;
import com.nlufood.repository.OrderRepository;
import com.nlufood.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping("/student/{studentId}")
    public List<Order> getOrdersByStudent(@PathVariable Long studentId) {
        return orderRepository.findByStudentId(studentId);
    }
    
    @GetMapping("/restaurant/{restaurantId}")
    public List<Order> getOrdersByRestaurant(@PathVariable Long restaurantId) {
        return orderRepository.findByRestaurantId(restaurantId);
    }
    
    @PostMapping
    public Order placeOrder(@RequestBody Order order) {
        order.setOrderTime(LocalDateTime.now());
        order.setStatus("PENDING");
        
        if (order.getPaymentMethod() == null) {
            order.setPaymentMethod("Tiền mặt");
        }
        
        // Ensure bidirectional relationship is set for order items
        if(order.getOrderItems() != null) {
            order.getOrderItems().forEach(item -> item.setOrder(order));
        }
        
        Order savedOrder = orderRepository.save(order);
        
        try {
            String restaurantName = savedOrder.getRestaurant() != null ? savedOrder.getRestaurant().getName() : "Quán ăn";
            notificationRepository.save(new Notification(
                savedOrder.getStudent().getId(),
                "Đặt đơn thành công! 🛒",
                "Đơn hàng từ " + restaurantName + " đang chờ quán xác nhận."
            ));
        } catch (Exception e) {
            System.err.println("Error saving notification: " + e.getMessage());
        }
        
        return savedOrder;
    }
    
    @PutMapping("/{id}/status")
    public Order updateOrderStatus(
            @PathVariable Long id, 
            @RequestParam String status, 
            @RequestParam(required = false) String cancelReason) {
        return orderRepository.findById(id).map(order -> {
            order.setStatus(status);
            if ("DELIVERING".equals(status) && order.getDriverName() == null) {
                order.setDriverName("Nguyễn Văn Hùng (Shipper NLU)");
                order.setDriverPhone("0988 123 456");
                order.setDriverLicensePlate("59-X1 678.90");
            }
            if ("CANCELLED".equals(status) && cancelReason != null) {
                order.setCancelReason(cancelReason);
            }
            Order updatedOrder = orderRepository.save(order);
            
            try {
                String restaurantName = updatedOrder.getRestaurant() != null ? updatedOrder.getRestaurant().getName() : "Quán ăn";
                String title = "";
                String msg = "";
                
                if ("PREPARING".equals(status)) {
                    title = "Đơn hàng đang chuẩn bị! 👨‍🍳";
                    msg = restaurantName + " đang bắt đầu chế biến món ăn ngon cho bạn.";
                } else if ("DELIVERING".equals(status)) {
                    title = "Đơn hàng đang được giao! 🛵";
                    msg = "Tài xế " + updatedOrder.getDriverName() + " (" + updatedOrder.getDriverPhone() + ") đang nhanh chóng giao đơn hàng đến bạn.";
                } else if ("COMPLETED".equals(status)) {
                    title = "Đơn hàng hoàn thành! 🎉";
                    msg = "Đơn hàng từ " + restaurantName + " đã được giao thành công. Hãy đánh giá món ăn nhé!";
                } else if ("CANCELLED".equals(status)) {
                    title = "Đơn hàng đã bị hủy 😞";
                    msg = "Rất tiếc, đơn hàng từ " + restaurantName + " đã bị hủy." + 
                          (cancelReason != null ? " Lý do: " + cancelReason : "");
                }
                
                if (!title.isEmpty()) {
                    notificationRepository.save(new Notification(
                        updatedOrder.getStudent().getId(),
                        title,
                        msg
                    ));
                }
            } catch (Exception e) {
                System.err.println("Error saving notification: " + e.getMessage());
            }
            
            return updatedOrder;
        }).orElse(null);
    }
}
