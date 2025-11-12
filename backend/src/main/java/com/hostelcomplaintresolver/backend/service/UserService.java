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
import java.util.UUID;



@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ✅ REGISTER USER (Student enters IRN / others get generated ID)
    public User registerUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered: " + request.getEmail());
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setRoomNumber(request.getRoomNumber());

        // ✅ Set user_id manually (Student IRN or Role-based ID)
        String userId;
        if (request.getRole() == Role.STUDENT) {
            if (request.getIrn() == null || request.getIrn().isEmpty()) {
                throw new IllegalArgumentException("IRN number is required for students.");

            }
            userId = request.getIrn();
        } else {
            userId = generateRoleBasedId(request.getRole());
        }

        user.setUserId(userId);
        return userRepository.save(user);
    }

    // ✅ Role-based ID Generator for Warden, Staff, Admin
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

    // ✅ Fetch user by ID (String)
    public User getUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with ID: " + userId));
    }

    // ✅ Generate Password Reset Token
    public void generatePasswordResetToken(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + userEmail));

        String token = UUID.randomUUID().toString();
        user.setPasswordResetToken(token);
        user.setPasswordResetTokenExpiry(LocalDateTime.now().plusHours(1)); // 1-hour validity
        userRepository.save(user);

        // TODO: send email (for now print to console)
        System.out.println("Password Reset Token for " + userEmail + ": " + token);
    }

    // ✅ Reset Password via Token
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

    // ✅ Optional helper (login / validation)
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}
