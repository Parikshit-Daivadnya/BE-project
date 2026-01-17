package com.hostelcomplaintresolver.backend.repository;
import com.hostelcomplaintresolver.backend.model.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NoticeRepository extends JpaRepository<Notice, Long> {
    List<Notice> findAllByOrderByDateDesc(); // Newest first
}