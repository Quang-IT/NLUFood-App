package com.nlufood.model;

import jakarta.persistence.*;

@Entity
@Table(name = "addresses")
public class Address {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title; // KTX A, KTX B, Giảng đường K, Viện Sinh học
    private String fullAddress;
    private String recipientName;
    private String recipientPhone;
    private Boolean isDefault;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    public Address() {
        this.isDefault = false;
    }

    public Address(Long id, String title, String fullAddress, String recipientName, String recipientPhone, Boolean isDefault, User user) {
        this.id = id;
        this.title = title;
        this.fullAddress = fullAddress;
        this.recipientName = recipientName;
        this.recipientPhone = recipientPhone;
        this.isDefault = isDefault != null ? isDefault : false;
        this.user = user;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getFullAddress() { return fullAddress; }
    public void setFullAddress(String fullAddress) { this.fullAddress = fullAddress; }
    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }
    public String getRecipientPhone() { return recipientPhone; }
    public void setRecipientPhone(String recipientPhone) { this.recipientPhone = recipientPhone; }
    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
