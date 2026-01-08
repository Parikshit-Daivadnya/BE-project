package com.hostelcomplaintresolver.backend.dto;

// Getters and setters omitted for brevity
public class LoginRequest {

    private String password;
    private String userId; // Changed from email


    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }


    public String getPassword() {
        return password;
    }



    public void setPassword(String password) {
        this.password = password;
    }
}