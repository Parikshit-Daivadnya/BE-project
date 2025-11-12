package com.hostelcomplaintresolver.backend.blockchain;

import java.time.LocalDateTime;

public class Transaction {
    private String transactionId;
    private String complaintId;
    private String userId;
    private String action;
    private String description;
    private LocalDateTime timestamp;

    public Transaction() {}

    public Transaction(String transactionId, String complaintId, String userId,
                       String action, String description, LocalDateTime timestamp) {
        this.transactionId = transactionId;
        this.complaintId = complaintId;
        this.userId = userId;
        this.action = action;
        this.description = description;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getComplaintId() { return complaintId; }
    public void setComplaintId(String complaintId) { this.complaintId = complaintId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
