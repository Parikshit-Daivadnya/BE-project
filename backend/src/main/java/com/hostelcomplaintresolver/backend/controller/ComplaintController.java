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

    // ✅ STUDENT: Create a new complaint
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> createNewComplaint(
            @Valid @RequestBody CreateComplaintRequest createComplaintRequest,
            Principal principal) {

        String studentId = principal.getName(); // Contains "IRN..."
        try {
            Complaint saved = complaintService.createComplaint(createComplaintRequest, studentId);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error creating complaint: " + e.getMessage());
        }
    }

    // ✅ STUDENT: Fetch their own complaints
    @GetMapping("/my-complaints")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<Complaint>> getMyComplaints(Principal principal) {
        String studentId = principal.getName();
        List<Complaint> complaints = complaintService.getComplaintsByStudent(studentId);
        return ResponseEntity.ok(complaints);
    }

    // ✅ STAFF: Fetch complaints assigned to them
    // (I removed the duplicate method and the raw repository call from here)
    @GetMapping("/my-assigned")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<?> getAssignedComplaints(Principal principal) {
        String staffId = principal.getName(); // This is "STF001"
        // Ensure your ComplaintService has 'getAssignedComplaints' or 'getComplaintsByStaff'
        return ResponseEntity.ok(complaintService.getAssignedComplaints(staffId));
    }

    // ✅ WARDEN/ADMIN: Fetch all complaints
    @GetMapping
    @PreAuthorize("hasAnyRole('WARDEN','ADMIN')")
    public ResponseEntity<List<Complaint>> getAllComplaints() {
        List<Complaint> complaints = complaintService.getAllComplaints();
        return ResponseEntity.ok(complaints);
    }

    // ✅ WARDEN/ADMIN: Assign a complaint to staff
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

    // ✅ STAFF: Resolve a complaint
    @PutMapping("/{complaintId}/resolve")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<?> resolveComplaint(@PathVariable Long complaintId, Principal principal) {
        String staffId = principal.getName(); // Use ID now
        try {
            Complaint updatedComplaint = complaintService.resolveComplaint(complaintId, staffId);
            return ResponseEntity.ok(updatedComplaint);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error resolving complaint: " + e.getMessage());
        }
    }

    // ✅ STUDENT: Submit feedback
    @PostMapping("/{complaintId}/feedback")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submitFeedback(@PathVariable Long complaintId,
                                            @Valid @RequestBody FeedbackRequest feedbackRequest,
                                            Principal principal) {
        String studentId = principal.getName(); // Use ID now
        try {
            Complaint closedComplaint = complaintService.submitFeedback(complaintId, feedbackRequest, studentId);
            return ResponseEntity.ok(closedComplaint);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error submitting feedback: " + e.getMessage());
        }
    }
}