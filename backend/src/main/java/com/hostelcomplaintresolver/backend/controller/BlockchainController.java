package com.hostelcomplaintresolver.backend.controller;

import com.hostelcomplaintresolver.backend.blockchain.BlockchainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/blockchain")
@CrossOrigin(origins = "*")

public class BlockchainController {

    @Autowired
    private BlockchainService blockchainService;

    // ✅ Verify a blockchain file for a complaint
    @GetMapping("/verify/{complaintId}")
    public ResponseEntity<String> verifyComplaintBlockchain(@PathVariable String complaintId) {
        boolean isValid = blockchainService.verifyBlockchain(complaintId);

        if (isValid) {
            return ResponseEntity.ok("✅ Blockchain is valid for complaint ID: " + complaintId);
        } else {
            return ResponseEntity.status(400).body("❌ Blockchain tampering detected or file missing for complaint ID: " + complaintId);
        }
    }
}
