package com.hostelcomplaintresolver.backend.repository;

import com.hostelcomplaintresolver.backend.model.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    // ✅ FIX 1: Updated query to use 'c.staff' instead of 'c.assignedStaff'
    // Added COALESCE to return 0.0 if no ratings exist (prevents null errors)
    @Query("SELECT COALESCE(AVG(c.rating), 0.0) FROM Complaint c WHERE c.staff.userId = :staffId AND c.rating IS NOT NULL")
    Double getAverageRating(@Param("staffId") String staffId);

    // ✅ FIX 2: Updated query to use 'c.staff'
    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.staff.userId = :staffId AND c.rating IS NOT NULL")
    Long getRatedComplaintCount(@Param("staffId") String staffId);

    // ✅ Standard JPA Methods
    List<Complaint> findByStudent_UserId(String studentId);

    List<Complaint> findByStaff_UserId(String staffId);

    List<Complaint> findByAssignedTo_UserId(String assignedToId);

    List<Complaint> findByStudent_Email(String email);

    List<Complaint> findByStaff_Email(String staffEmail);

    List<Complaint> findAllByOrderByPriorityAsc();
}