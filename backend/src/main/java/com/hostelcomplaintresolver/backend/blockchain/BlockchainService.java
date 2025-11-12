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
        this.objectMapper.registerModule(new JavaTimeModule()); // ✅ support LocalDateTime
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        File folder = new File(LEDGER_FOLDER);
        if (!folder.exists()) {
            folder.mkdirs();
            System.out.println("📁 Created blockchain ledger folder: " + LEDGER_FOLDER);
        }
    }

    public synchronized void logTransaction(String complaintId, String userId, String action, String description) {
        try {
            // ✅ Transaction object
            Transaction transaction = new Transaction(
                    UUID.randomUUID().toString(),
                    complaintId,
                    userId,
                    action,
                    description,
                    LocalDateTime.now()
            );

            // ✅ Get or create complaint-specific blockchain file
            File complaintFile = new File(LEDGER_FOLDER + "/" + complaintId + ".json");

            List<Block> chain;
            if (complaintFile.exists()) {
                chain = BlockchainUtils.loadComplaintChain(complaintFile);
            } else {
                chain = new ArrayList<>();
            }

            // ✅ Determine previous hash
            String previousHash = chain.isEmpty() ? "0" : chain.get(chain.size() - 1).getHash();
            int newIndex = chain.size() + 1;

            // ✅ Create new block
            Block newBlock = new Block(newIndex, previousHash, transaction);

            // ✅ Append new block to this complaint’s blockchain
            chain.add(newBlock);

            // ✅ Save updated chain to the same complaint file
            BlockchainUtils.saveComplaintChain(complaintFile, chain);

            System.out.println("✅ Logged blockchain entry for complaint " + complaintId +
                    " | Action: " + action + " | Block #" + newBlock.getIndex());

        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("❌ Error creating blockchain log: " + e.getMessage());
        }
    }

    // ✅ Verify the blockchain integrity for a given complaint
    public boolean verifyBlockchain(String complaintId) {
        try {
            File complaintFile = new File(LEDGER_FOLDER + "/" + complaintId + ".json");
            if (!complaintFile.exists()) {
                System.err.println("❌ No blockchain file found for complaint: " + complaintId);
                return false;
            }

            // Load the chain for this complaint
            List<Block> chain = BlockchainUtils.loadComplaintChain(complaintFile);

            // Check integrity block-by-block
            for (int i = 1; i < chain.size(); i++) {
                Block prev = chain.get(i - 1);
                Block curr = chain.get(i);

                // Recalculate current hash and compare
                if (!curr.getHash().equals(curr.calculateHash())) {
                    System.err.println("❌ Hash mismatch at block index " + curr.getIndex());
                    return false;
                }

                // Verify chain linkage
                if (!curr.getPreviousHash().equals(prev.getHash())) {
                    System.err.println("❌ Previous hash mismatch between blocks " + prev.getIndex() + " and " + curr.getIndex());
                    return false;
                }
            }

            System.out.println("✅ Blockchain verified successfully for complaint: " + complaintId);
            return true;

        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("❌ Error verifying blockchain: " + e.getMessage());
            return false;
        }
    }
}
