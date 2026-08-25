package com.nlufood.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_violations")
public class UserViolation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String reason;
    private String reportedBy;
    private String status; // PENDING, RESOLVED, BANNED
    private LocalDateTime reportTime;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    public UserViolation() {
        this.reportTime = LocalDateTime.now();
        this.status = "PENDING";
    }

    public UserViolation(Long id, User user, String reason, String reportedBy, String status) {
        this.id = id;
        this.user = user;
        this.reason = reason;
        this.reportedBy = reportedBy;
        this.status = status != null ? status : "PENDING";
        this.reportTime = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getReportedBy() { return reportedBy; }
    public void setReportedBy(String reportedBy) { this.reportedBy = reportedBy; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getReportTime() { return reportTime; }
    public void setReportTime(LocalDateTime reportTime) { this.reportTime = reportTime; }
}
