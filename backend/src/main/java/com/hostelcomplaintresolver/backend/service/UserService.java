package com.hostelcomplaintresolver.backend.service;

import com.hostelcomplaintresolver.backend.dto.CreateUserRequest;
import com.hostelcomplaintresolver.backend.model.Role;
import com.hostelcomplaintresolver.backend.model.User;
import com.hostelcomplaintresolver.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile; // ✅ Added

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Service
@Transactional
public class UserService {

    private static final String UPLOAD_DIR = "uploads/profiles/";
    private static final String ID_PROOF_DIR = "uploads/id_proofs/";

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    // =========================================================================
    // ✅ REGISTER USER (With ID Proof)
    // =========================================================================
    public User registerUser(CreateUserRequest request, MultipartFile idProof) throws IOException {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered: " + request.getEmail());
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setMobile(request.getMobile());
        user.setPermanentAddress(request.getPermanentAddress());

        // 1. Save ID Proof
        if (idProof != null && !idProof.isEmpty()) {
            String fileName = "id_" + request.getEmail() + "_" + UUID.randomUUID() + ".jpg";
            saveFile(ID_PROOF_DIR, fileName, idProof);
            user.setIdProof("/" + ID_PROOF_DIR + fileName); // Save path to DB
        } else {
            throw new RuntimeException("ID Proof is mandatory for registration.");
        }

        // 2. Generate User ID
        String userId;
        if (request.getRole() == Role.STUDENT) {
            if (request.getIrn() == null || request.getIrn().isEmpty()) {
                throw new IllegalArgumentException("IRN number is required for students.");
            }
            userId = request.getIrn();

            user.setRoomNumber(request.getRoomNumber());
            user.setHostelName(request.getHostelName());
            user.setCourse(request.getCourse());
            user.setStudentYear(request.getYear());
            user.setDepartment(request.getDepartment());
            user.setParentMobile(request.getParentMobile());

        } else {
            userId = generateRoleBasedId(request.getRole());
            if (request.getRole() == Role.STAFF) {
                user.setStaffCategory(request.getStaffCategory());
            }
        }

        user.setUserId(userId);
        return userRepository.save(user);
    }

    // =========================================================================
    // ✅ UPDATE PROFILE (With Profile Picture)
    // =========================================================================
    public User updateUserProfile(String userId, String mobile, String address, String parentMobile, MultipartFile photo) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update Text Fields if provided
        if (mobile != null && !mobile.isEmpty()) user.setMobile(mobile);
        if (address != null && !address.isEmpty()) user.setPermanentAddress(address);

        // Only update parent mobile if user is a student
        if (parentMobile != null && !parentMobile.isEmpty() && user.getRole() == Role.STUDENT) {
            user.setParentMobile(parentMobile);
        }

        // Update Profile Photo if provided
        if (photo != null && !photo.isEmpty()) {
            String fileName = "pfp_" + userId + "_" + UUID.randomUUID() + ".jpg";
            saveFile(UPLOAD_DIR, fileName, photo);
            user.setProfilePhoto("/" + UPLOAD_DIR + fileName);
        }

        return userRepository.save(user);
    }

    // =========================================================================
    // 🛠️ HELPER: Save File to Disk
    // =========================================================================
    private void saveFile(String uploadDir, String fileName, MultipartFile file) throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
    }

    // =========================================================================
    // 🔍 READ OPERATIONS
    // =========================================================================

    public List<User> getUsersByRole(Role role) {
        return userRepository.findByRole(role);
    }

    private String generateRoleBasedId(Role role) {
        String prefix = switch (role) {
            case WARDEN -> "WDN";
            case STAFF -> "STF";
            case ADMIN -> "ADM";
            default -> throw new IllegalArgumentException("Invalid role for ID generation");
        };

        long count = userRepository.countByRole(role) + 1;
        return prefix + String.format("%03d", count);
    }

    public User getUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with ID: " + userId));
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // =========================================================================
    // 🔐 PASSWORD RESET LOGIC
    // =========================================================================

    public void generatePasswordResetToken(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + userEmail));

        Random random = new Random();
        int otp = 1000 + random.nextInt(9000);
        String token = String.valueOf(otp);

        user.setPasswordResetToken(token);
        user.setPasswordResetTokenExpiry(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        String subject = "Password Reset OTP";
        String body = "Hello " + user.getName() + ",\n\n" +
                "Your OTP for password reset is:\n\n" +
                token + "\n\n" +
                "This OTP is valid for 5 minutes.";

        emailService.sendEmail(userEmail, subject, body);
        System.out.println("✅ Email sent to " + userEmail);
    }

    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid password reset token."));

        if (user.getPasswordResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Password reset token has expired.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiry(null);
        userRepository.save(user);
    }
}