package com.hostelcomplaintresolver.backend.dto;

public class RaiseComplaintRequest {
    private String category;
    private String description;
    private String roomNumber;

    // --- GETTERS AND SETTERS ---
    
    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }
}
