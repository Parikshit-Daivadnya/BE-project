package com.hostelcomplaintresolver.backend.model;

import java.time.LocalDateTime;
import jakarta.persistence.*;

@Entity
@Table(name = "complaints")
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Auto-generated complaint ID

    // ---------------- RELATIONSHIPS ----------------

    // Student who raised the complaint
    @ManyToOne
    @JoinColumn(name = "student_id", referencedColumnName = "user_id", nullable = false)
    private User student;

    // Staff member who handles the complaint
    @ManyToOne
    @JoinColumn(name = "staff_id", referencedColumnName = "user_id")
    private User staff;

    // Warden or Admin who assigned it
    @ManyToOne
    @JoinColumn(name = "assigned_to_id", referencedColumnName = "user_id")
    private User assignedTo;

    // ---------------- COMPLAINT DETAILS ----------------

    @Column(name = "room_number", nullable = false)
    private String roomNumber;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(nullable = false)
    private String category; // Example: Plumbing, Electricity, Cleaning

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComplaintStatus status;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "priority", nullable = false)
    private Priority priority;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now(); // Automatically set when created

    @Column(nullable = true)
    private Integer rating; // Student feedback rating

    @Column(nullable = true, length = 500)
    private String feedback; // Feedback text from student

    // ---------------- GETTERS & SETTERS ----------------

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public User getStaff() {
        return staff;
    }

    public void setStaff(User staff) {
        this.staff = staff;
    }

    public User getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(User assignedTo) {
        this.assignedTo = assignedTo;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public ComplaintStatus getStatus() {
        return status;
    }

    public void setStatus(ComplaintStatus status) {
        this.status = status;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
}
