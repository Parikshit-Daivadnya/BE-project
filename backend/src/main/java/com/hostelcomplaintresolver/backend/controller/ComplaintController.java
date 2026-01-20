package com.hostelcomplaintresolver.backend.controller;

import com.hostelcomplaintresolver.backend.dto.AssignRequest;
import com.hostelcomplaintresolver.backend.dto.CreateComplaintRequest;
import com.hostelcomplaintresolver.backend.model.Complaint;
import com.hostelcomplaintresolver.backend.repository.ComplaintRepository;
import com.hostelcomplaintresolver.backend.service.ComplaintService;
import com.hostelcomplaintresolver.backend.blockchain.BlockchainService;
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

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private BlockchainService blockchainService;

    // 1. CREATE COMPLAINT
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> createNewComplaint(
            @Valid @RequestBody CreateComplaintRequest createComplaintRequest,
            Principal principal) {
        try {
            // studentId is extracted from Principal
            Complaint saved = complaintService.createComplaint(createComplaintRequest, principal.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        }
    }

    // 2. ASSIGN COMPLAINT
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

    // 3. RESOLVE COMPLAINT
    @PutMapping("/{complaintId}/resolve")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<?> resolveComplaint(@PathVariable Long complaintId, Principal principal) {
        try {
            // staffId is extracted from Principal
            Complaint updated = complaintService.resolveComplaint(complaintId, principal.getName());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // 4. VERIFY DATA (Hyperledger Query)
    @GetMapping("/{id}/verify")
    public ResponseEntity<?> verifyComplaintOnChain(@PathVariable Long id) {
        try {
            String result = blockchainService.verifyOnHyperledger(String.valueOf(id));
            if (result == null) {
                return ResponseEntity.status(404).body("Complaint not found on Ledger");
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Blockchain Error: " + e.getMessage());
        }
    }

    @GetMapping("/my-complaints")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<Complaint>> getMyComplaints(Principal principal) {
        // ✅ MATCHES Service method: getComplaintsByStudent(String studentId)
        return ResponseEntity.ok(complaintService.getComplaintsByStudent(principal.getName()));
    }

    @GetMapping("/my-assigned")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<List<Complaint>> getAssignedComplaints(Principal principal) {
        // ✅ MATCHES Service method: getAssignedComplaints(String staffId)
        return ResponseEntity.ok(complaintService.getAssignedComplaints(principal.getName()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('WARDEN','ADMIN')")
    public ResponseEntity<List<Complaint>> getAllComplaints() {
        // ✅ MATCHES Service method: getAllComplaints()
        return ResponseEntity.ok(complaintService.getAllComplaints());
    }

    // 6. FEEDBACK SUBMISSION
    @PostMapping(value = "/{complaintId}/feedback", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submitFeedback(
            @PathVariable Long complaintId,
            @RequestParam("rating") int rating,
            @RequestParam("feedback") String feedback,
            @RequestParam("proof") MultipartFile proof,
            Principal principal) {
        try {
            Complaint closed = complaintService.submitFeedbackWithProof(complaintId, rating, feedback, proof, principal.getName());
            return ResponseEntity.ok(closed);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        }
    }
}