package com.hostelcomplaintresolver.backend.repository;


import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hostelcomplaintresolver.backend.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    // Spring Data JPA will automatically provide methods like save(), findById(), findAll(), delete()

    // We can also define custom query methods here later if we need them.
    // For example:
    Optional<User> findByEmail(String email);
    // In UserRepository.java
    Optional<User> findByPasswordResetToken(String token);

    boolean existsByEmail(String email);

    long countByRole(com.hostelcomplaintresolver.backend.model.Role role);

    }
