package com.nlufood.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    
    @Column(unique = true)
    private String email;
    
    private String password;
    
    // STUDENT, OWNER, ADMIN
    private String role;
    
    @Column(columnDefinition = "LONGTEXT")
    private String imageUrl;
    private String address;
    private String phoneNumber;
    private Integer birthYear;
    private String gender; // Nam, Nữ, Khác
    private String membershipTier; // NORMAL, SILVER, GOLD, DIAMOND

    public User() {
        this.membershipTier = "NORMAL";
    }

    public User(Long id, String name, String email, String password, String role, String imageUrl, String address, String phoneNumber, Integer birthYear, String gender, String membershipTier) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.imageUrl = imageUrl;
        this.address = address;
        this.phoneNumber = phoneNumber;
        this.birthYear = birthYear;
        this.gender = gender;
        this.membershipTier = membershipTier != null ? membershipTier : "NORMAL";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public Integer getBirthYear() { return birthYear; }
    public void setBirthYear(Integer birthYear) { this.birthYear = birthYear; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getMembershipTier() { return membershipTier; }
    public void setMembershipTier(String membershipTier) { this.membershipTier = membershipTier; }
}
