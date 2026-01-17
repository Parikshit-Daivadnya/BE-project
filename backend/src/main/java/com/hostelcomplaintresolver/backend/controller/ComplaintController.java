package com.hostelcomplaintresolver.backend.controller;

import com.hostelcomplaintresolver.backend.dto.AssignRequest;
import com.hostelcomplaintresolver.backend.dto.CreateComplaintRequest;
import com.hostelcomplaintresolver.backend.model.Complaint;
import com.hostelcomplaintresolver.backend.repository.ComplaintRepository; // ✅ Added Import
import com.hostelcomplaintresolver.backend.service.ComplaintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    // ✅ FIXED: Injected Repository to allow direct queries in getStaffPerformance
    @Autowired
    private ComplaintRepository complaintRepository;

    // ✅ STUDENT: Create a new complaint
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> createNewComplaint(
            @Valid @RequestBody CreateComplaintRequest createComplaintRequest,
            Principal principal) {

        String studentId = principal.getName();
        try {
            Complaint saved = complaintService.createComplaint(createComplaintRequest, studentId);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error creating complaint: " + e.getMessage());
        }
    }

    // =========================================================================
    // ✅ MODIFIED: Reopen/Escalate complaint with MANDATORY PROOF (Multipart)
    // =========================================================================
    @PutMapping(value = "/{id}/reopen", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> reopenComplaint(
            @PathVariable Long id,
            @RequestParam("reason") String reason,
            @RequestParam("proof") MultipartFile proof) {

        if (proof.isEmpty()) {
            return ResponseEntity.badRequest().body("Error: Proof image is mandatory for escalation.");
        }

        try {
            Complaint c = complaintService.reopenComplaintWithProof(id, reason, proof);
            return ResponseEntity.ok(c);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ✅ WARDEN: Revert status (Rollback)
    @PutMapping("/{id}/revert")
    @PreAuthorize("hasRole('WARDEN')")
    public ResponseEntity<?> revertComplaint(@PathVariable Long id) {
        try {
            Complaint c = complaintService.revertComplaint(id);
            return ResponseEntity.ok(c);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
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

    // ✅ STAFF: Fetch assigned complaints
    @GetMapping("/my-assigned")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<?> getAssignedComplaints(Principal principal) {
        String staffId = principal.getName();
        return ResponseEntity.ok(complaintService.getAssignedComplaints(staffId));
    }

    // ✅ WARDEN/ADMIN: Fetch all complaints
    @GetMapping
    @PreAuthorize("hasAnyRole('WARDEN','ADMIN')")
    public ResponseEntity<List<Complaint>> getAllComplaints() {
        return ResponseEntity.ok(complaintService.getAllComplaints());
    }

    // ✅ WARDEN/ADMIN: Assign complaint
    @PutMapping("/{complaintId}/assign")
    @PreAuthorize("hasAnyRole('WARDEN','ADMIN')")
    public ResponseEntity<?> assignComplaint(@PathVariable Long complaintId,
                                             @RequestBody AssignRequest assignRequest) {
        try {
            Complaint updated = complaintService.assignComplaint(complaintId, assignRequest.getStaffId());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // ✅ STAFF: Resolve complaint
    @PutMapping("/{complaintId}/resolve")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<?> resolveComplaint(@PathVariable Long complaintId, Principal principal) {
        try {
            Complaint updated = complaintService.resolveComplaint(complaintId, principal.getName());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // ✅ GET STAFF PERFORMANCE
    @GetMapping("/stats/staff/{staffId}")
    public ResponseEntity<?> getStaffPerformance(@PathVariable String staffId) {
        try {
            Double avg = complaintRepository.getAverageRating(staffId);
            Long count = complaintRepository.getRatedComplaintCount(staffId);

            Map<String, Object> response = new HashMap<>();
            response.put("averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
            response.put("totalRated", count != null ? count : 0);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error calculating stats");
        }
    }

    // =========================================================================
    // ✅ STUDENT: Submit Feedback with MANDATORY PHOTO PROOF (Multipart)
    // =========================================================================
    @PostMapping(value = "/{complaintId}/feedback", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submitFeedback(
            @PathVariable Long complaintId,
            @RequestParam("rating") int rating,
            @RequestParam("feedback") String feedback,
            @RequestParam("proof") MultipartFile proof,
            Principal principal) {

        if (proof.isEmpty()) {
            return ResponseEntity.badRequest().body("Error: Photo proof is mandatory to close the complaint.");
        }

        try {
            Complaint closedComplaint = complaintService.submitFeedbackWithProof(
                    complaintId,
                    rating,
                    feedback,
                    proof,
                    principal.getName()
            );
            return ResponseEntity.ok(closedComplaint);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error submitting feedback: " + e.getMessage());
        }
    }
}