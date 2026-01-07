package com.hostelcomplaintresolver.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import com.hostelcomplaintresolver.backend.blockchain.BlockchainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hostelcomplaintresolver.backend.dto.CreateComplaintRequest;
import com.hostelcomplaintresolver.backend.dto.FeedbackRequest;
import com.hostelcomplaintresolver.backend.model.Complaint;
import com.hostelcomplaintresolver.backend.model.ComplaintStatus;
import com.hostelcomplaintresolver.backend.model.Priority;
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

    /**
     * Creates and saves a new complaint raised by a student.
     */
    public Complaint createComplaint(CreateComplaintRequest createComplaintRequest, String studentEmail) {

        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Student not found with email: " + studentEmail));

        Complaint complaint = new Complaint();
        complaint.setCategory(createComplaintRequest.getCategory());
        complaint.setDescription(createComplaintRequest.getDescription());
        complaint.setStudent(student);
        complaint.setRoomNumber(student.getRoomNumber());
        complaint.setPriority(getPriorityForCategory(createComplaintRequest.getCategory()));
        complaint.setStatus(ComplaintStatus.RAISED);
        complaint.setCreatedAt(LocalDateTime.now());

        Complaint savedComplaint = complaintRepository.save(complaint);

        // 🧾 Blockchain log entry
        blockchainService.logTransaction(
                String.valueOf(savedComplaint.getId()),
                student.getUserId(),
                "RAISED",
                "Complaint raised by " + student.getName() + " for room " + savedComplaint.getRoomNumber()
        );

        emailService.sendEmail(
                student.getEmail(),
                "Complaint Raised Successfully",
                "Dear " + student.getName() + ",\n\n" +
                        "Your complaint regarding '" + complaint.getCategory() + "' has been successfully raised.\n" +
                        "Complaint ID: " + complaint.getId() + "\n\n" +
                        "We'll notify you as soon as it's assigned or resolved.\n\n" +
                        "Regards,\nHostel Complaint Resolver System"
        );


        return savedComplaint;
    }

    /**
     * Retrieves all complaints, sorted for warden/admin view.
     */
    public List<Complaint> getAllComplaints() {
        Sort sort = Sort.by(Sort.Order.asc("priority"), Sort.Order.asc("student.roomNumber"));
        return complaintRepository.findAll(sort);
    }

    /**
     * Retrieves all complaints for a specific student.
     */
    public List<Complaint> getComplaintsByStudent(String studentEmail) {
        return complaintRepository.findByStudent_Email(studentEmail);
    }

    /**
     * Assigns a complaint to a staff member by warden/admin.
     */
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
        complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        Complaint updatedComplaint = complaintRepository.save(complaint);

        // 🧾 Blockchain log
        blockchainService.logTransaction(
                String.valueOf(updatedComplaint.getId()),
                "SYSTEM",
                "ASSIGNED",
                "Complaint assigned to staff " + staff.getName() + " by system or warden"
        );
        emailService.sendEmail(
                complaint.getStudent().getEmail(),
                "Complaint Assigned to Staff",
                "Dear " + complaint.getStudent().getName() + ",\n\n" +
                        "Your complaint (ID: " + complaint.getId() + ") has been assigned to our staff: " +
                        staff.getName() + ".\nWe'll notify you when it's resolved.\n\n" +
                        "Regards,\nHostel Complaint Resolver System"
        );

        return updatedComplaint;
    }

    /**
     * Retrieves all complaints assigned to a specific staff member.
     */
    public List<Complaint> getComplaintsByStaff(String staffEmail) {
        return complaintRepository.findByStaff_Email(staffEmail);
    }

    /**
     * Marks a complaint as resolved by the assigned staff member.
     */
    @Transactional
    public Complaint resolveComplaint(Long complaintId, String staffEmail) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        User staff = userRepository.findByEmail(staffEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Staff member not found"));

        if (complaint.getStaff() == null || !complaint.getStaff().getUserId().equals(staff.getUserId())) {
            throw new SecurityException("You are not authorized to resolve this complaint.");
        }

        complaint.setStatus(ComplaintStatus.RESOLVED);
        Complaint resolvedComplaint = complaintRepository.save(complaint);

        // 🧾 Blockchain log
        blockchainService.logTransaction(
                String.valueOf(resolvedComplaint.getId()),
                staff.getUserId(),
                "RESOLVED",
                "Complaint resolved by staff " + staff.getName()
        );

        emailService.sendEmail(
                complaint.getStudent().getEmail(),
                "Complaint Resolved",
                "Dear " + complaint.getStudent().getName() + ",\n\n" +
                        "Your complaint (ID: " + complaint.getId() + ") has been marked as resolved by " +
                        staff.getName() + ".\nPlease check and provide feedback.\n\n" +
                        "Regards,\nHostel Complaint Resolver System"
        );


        return resolvedComplaint;
    }

    /**
     * Submits feedback and rating for a resolved complaint.
     */
    @Transactional
    public Complaint submitFeedback(Long complaintId, FeedbackRequest feedbackRequest, String studentEmail) {

        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found with ID: " + complaintId));

        if (!complaint.getStudent().getEmail().equals(studentEmail)) {
            throw new SecurityException("You are not authorized to submit feedback for this complaint.");
        }

        if (complaint.getStatus() != ComplaintStatus.RESOLVED) {
            throw new IllegalStateException("Feedback can only be submitted for resolved complaints.");
        }

        complaint.setRating(feedbackRequest.getRating());
        complaint.setFeedback(feedbackRequest.getFeedback());
        complaint.setStatus(ComplaintStatus.CLOSED);

        Complaint closedComplaint = complaintRepository.save(complaint);

        // 🧾 Blockchain log
        blockchainService.logTransaction(
                String.valueOf(closedComplaint.getId()),
                complaint.getStudent().getUserId(),
                "CLOSED",
                "Feedback submitted and complaint closed by " + complaint.getStudent().getName()
        );

        emailService.sendEmail(
                complaint.getStudent().getEmail(),
                "Feedback Submitted Successfully",
                "Dear " + complaint.getStudent().getName() + ",\n\n" +
                        "Thank you for submitting your feedback for complaint ID: " + complaint.getId() + ".\n" +
                        "Your response helps us improve our services.\n\n" +
                        "Regards,\nHostel Complaint Resolver System"
        );

        return closedComplaint;
    }

    /**
     * Determines complaint priority based on category.
     */
    private Priority getPriorityForCategory(String category) {
        if (category == null) {
            return Priority.LOW; // Default
        }

        switch (category.toLowerCase()) {
            case "electrical":
            case "plumbing":
                return Priority.HIGH;
            case "housekeeping":
            case "carpentry":
                return Priority.MEDIUM;
            case "internet":
            case "other":
            default:
                return Priority.LOW;
        }
    }
}
