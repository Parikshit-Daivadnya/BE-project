package com.hostelcomplaintresolver.backend.controller;

import com.hostelcomplaintresolver.backend.dto.AssignRequest;
import com.hostelcomplaintresolver.backend.dto.CreateComplaintRequest;
import com.hostelcomplaintresolver.backend.dto.FeedbackRequest;
import com.hostelcomplaintresolver.backend.model.Complaint;
import com.hostelcomplaintresolver.backend.service.ComplaintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    // Create a new complaint. Principal.getName() is the authenticated email.
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> createNewComplaint(
            @Valid @RequestBody CreateComplaintRequest createComplaintRequest,
            Principal principal) {

        String studentEmail = principal.getName();
        try {
            Complaint saved = complaintService.createComplaint(createComplaintRequest, studentEmail);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error creating complaint: " + e.getMessage());
        }
    }

    // Students fetch their own complaints
    @GetMapping("/my-complaints")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<Complaint>> getMyComplaints(Principal principal) {
        String studentEmail = principal.getName();
        List<Complaint> complaints = complaintService.getComplaintsByStudent(studentEmail);
        return ResponseEntity.ok(complaints);
    }

    // Warden/Admin fetch all complaints
    @GetMapping
    @PreAuthorize("hasAnyRole('WARDEN','ADMIN')")
    public ResponseEntity<List<Complaint>> getAllComplaints() {
        List<Complaint> complaints = complaintService.getAllComplaints();
        return ResponseEntity.ok(complaints);
    }

    // Assign a complaint to staff (staffId is user_id string)
    @PutMapping("/{complaintId}/assign")
    @PreAuthorize("hasAnyRole('WARDEN','ADMIN')")
    public ResponseEntity<?> assignComplaint(@PathVariable Long complaintId,
                                             @RequestBody AssignRequest assignRequest) {
        try {
            Complaint updatedComplaint = complaintService.assignComplaint(complaintId, assignRequest.getStaffId());
            return ResponseEntity.ok(updatedComplaint);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error assigning complaint: " + e.getMessage());
        }
    }

    // Staff fetch complaints assigned to them (principal is staff's email)
    @GetMapping("/my-assigned")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<List<Complaint>> getMyAssignedComplaints(Principal principal) {
        String staffEmail = principal.getName();
        List<Complaint> complaints = complaintService.getComplaintsByStaff(staffEmail);
        return ResponseEntity.ok(complaints);
    }

    // Staff resolves a complaint
    @PutMapping("/{complaintId}/resolve")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<?> resolveComplaint(@PathVariable Long complaintId, Principal principal) {
        String staffEmail = principal.getName();
        try {
            Complaint updatedComplaint = complaintService.resolveComplaint(complaintId, staffEmail);
            return ResponseEntity.ok(updatedComplaint);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error resolving complaint: " + e.getMessage());
        }
    }

    // Student submits feedback for a complaint
    @PostMapping("/{complaintId}/feedback")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submitFeedback(@PathVariable Long complaintId,
                                            @Valid @RequestBody FeedbackRequest feedbackRequest,
                                            Principal principal) {
        String studentEmail = principal.getName();
        try {
            Complaint closedComplaint = complaintService.submitFeedback(complaintId, feedbackRequest, studentEmail);
            return ResponseEntity.ok(closedComplaint);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error submitting feedback: " + e.getMessage());
        }
    }
}
