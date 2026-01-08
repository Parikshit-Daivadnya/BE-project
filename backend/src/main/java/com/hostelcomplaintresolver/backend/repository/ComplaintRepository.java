package com.hostelcomplaintresolver.backend.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hostelcomplaintresolver.backend.model.Complaint;
import com.hostelcomplaintresolver.backend.model.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {


//        // Find complaints raised by a specific student
//        List<Complaint> findByStudent_UserId(String studentId);
//
//        // Find complaints assigned to a particular staff member
//        List<Complaint> findByStaff_UserId(String staffId);
//
//        // Find complaints assigned to a particular admin/warden
//        List<Complaint> findByAssignedTo_UserId(String assignedToId);

    // ✅ Finds complaints where student.userId == studentId
    List<Complaint> findByStudent_UserId(String studentId);

    // ✅ Finds complaints where staff.userId == staffId (THIS WAS MISSING)
    List<Complaint> findByStaff_UserId(String staffId);

    // ✅ Finds complaints assigned to Warden/Admin
    List<Complaint> findByAssignedTo_UserId(String assignedToId);


        /**
         * By extending JpaRepository, we get standard CRUD methods for free:
         * save(), findById(), findAll(), delete(), etc.
         */

        /**
         * Spring Data JPA automatically creates the query based on the method name.
         * This will find all complaints associated with a specific student's email.
         */
        List<Complaint> findByStudent_Email(String email);

        /**
         * This will find all complaints assigned to a specific staff member's ID.
         */

    List<Complaint> findByStaff_Email(String staffEmail);
         List<Complaint> findAllByOrderByPriorityAsc();
    }

