package com.hostelcomplaintresolver.backend.controller;

import com.hostelcomplaintresolver.backend.model.ResaleItem;
import com.hostelcomplaintresolver.backend.service.ResaleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/resale")
@CrossOrigin
public class ResaleController {

    @Autowired
    private ResaleService resaleService;

    // ✅ POST NEW ITEM (Multipart Request)
    // Mandatory Image Upload is enforced here
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('STUDENT', 'WARDEN')") // Allow Students & Warden to post
    public ResponseEntity<?> postItem(
            @RequestParam("name") String name,
            @RequestParam("price") Double price,
            @RequestParam("category") String category,
            @RequestParam("description") String description,
            @RequestParam("ownerName") String ownerName,
            @RequestParam(value = "ownerContact", required = false) String ownerContact,
            @RequestParam("image") MultipartFile image // <--- MANDATORY FILE
    ) {
        try {
            // 1. Validation
            if (image.isEmpty()) {
                return ResponseEntity.badRequest().body("Error: Item image is mandatory.");
            }

            // 2. Call Service to save File & Data
            ResaleItem item = resaleService.postItem(name, price, category, description, ownerName, ownerContact, image);
            return ResponseEntity.status(HttpStatus.CREATED).body(item);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error posting item: " + e.getMessage());
        }
    }

    // ✅ GET ALL ACTIVE ITEMS
    @GetMapping
    public ResponseEntity<List<ResaleItem>> getAllItems() {
        return ResponseEntity.ok(resaleService.getAllActiveItems());
    }

    // ✅ MARK AS SOLD
    @PutMapping("/{id}/sold")
    @PreAuthorize("hasAnyRole('STUDENT', 'WARDEN')")
    public ResponseEntity<?> markAsSold(@PathVariable Long id) {
        try {
            resaleService.markAsSold(id);
            return ResponseEntity.ok("Item marked as sold.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}