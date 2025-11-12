package com.hostelcomplaintresolver.backend.dto;

public class CreateComplaintRequest {

    //private Long studentId;
    private String category;
    private String description;

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


}
