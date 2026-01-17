package com.hostelcomplaintresolver.backend.dto;

public class LoginResponse {

    private String token;
    private String userId;
    private String name;
    private String role;

    // No-argument constructor
    public LoginResponse() {
    }

    // ✅ The constructor your UserController is looking for
    public LoginResponse(String token, String userId, String name, String role) {
        this.token = token;
        this.userId = userId;
        this.name = name;
        this.role = role;
    }

    // --- GETTERS ---
    public String getToken() { return token; }
    public String getUserId() { return userId; }
    public String getName() { return name; }
    public String getRole() { return role; }

    // --- SETTERS ---
    public void setToken(String token) { this.token = token; }
    public void setUserId(String userId) { this.userId = userId; }
    public void setName(String name) { this.name = name; }
    public void setRole(String role) { this.role = role; }
}