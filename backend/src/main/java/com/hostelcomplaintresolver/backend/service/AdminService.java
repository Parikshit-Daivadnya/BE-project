package com.hostelcomplaintresolver.backend.service;

import com.hostelcomplaintresolver.backend.dto.CreateUserRequest;
import com.hostelcomplaintresolver.backend.model.Role;
import com.hostelcomplaintresolver.backend.model.User;
import com.hostelcomplaintresolver.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User createUser(CreateUserRequest createUserRequest) {
        // Check to ensure admin can only create Warden or Staff roles
        if (createUserRequest.getRole() == Role.STUDENT || createUserRequest.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Admin can only create STAFF or WARDEN roles.");
        }

        User user = new User();
        user.setName(createUserRequest.getName());
        user.setEmail(createUserRequest.getEmail());
        user.setPassword(passwordEncoder.encode(createUserRequest.getPassword()));
        user.setRole(createUserRequest.getRole());

        return userRepository.save(user);
    }

    public List<User> getNonStudentUsers() {
        List<User> allUsers = userRepository.findAll();
        // Use a stream to filter the list, keeping only non-student users
        return allUsers.stream()
                .filter(user -> user.getRole() != Role.STUDENT)
                .collect(Collectors.toList());
    }
}