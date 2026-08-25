package com.nlufood.model;

import jakarta.persistence.*;

@Entity
@Table(name = "vip_packages")
public class VipPackage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private Double price;
    private Integer durationDays;
    private Integer discountPercent;
    private Integer freeshipCount;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private Boolean active;

    public VipPackage() {
        this.active = true;
    }

    public VipPackage(Long id, String name, Double price, Integer durationDays, Integer discountPercent, Integer freeshipCount, String description, Boolean active) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.durationDays = durationDays;
        this.discountPercent = discountPercent;
        this.freeshipCount = freeshipCount;
        this.description = description;
        this.active = active != null ? active : true;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    public Integer getDurationDays() { return durationDays; }
    public void setDurationDays(Integer durationDays) { this.durationDays = durationDays; }
    public Integer getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(Integer discountPercent) { this.discountPercent = discountPercent; }
    public Integer getFreeshipCount() { return freeshipCount; }
    public void setFreeshipCount(Integer freeshipCount) { this.freeshipCount = freeshipCount; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
