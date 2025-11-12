package com.hostelcomplaintresolver.backend.dto;

import com.hostelcomplaintresolver.backend.model.Role;

public class CreateUserRequest {

    private String name;
    private String email;
    private String password;
    private Role role;

    // ✅ New fields for updated registration logic
    private String roomNumber; // For students only
    private String irn;        // Student's IRN (acts as primary key)

    // ----- Getters and Setters -----

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public String getIrn() {
        return irn;
    }

    public void setIrn(String irn) {
        this.irn = irn;
    }
}
