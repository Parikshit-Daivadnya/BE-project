package com.hostelcomplaintresolver.backend.blockchain;

import java.time.LocalDateTime;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class Block {

    private int index;
    private LocalDateTime timestamp;
    private List<Transaction> transactions;
    private String previousHash;
    private String hash;

    public Block() {}

    // ✅ Constructor for single transaction
    public Block(int index, String previousHash, Transaction transaction) {
        this.index = index;
        this.timestamp = LocalDateTime.now();
        this.transactions = Collections.singletonList(transaction);
        this.previousHash = previousHash;
        this.hash = calculateHash();
    }

    // ✅ SHA-256 Hash Calculation
    public String calculateHash() {
        try {
            String dataToHash = index + previousHash +
                    transactions.stream()
                            .map(t -> t.getTransactionId() + t.getAction() + t.getDescription())
                            .collect(Collectors.joining()) +
                    timestamp.toString(); // consistent ISO format

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(dataToHash.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                hexString.append(String.format("%02x", b));
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error generating hash", e);
        }
    }


    // ✅ Getters & Setters
    public int getIndex() { return index; }
    public void setIndex(int index) { this.index = index; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public List<Transaction> getTransactions() { return transactions; }
    public void setTransactions(List<Transaction> transactions) { this.transactions = transactions; }

    public String getPreviousHash() { return previousHash; }
    public void setPreviousHash(String previousHash) { this.previousHash = previousHash; }

    public String getHash() { return hash; }
    public void setHash(String hash) { this.hash = hash; }

    @Override
    public String toString() {
        return "Block{" +
                "index=" + index +
                ", timestamp=" + timestamp +
                ", previousHash='" + previousHash + '\'' +
                ", hash='" + hash + '\'' +
                ", transactions=" + transactions +
                '}';
    }
}
