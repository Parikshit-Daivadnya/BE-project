package com.hostelcomplaintresolver.backend.dto;

// Getters and setters omitted for brevity
public class LoginRequest {
    private String email;
    private String password;

    // --- GETTERS ---
    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    // --- SETTERS ---
    public void setEmail(String email) {
        this.email = email;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}