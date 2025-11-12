package com.hostelcomplaintresolver.backend.dto;

public class FeedbackRequest {
    private int rating;
    private String feedback;

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
}
