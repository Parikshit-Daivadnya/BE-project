package com.hostelcomplaintresolver.backend.controller;

import com.hostelcomplaintresolver.backend.dto.CreateUserRequest;
import com.hostelcomplaintresolver.backend.dto.LoginRequest;
import com.hostelcomplaintresolver.backend.dto.LoginResponse;
import com.hostelcomplaintresolver.backend.model.User;
import com.hostelcomplaintresolver.backend.service.UserService;
import com.hostelcomplaintresolver.backend.util.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    // ✅ REGISTER USER (STUDENT/STAFF/WARDEN/ADMIN)
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody CreateUserRequest request) {
        try {
            User savedUser = userService.registerUser(request);
            return new ResponseEntity<>(savedUser, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error registering user: " + e.getMessage());
        }
    }

    // ✅ LOGIN (JWT AUTH)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid email or password");
        }

        final UserDetails userDetails = userDetailsService.loadUserByUsername(loginRequest.getEmail());
        final String token = jwtUtil.generateToken(userDetails);

        return ResponseEntity.ok(new LoginResponse(token));
    }

    // ✅ FORGOT PASSWORD (GENERATE TOKEN)
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        userService.generatePasswordResetToken(email);
        return ResponseEntity.ok("Password reset token sent to your email (check console for testing).");
    }

    // ✅ RESET PASSWORD (USING TOKEN)
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");
        userService.resetPassword(token, newPassword);
        return ResponseEntity.ok("Password has been successfully reset.");
    }

    // ✅ FETCH USER BY ID (NOW STRING userId)
    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserById(@PathVariable String userId) {
        try {
            return ResponseEntity.ok(userService.getUserById(userId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found with ID: " + userId);
        }
    }
}
