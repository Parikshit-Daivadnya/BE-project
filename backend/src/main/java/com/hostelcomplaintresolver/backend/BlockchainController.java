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

    /**
     * ✅ NEW: Verify and fetch data directly from the Hyperledger Fabric Ledger.
     * This calls the evaluateTransaction method to ensure data integrity on the real network.
     */
    @GetMapping("/verify/{complaintId}")
    public ResponseEntity<String> verifyComplaintBlockchain(@PathVariable String complaintId) {
        // We now call the new method that queries the actual Hyperledger ledger
        String ledgerData = blockchainService.verifyOnHyperledger(complaintId);

        if (ledgerData != null) {
            // If data is returned, the record exists and is cryptographically secure on Fabric
            return ResponseEntity.ok("✅ Actual Hyperledger Fabric Record Found: " + ledgerData);
        } else {
            // If null is returned, it means the record doesn't exist on the Docker peer
            return ResponseEntity.status(404).body("❌ No record found on Actual Hyperledger Ledger for complaint ID: " + complaintId);
        }
    }
}