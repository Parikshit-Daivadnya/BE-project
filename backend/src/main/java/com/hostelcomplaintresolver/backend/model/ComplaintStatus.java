package com.hostelcomplaintresolver.backend.model;

public enum ComplaintStatus {
    RAISED,             // New complaint
    ASSIGNED,           // Staff assigned
    IN_PROGRESS,        // Work started
    PENDING_APPROVAL,   // Staff marked done, waiting for Warden
    RESOLVED,           // Warden approved
    CLOSED,             // Student gave feedback
    ESCALATED           // Took too long
}