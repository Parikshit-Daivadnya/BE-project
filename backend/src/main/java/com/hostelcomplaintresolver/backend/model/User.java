package com.hostelcomplaintresolver.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "users")
public class User {

    @Id
    @Column(name = "user_id", nullable = false, unique = true)
    private String userId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(name = "mobile")
    private String mobile;

    @Column(name = "permanent_address", length = 500)
    private String permanentAddress;

    // --- Student Fields ---
    @Column(name = "hostel_name")
    private String hostelName;      // ✅ New

    @Column(name = "room_number")
    private String roomNumber;

    @Column(name = "course")
    private String course;          // ✅ New

    @Column(name = "student_year")
    private String studentYear;     // ✅ New

    @Column(name = "department")
    private String department;      // ✅ New

    @Column(name = "parent_mobile")
    private String parentMobile;    // ✅ New

    // --- Staff Fields ---
    @Column(name = "staff_category")
    private String staffCategory;

    // --- System Fields ---
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @JsonIgnore
    @Column(name = "password_reset_token")
    private String passwordResetToken;

    @JsonIgnore
    @Column(name = "password_reset_token_expiry")
    private LocalDateTime passwordResetTokenExpiry;

    // ---------------- GETTERS AND SETTERS ----------------

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public String getPermanentAddress() { return permanentAddress; }
    public void setPermanentAddress(String permanentAddress) { this.permanentAddress = permanentAddress; }

    public String getHostelName() { return hostelName; }
    public void setHostelName(String hostelName) { this.hostelName = hostelName; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public String getCourse() { return course; }
    public void setCourse(String course) { this.course = course; }

    public String getStudentYear() { return studentYear; }
    public void setStudentYear(String studentYear) { this.studentYear = studentYear; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getParentMobile() { return parentMobile; }
    public void setParentMobile(String parentMobile) { this.parentMobile = parentMobile; }

    public String getStaffCategory() { return staffCategory; }
    public void setStaffCategory(String staffCategory) { this.staffCategory = staffCategory; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getPasswordResetToken() { return passwordResetToken; }
    public void setPasswordResetToken(String token) { this.passwordResetToken = token; }

    public LocalDateTime getPasswordResetTokenExpiry() { return passwordResetTokenExpiry; }
    public void setPasswordResetTokenExpiry(LocalDateTime expiry) { this.passwordResetTokenExpiry = expiry; }
}