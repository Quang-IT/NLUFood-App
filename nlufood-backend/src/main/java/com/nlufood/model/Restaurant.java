package com.nlufood.model;

import jakarta.persistence.*;

@Entity
@Table(name = "restaurants")
public class Restaurant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String address;
    private Double rating;

    @Column(length = 1000)
    private String imageUrl;
    
    private String status; // APPROVED, PENDING, REJECTED
    
    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;

    public Restaurant() {
        this.status = "APPROVED";
    }

    public Restaurant(Long id, String name, String address, Double rating, String imageUrl, User owner) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.rating = rating;
        this.imageUrl = imageUrl;
        this.owner = owner;
        this.status = "APPROVED";
    }

    public Restaurant(Long id, String name, String address, Double rating, String imageUrl, String status, User owner) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.rating = rating;
        this.imageUrl = imageUrl;
        this.status = status != null ? status : "APPROVED";
        this.owner = owner;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
}
