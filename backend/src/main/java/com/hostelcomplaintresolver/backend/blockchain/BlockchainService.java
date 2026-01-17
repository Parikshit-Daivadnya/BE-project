package com.hostelcomplaintresolver.backend.blockchain;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.stereotype.Service;

import java.io.File;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class BlockchainService {

    private static final String LEDGER_FOLDER = "blockchain_ledger";
    private final ObjectMapper objectMapper;

    public BlockchainService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule()); // Support LocalDateTime
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        File folder = new File(LEDGER_FOLDER);
        if (!folder.exists()) {
            folder.mkdirs();
            System.out.println("📁 Created blockchain ledger folder: " + LEDGER_FOLDER);
        }
    }

    public synchronized void logTransaction(String complaintId, String userId, String action, String description) {
        try {
            // 1. Transaction object
            Transaction transaction = new Transaction(
                    UUID.randomUUID().toString(),
                    complaintId,
                    userId,
                    action,
                    description,
                    LocalDateTime.now()
            );

            // 2. Get/Create File
            File complaintFile = new File(LEDGER_FOLDER + "/" + complaintId + ".json");
            List<Block> chain;

            if (complaintFile.exists()) {
                chain = BlockchainUtils.loadComplaintChain(complaintFile);
            } else {
                chain = new ArrayList<>();
            }

            // 3. Determine Previous Hash
            // If chain is empty, prevHash is "0", otherwise get hash of last block
            String previousHash = chain.isEmpty() ? "0" : chain.get(chain.size() - 1).getHash();
            int newIndex = chain.size() + 1;

            // 4. Create New Block
            Block newBlock = new Block(newIndex, previousHash, transaction);

            // 5. Add & Save
            chain.add(newBlock);
            BlockchainUtils.saveComplaintChain(complaintFile, chain);

            System.out.println("✅ Logged blockchain entry for complaint " + complaintId +
                    " | Action: " + action + " | Block #" + newBlock.getIndex());

        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("❌ Error creating blockchain log: " + e.getMessage());
        }
    }

    // ✅ VERIFY INTEGRITY (The core logic)
    public boolean verifyBlockchain(String complaintId) {
        try {
            File complaintFile = new File(LEDGER_FOLDER + "/" + complaintId + ".json");
            if (!complaintFile.exists()) {
                System.err.println("❌ No blockchain file found for complaint: " + complaintId);
                return false;
            }

            // 1. Load the chain from the JSON file
            List<Block> chain = BlockchainUtils.loadComplaintChain(complaintFile);

            System.out.println("🔍 Verifying chain for Complaint " + complaintId + " (" + chain.size() + " blocks)...");

            // 2. Loop through every block to check integrity
            for (int i = 0; i < chain.size(); i++) {
                Block currentBlock = chain.get(i);

                // --- CHECK A: DATA TAMPERING ---
                // We recalculate the hash based on the *current* data in the object.
                // If the file was edited, 'currentBlock' has the new data, so calculateHash() returns a NEW hash.
                // We compare it to the 'hash' field loaded from the file (which is the OLD hash).
                String recalculatedHash = currentBlock.calculateHash();

                if (!currentBlock.getHash().equals(recalculatedHash)) {
                    System.err.println("❌ SECURITY ALERT: Data tampering detected at Block #" + currentBlock.getIndex());
                    System.err.println("   Stored Hash:      " + currentBlock.getHash());
                    System.err.println("   Calculated Hash:  " + recalculatedHash);
                    return false;
                }

                // --- CHECK B: CHAIN LINKAGE ---
                // Check if this block points to the correct previous block
                if (i > 0) {
                    Block previousBlock = chain.get(i - 1);
                    if (!currentBlock.getPreviousHash().equals(previousBlock.getHash())) {
                        System.err.println("❌ CHAIN BROKEN: Block #" + currentBlock.getIndex() +
                                " does not point to Block #" + previousBlock.getIndex());
                        System.err.println("   Current.PreviousHash: " + currentBlock.getPreviousHash());
                        System.err.println("   Previous.Hash:        " + previousBlock.getHash());
                        return false;
                    }
                }
            }

            System.out.println("✅ Blockchain Integrity Verified: No tampering detected.");
            return true;

        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("❌ Error verifying blockchain: " + e.getMessage());
            return false;
        }
    }
}