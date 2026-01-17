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
import org.springframework.scheduling.annotation.Scheduled; // ✅ Added Import
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
     * Creates and saves a new complaint raised by a student.
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

        // ✅ FIX: Use String "RAISED"
        complaint.setStatus("RAISED");
        complaint.setCreatedAt(LocalDateTime.now());

        // ✅ FIX: Determine Priority as String
        String autoPriority = determinePriority(createComplaintRequest.getCategory());
        complaint.setPriority(autoPriority);

        Complaint savedComplaint = complaintRepository.save(complaint);

        // 🧾 Blockchain
        blockchainService.logTransaction(
                String.valueOf(savedComplaint.getId()),
                student.getUserId(),
                "RAISED",
                "Complaint raised by " + student.getName() + " for room " + savedComplaint.getRoomNumber()
        );

        // 📧 Email (Restored)
        try {
            emailService.sendEmail(
                    student.getEmail(),
                    "Complaint Raised Successfully",
                    "Dear " + student.getName() + ",\n\n" +
                            "Your complaint regarding '" + complaint.getCategory() + "' has been successfully raised.\n" +
                            "Complaint ID: " + complaint.getId() + "\n" +
                            "Priority: " + autoPriority + "\n\n" +
                            "We'll notify you as soon as it's assigned or resolved.\n\n" +
                            "Regards,\nHostel Complaint Resolver System"
            );
        } catch (Exception e) {
            System.err.println("Email failed: " + e.getMessage());
        }

        return savedComplaint;
    }

    // ✅ FIX: Consolidated Priority Helper (String return type)
    private String determinePriority(String category) {
        if (category == null) return "Medium";
        String cat = category.toLowerCase();
        if (cat.contains("electr") || cat.contains("plumb")) return "High";
        if (cat.contains("clean") || cat.contains("furni") || cat.contains("carpen")) return "Low";
        return "Medium";
    }

    // 1. REOPEN Logic (Simple)
    public Complaint reopenComplaint(Long id, String reason) {
        Complaint c = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        if ("RESOLVED".equals(c.getStatus())) { // ✅ Fix: String comparison
            c.setStatus("ESCALATED");
            complaintRepository.save(c);

            blockchainService.logTransaction(String.valueOf(id), "Student", "ESCALATED", "Reason: " + reason);
            return c;
        }
        throw new RuntimeException("Complaint is not in RESOLVED state");
    }

    // 2. REVERT Logic
    public Complaint revertComplaint(Long id) {
        Complaint c = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        // ✅ Fix: String comparison
        if ("ESCALATED".equals(c.getStatus()) || "RESOLVED".equals(c.getStatus())) {
            c.setStatus("IN_PROGRESS");
            complaintRepository.save(c);

            blockchainService.logTransaction(String.valueOf(id), "Warden", "REVERTED", "Status reverted to In Progress");
            return c;
        }
        throw new RuntimeException("Cannot revert this complaint");
    }

    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    public List<Complaint> getComplaintsByStudent(String studentId) {
        return complaintRepository.findByStudent_UserId(studentId);
    }

    @Transactional
    public Complaint assignComplaint(Long complaintId, String staffId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        if (staff.getRole() != Role.STAFF) {
            throw new RuntimeException("Assigned user is not a staff member");
        }

        complaint.setStaff(staff);
        complaint.setStatus("ASSIGNED"); // ✅ Fix: String
        Complaint updatedComplaint = complaintRepository.save(complaint);

        // 🧾 Blockchain
        blockchainService.logTransaction(
                String.valueOf(updatedComplaint.getId()),
                "SYSTEM",
                "ASSIGNED",
                "Complaint assigned to staff " + staff.getName()
        );

        // 📧 Notifications (Restored)
        emailService.sendEmail(
                complaint.getStudent().getEmail(),
                "Complaint Assigned",
                "Your complaint (ID: " + complaint.getId() + ") has been assigned to: " + staff.getName()
        );
        emailService.sendEmail(
                staff.getEmail(),
                "New Task Assigned",
                "You have been assigned a new complaint.\nID: " + complaint.getId()
        );

        return updatedComplaint;
    }

    public List<Complaint> getAssignedComplaints(String staffId) {
        return complaintRepository.findByStaff_UserId(staffId);
    }

    @Transactional
    public Complaint resolveComplaint(Long complaintId, String staffId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff member not found"));

        if (complaint.getStaff() == null || !complaint.getStaff().getUserId().equals(staff.getUserId())) {
            throw new SecurityException("You are not authorized to resolve this complaint.");
        }

        complaint.setStatus("RESOLVED"); // ✅ Fix: String
        Complaint resolvedComplaint = complaintRepository.save(complaint);

        // 🧾 Blockchain
        blockchainService.logTransaction(
                String.valueOf(resolvedComplaint.getId()),
                staff.getUserId(),
                "RESOLVED",
                "Complaint resolved by staff " + staff.getName()
        );

        // 📧 Email (Restored)
        emailService.sendEmail(
                complaint.getStudent().getEmail(),
                "Complaint Resolved",
                "Your complaint (ID: " + complaint.getId() + ") is marked resolved. Please provide feedback."
        );

        return resolvedComplaint;
    }

    /**
     * Submit feedback with Mandatory Photo Proof
     */
    @Transactional
    public Complaint submitFeedbackWithProof(Long complaintId, int rating, String feedback, MultipartFile proof, String studentId) throws IOException {

        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        if (!complaint.getStudent().getUserId().equals(studentId)) {
            throw new SecurityException("Unauthorized");
        }

        if (!"RESOLVED".equals(complaint.getStatus())) { // ✅ Fix: String
            throw new IllegalStateException("Feedback can only be submitted for resolved complaints.");
        }

        // Save File
        String fileName = "proof_" + complaintId + "_" + UUID.randomUUID() + ".jpg";
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(proof.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        complaint.setRating(rating);
        complaint.setFeedback(feedback);
        complaint.setProofImage("/uploads/proofs/" + fileName);
        complaint.setStatus("CLOSED"); // ✅ Fix: String

        Complaint closedComplaint = complaintRepository.save(complaint);

        // 🧾 Blockchain
        blockchainService.logTransaction(
                String.valueOf(closedComplaint.getId()),
                studentId,
                "CLOSED",
                "Feedback submitted with proof. Rating: " + rating
        );

        // 📧 Email (Restored)
        emailService.sendEmail(
                complaint.getStudent().getEmail(),
                "Complaint Closed",
                "Thank you for your feedback. Complaint ID: " + complaint.getId() + " is now closed."
        );

        return closedComplaint;
    }

    // New Method: Reopen with Proof (For Controller)
    @Transactional
    public Complaint reopenComplaintWithProof(Long id, String reason, MultipartFile proof) throws IOException {
        Complaint c = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        if ("RESOLVED".equals(c.getStatus())) { // ✅ Fix: String
            // Save Proof
            String fileName = "escalation_" + id + "_" + UUID.randomUUID() + ".jpg";
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);
            Files.copy(proof.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);

            c.setStatus("ESCALATED"); // ✅ Fix: String
            c.setProofImage("/uploads/proofs/" + fileName);

            String newDesc = c.getDescription() + "\n\n[ESCALATED]: " + reason;
            if(newDesc.length() > 1000) newDesc = newDesc.substring(0, 1000);
            c.setDescription(newDesc);

            complaintRepository.save(c);

            // 🧾 Blockchain
            blockchainService.logTransaction(String.valueOf(id), "Student", "ESCALATED", "Escalated with proof: " + reason);

            return c;
        }
        throw new RuntimeException("Complaint must be RESOLVED to escalate.");
    }

    // ✅ AUTO-ESCALATION SCHEDULER
    @Scheduled(cron = "0 0 * * * *") // Runs hourly
    @Transactional
    public void escalateComplaintPriorities() {
        System.out.println("🔄 Running Priority Escalation Check...");

        List<Complaint> activeComplaints = complaintRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        for (Complaint c : activeComplaints) {
            if ("RESOLVED".equals(c.getStatus()) || "CLOSED".equals(c.getStatus())) {
                continue;
            }

            long hoursPassed = ChronoUnit.HOURS.between(c.getCreatedAt(), now);
            long daysPassed = hoursPassed / 24;

            boolean updated = false;

            if ("Medium".equalsIgnoreCase(c.getPriority()) && daysPassed >= 1) {
                c.setPriority("High");
                updated = true;
                System.out.println("⚠️ Auto-Escalated ID " + c.getId() + " to HIGH");
            }
            if ("Low".equalsIgnoreCase(c.getPriority()) && daysPassed >= 3) {
                c.setPriority("Medium");
                updated = true;
                System.out.println("⚠️ Auto-Escalated ID " + c.getId() + " to MEDIUM");
            }

            if (updated) {
                complaintRepository.save(c);
            }
        }
    }
}