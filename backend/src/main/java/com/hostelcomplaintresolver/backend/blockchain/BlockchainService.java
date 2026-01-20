package com.hostelcomplaintresolver.backend.blockchain;

import org.hyperledger.fabric.client.Contract;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;

@Service
public class BlockchainService {

    @Autowired
    private Contract contract;

    /**
     * Records a new transaction on the actual Hyperledger Fabric ledger.
     * Order must match ComplaintContract: id, studentName, roomNumber, category, description, status
     */
    public void logTransaction(String complaintId, String studentName, String roomNumber, String category, String description, String status) {
        try {
            // ✅ FIXED ORDER: Aligning variables with the Ledger's internal structure
            contract.submitTransaction("createComplaint",
                    complaintId,   // 1. complaintId -> Maps to 'complaintId'
                    studentName,   // 2. studentName -> Maps to 'title'
                    roomNumber,    // 3. roomNumber  -> Maps to 'roomNumber'
                    category,      // 4. category    -> Maps to 'category'
                    description,   // 5. description -> Maps to 'description'
                    status         // 6. status      -> Maps to 'status'
            );

            System.out.println("✅ Actual Hyperledger Fabric Ledger Updated for ID: " + complaintId);
        } catch (Exception e) {
            System.err.println("❌ Hyperledger Fabric Sync Failed: " + e.getMessage());
        }
    }

    public String verifyOnHyperledger(String complaintId) {
        try {
            // ✅ Namespace 'hostel:' is required as per your @Contract annotation
            byte[] result = contract.evaluateTransaction("readComplaint", complaintId);
            return new String(result, StandardCharsets.UTF_8);
        } catch (Exception e) {
            System.err.println("❌ Failed to read from Hyperledger: " + e.getMessage());
            return null;
        }
    }
}