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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap; // ✅ Added Import
import java.util.Map;     // ✅ Added Import

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    // ✅ REGISTER ENDPOINT
    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> registerUser(
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("role") Role role,
            @RequestParam("mobile") String mobile,
            @RequestParam("permanentAddress") String permanentAddress,

            // Student Optionals
            @RequestParam(value = "irn", required = false) String irn,
            @RequestParam(value = "roomNumber", required = false) String roomNumber,
            @RequestParam(value = "hostelName", required = false) String hostelName,
            @RequestParam(value = "course", required = false) String course,
            @RequestParam(value = "year", required = false) String year,
            @RequestParam(value = "department", required = false) String department,
            @RequestParam(value = "parentMobile", required = false) String parentMobile,

            // Staff Optionals
            @RequestParam(value = "staffCategory", required = false) String staffCategory,

            // ✅ MANDATORY FILE
            @RequestParam("idProof") MultipartFile idProof
    ) {
        try {
            // Build DTO
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

            // Call Service
            User registeredUser = userService.registerUser(request, idProof);

            // ✅ FIX: Send a simple Map instead of the full User object
            // This prevents serialization errors with Dates/Passwords
            Map<String, String> response = new HashMap<>();
            response.put("message", "Registration Successful");
            response.put("userId", registeredUser.getUserId());
            response.put("role", registeredUser.getRole().name());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Registration Failed: " + e.getMessage());
        }
    }

    // ✅ LOGIN ENDPOINT
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            // 1. Authenticate using userId (e.g., IRN or Staff ID)
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUserId(), loginRequest.getPassword())
            );

            // 2. Load UserDetails for Token Generation
            final UserDetails userDetails = userDetailsService.loadUserByUsername(loginRequest.getUserId());
            final String jwt = jwtUtil.generateToken(userDetails);

            // 3. Fetch User Entity to get Role/Name
            User user = userService.getUserById(loginRequest.getUserId());

            // 4. Return Response
            return ResponseEntity.ok(new LoginResponse(jwt, user.getUserId(), user.getName(), user.getRole().name()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid User ID or Password");
        }
    }
}