package com.hostelcomplaintresolver.backend.controller;

import com.hostelcomplaintresolver.backend.model.Notice;
import com.hostelcomplaintresolver.backend.repository.NoticeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notices")
@CrossOrigin // Allows the frontend to communicate with this controller
public class NoticeController {

    @Autowired
    private NoticeRepository noticeRepository;

    // ✅ GET ALL NOTICES
    // Accessible by Student, Staff, and Warden
    @GetMapping
    public List<Notice> getAllNotices() {
        return noticeRepository.findAllByOrderByDateDesc();
    }

    // ✅ POST NOTICE
    // Restricted: Only a WARDEN can post a notice
    @PostMapping
    @PreAuthorize("hasRole('WARDEN')")
    public Notice postNotice(@RequestBody Notice notice) {
        return noticeRepository.save(notice);
    }

    // ✅ DELETE NOTICE
    // Restricted: Only a WARDEN can delete a notice
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('WARDEN')")
    public void deleteNotice(@PathVariable Long id) {
        noticeRepository.deleteById(id);
    }
}