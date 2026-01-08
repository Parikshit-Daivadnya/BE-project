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

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    // ✅ REGISTER USER
    public User registerUser(CreateUserRequest request) {
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

        String userId;

        if (request.getRole() == Role.STUDENT) {
            if (request.getIrn() == null || request.getIrn().isEmpty()) {
                throw new IllegalArgumentException("IRN number is required for students.");
            }
            userId = request.getIrn();

            user.setRoomNumber(request.getRoomNumber());
            user.setHostelName(request.getHostelName()); // ✅ Now works
            user.setCourse(request.getCourse());         // ✅ Now works
            user.setStudentYear(request.getYear());      // ✅ Now works
            user.setDepartment(request.getDepartment()); // ✅ Now works
            user.setParentMobile(request.getParentMobile()); // ✅ Now works

        } else {
            userId = generateRoleBasedId(request.getRole());
            if (request.getRole() == Role.STAFF) {
                user.setStaffCategory(request.getStaffCategory()); // ✅ Now works
            }
        }

        user.setUserId(userId);
        return userRepository.save(user);
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

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}