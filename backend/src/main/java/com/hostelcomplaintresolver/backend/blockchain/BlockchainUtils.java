package com.hostelcomplaintresolver.backend.blockchain;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class BlockchainUtils {

    private static final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    /**
     * ✅ Loads the blockchain (list of blocks) from a JSON file for a complaint.
     */
    public static synchronized List<Block> loadComplaintChain(File complaintFile) {
        try {
            if (!complaintFile.exists()) {
                return new ArrayList<>();
            }
            Block[] blocks = objectMapper.readValue(complaintFile, Block[].class);
            return new ArrayList<>(Arrays.asList(blocks));
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error reading complaint blockchain file: " + complaintFile.getName(), e);
        }
    }

    /**
     * ✅ Saves the updated blockchain (list of blocks) to the JSON file.
     */
    public static synchronized void saveComplaintChain(File complaintFile, List<Block> chain) {
        try {
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(complaintFile, chain);
            System.out.println("🧾 Blockchain file updated: " + complaintFile.getName());
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error saving blockchain file: " + complaintFile.getName(), e);
        }
    }
}
