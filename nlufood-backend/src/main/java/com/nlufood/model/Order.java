package com.nlufood.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "student_id")
    private User student;
    
    @ManyToOne
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;
    
    // PENDING, PREPARING, DELIVERING, COMPLETED, CANCELLED
    private String status;
    
    private Double totalPrice;
    
    private LocalDateTime orderTime;
    
    private String cancelReason;
    private String paymentMethod;
    
    // Driver assignment fields for real-time tracking
    private String driverName;
    private String driverPhone;
    private String driverLicensePlate;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderItem> orderItems;

    public Order() {}

    public Order(Long id, User student, Restaurant restaurant, String status, Double totalPrice, LocalDateTime orderTime, List<OrderItem> orderItems, String cancelReason, String paymentMethod) {
        this.id = id;
        this.student = student;
        this.restaurant = restaurant;
        this.status = status;
        this.totalPrice = totalPrice;
        this.orderTime = orderTime;
        this.orderItems = orderItems;
        this.cancelReason = cancelReason;
        this.paymentMethod = paymentMethod;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }
    public Restaurant getRestaurant() { return restaurant; }
    public void setRestaurant(Restaurant restaurant) { this.restaurant = restaurant; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(Double totalPrice) { this.totalPrice = totalPrice; }
    public LocalDateTime getOrderTime() { return orderTime; }
    public void setOrderTime(LocalDateTime orderTime) { this.orderTime = orderTime; }
    public String getCancelReason() { return cancelReason; }
    public void setCancelReason(String cancelReason) { this.cancelReason = cancelReason; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }
    public String getDriverPhone() { return driverPhone; }
    public void setDriverPhone(String driverPhone) { this.driverPhone = driverPhone; }
    public String getDriverLicensePlate() { return driverLicensePlate; }
    public void setDriverLicensePlate(String driverLicensePlate) { this.driverLicensePlate = driverLicensePlate; }
    public List<OrderItem> getOrderItems() { return orderItems; }
    public void setOrderItems(List<OrderItem> orderItems) { this.orderItems = orderItems; }
}
