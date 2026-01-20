package com.hostelcomplaintresolver.backend.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import com.hostelcomplaintresolver.backend.blockchain.BlockchainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.hostelcomplaintresolver.backend.dto.CreateComplaintRequest;
import com.hostelcomplaintresolver.backend.model.Complaint;
import com.hostelcomplaintresolver.backend.model.Role;
import com.hostelcomplaintresolver.backend.model.User;
import com.hostelcomplaintresolver.backend.repository.ComplaintRepository;
import com.hostelcomplaintresolver.backend.repository.UserRepository;

@Service
public class ComplaintService {
    @Autowired
    private EmailService emailService;

    @Autowired
    private BlockchainService blockchainService;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private UserRepository userRepository;

    private static final String UPLOAD_DIR = "uploads/proofs/";

    /**
     * Creates a new complaint and syncs with Hyperledger Fabric
     */
    public Complaint createComplaint(CreateComplaintRequest createComplaintRequest, String studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new UsernameNotFoundException("Student not found with ID: " + studentId));

        Complaint complaint = new Complaint();
        complaint.setCategory(createComplaintRequest.getCategory());
        complaint.setDescription(createComplaintRequest.getDescription());
        complaint.setStudent(student);
        complaint.setRoomNumber(student.getRoomNumber());
        complaint.setTimeSlot(createComplaintRequest.getTimeSlot());
        complaint.setStatus("RAISED");
        complaint.setCreatedAt(LocalDateTime.now());

        String autoPriority = determinePriority(createComplaintRequest.getCategory());
        complaint.setPriority(autoPriority);

        Complaint savedComplaint = complaintRepository.save(complaint);

        // ✅ Blockchain Sync: Cross-checked order (id, name, room, category, desc, status)
        blockchainService.logTransaction(
                String.valueOf(savedComplaint.getId()),
                student.getName(),
                savedComplaint.getRoomNumber(),
                savedComplaint.getCategory(),
                savedComplaint.getDescription(),
                "RAISED"
        );

        try {
            emailService.sendEmail(student.getEmail(), "Complaint Raised", "ID: " + savedComplaint.getId());
        } catch (Exception e) { System.err.println("Email failed: " + e.getMessage()); }

        return savedComplaint;
    }

    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    public List<Complaint> getComplaintsByStudent(String studentId) {
        return complaintRepository.findByStudent_UserId(studentId);
    }

    public List<Complaint> getAssignedComplaints(String staffId) {
        return complaintRepository.findByStaff_UserId(staffId);
    }



    @Transactional
    public Complaint assignComplaint(Long complaintId, String staffId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        complaint.setStaff(staff);
        complaint.setStatus("ASSIGNED");
        Complaint updatedComplaint = complaintRepository.save(complaint);

        // ✅ Blockchain Sync
        blockchainService.logTransaction(
                String.valueOf(updatedComplaint.getId()),
                complaint.getStudent().getName(),
                updatedComplaint.getRoomNumber(),
                updatedComplaint.getCategory(),
                updatedComplaint.getDescription(),
                "ASSIGNED"
        );

        return updatedComplaint;
    }

    @Transactional
    public Complaint resolveComplaint(Long complaintId, String staffId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        complaint.setStatus("RESOLVED");
        Complaint resolvedComplaint = complaintRepository.save(complaint);

        // ✅ Blockchain Sync
        blockchainService.logTransaction(
                String.valueOf(resolvedComplaint.getId()),
                complaint.getStudent().getName(),
                resolvedComplaint.getRoomNumber(),
                resolvedComplaint.getCategory(),
                resolvedComplaint.getDescription(),
                "RESOLVED"
        );

        return resolvedComplaint;
    }

    @Transactional
    public Complaint submitFeedbackWithProof(Long complaintId, int rating, String feedback, MultipartFile proof, String studentId) throws IOException {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        complaint.setStatus("CLOSED");
        complaint.setFeedback(feedback);
        complaint.setRating(rating);
        Complaint closedComplaint = complaintRepository.save(complaint);

        // ✅ Blockchain Sync
        blockchainService.logTransaction(
                String.valueOf(closedComplaint.getId()),
                complaint.getStudent().getName(),
                closedComplaint.getRoomNumber(),
                closedComplaint.getCategory(),
                "Feedback: " + feedback + " | Rating: " + rating,
                "CLOSED"
        );

        return closedComplaint;
    }

    private String determinePriority(String category) {
        if (category == null) return "Medium";
        String cat = category.toLowerCase();
        if (cat.contains("electr") || cat.contains("plumb")) return "High";
        if (cat.contains("clean") || cat.contains("furni") || cat.contains("carpen")) return "Low";
        return "Medium";
    }

    // Additional methods (getAllComplaints, getComplaintsByStudent, etc.) remain as per your existing logic
}