package com.hostelcomplaintresolver.backend.controller;

import com.hostelcomplaintresolver.backend.dto.CreateUserRequest;
import com.hostelcomplaintresolver.backend.dto.LoginRequest;
import com.hostelcomplaintresolver.backend.dto.LoginResponse;
import com.hostelcomplaintresolver.backend.model.Role;
import com.hostelcomplaintresolver.backend.model.User;
import com.hostelcomplaintresolver.backend.security.JwtUtil;
import com.hostelcomplaintresolver.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile; // ✅ Added Import

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

    // =========================================================================
    // ✅ REGISTER USER (Now Supports ID Proof Upload)
    // =========================================================================
    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> registerUser(
            // User Details
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("role") Role role,
            @RequestParam("mobile") String mobile,
            @RequestParam("permanentAddress") String permanentAddress,

            // Student Specific (Optional)
            @RequestParam(value = "irn", required = false) String irn,
            @RequestParam(value = "roomNumber", required = false) String roomNumber,
            @RequestParam(value = "hostelName", required = false) String hostelName,
            @RequestParam(value = "course", required = false) String course,
            @RequestParam(value = "year", required = false) String year,
            @RequestParam(value = "department", required = false) String department,
            @RequestParam(value = "parentMobile", required = false) String parentMobile,

            // Staff Specific (Optional)
            @RequestParam(value = "staffCategory", required = false) String staffCategory,

            // ✅ MANDATORY FILE
            @RequestParam("idProof") MultipartFile idProof
    ) {
        try {
            // Manually build DTO from RequestParams
            CreateUserRequest request = new CreateUserRequest();
            request.setName(name);
            request.setEmail(email);
            request.setPassword(password);
            request.setRole(role);
            request.setMobile(mobile);
            request.setPermanentAddress(permanentAddress);

            request.setIrn(irn);
            request.setRoomNumber(roomNumber);
            request.setHostelName(hostelName);
            request.setCourse(course);
            request.setYear(year);
            request.setDepartment(department);
            request.setParentMobile(parentMobile);
            request.setStaffCategory(staffCategory);

            // Call updated Service
            User savedUser = userService.registerUser(request, idProof);
            return new ResponseEntity<>(savedUser, HttpStatus.CREATED);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error registering user: " + e.getMessage());
        }
    }

    // ✅ LOGIN (JWT AUTH) - Unchanged
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUserId(), loginRequest.getPassword())
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid user-id or password");
        }

        final UserDetails userDetails = userDetailsService.loadUserByUsername(loginRequest.getUserId());
        final String token = jwtUtil.generateToken(userDetails);

        // Fetch User to get Role/Name if needed
        User user = userService.getUserById(loginRequest.getUserId());

        return ResponseEntity.ok(new LoginResponse(token, user.getUserId(), user.getName(), user.getRole().name()));
    }

    // =========================================================================
    // ✅ UPDATE PROFILE (Now Supports Profile Photo Upload)
    // =========================================================================
    @PutMapping(value = "/{userId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateUser(
            @PathVariable String userId,
            @RequestParam(value = "mobile", required = false) String mobile,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "parentMobile", required = false) String parentMobile,
            @RequestParam(value = "photo", required = false) MultipartFile photo // Optional Photo
    ) {
        try {
            User updatedUser = userService.updateUserProfile(userId, mobile, address, parentMobile, photo);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Update failed: " + e.getMessage());
        }
    }

    // ✅ FETCH USERS BY ROLE
    @GetMapping("/role/{roleName}")
    @PreAuthorize("hasAnyRole('WARDEN', 'ADMIN')")
    public ResponseEntity<?> getUsersByRole(@PathVariable String roleName) {
        try {
            Role role = Role.valueOf(roleName.toUpperCase());
            return ResponseEntity.ok(userService.getUsersByRole(role));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid Role");
        }
    }

    // ✅ FORGOT PASSWORD
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        userService.generatePasswordResetToken(email);
        return ResponseEntity.ok("Password reset token sent to your email (check console/logs).");
    }

    // ✅ RESET PASSWORD
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");
        userService.resetPassword(token, newPassword);
        return ResponseEntity.ok("Password has been successfully reset.");
    }

    // ✅ FETCH USER BY ID
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