package com.hostelcomplaintresolver.backend.service;

import com.hostelcomplaintresolver.backend.model.ResaleItem;
import com.hostelcomplaintresolver.backend.repository.ResaleItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ResaleService {

    @Autowired
    private ResaleItemRepository repository;

    private static final String UPLOAD_DIR = "uploads/resale/";

    // ✅ This is the method your Controller is trying to call
    public ResaleItem postItem(String name, Double price, String category, String description,
                               String ownerName, String ownerContact, MultipartFile image) throws IOException {

        ResaleItem item = new ResaleItem();
        item.setName(name);
        item.setPrice(price);
        item.setCategory(category);
        item.setDescription(description);
        item.setOwnerName(ownerName);
        item.setOwnerContact(ownerContact);
        item.setPostedDate(LocalDateTime.now());
        item.setSold(false);

        if (image != null && !image.isEmpty()) {
            String fileName = "resale_" + UUID.randomUUID() + ".jpg";
            Path uploadPath = Paths.get(UPLOAD_DIR);

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Files.copy(image.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            item.setImageUrl("/" + UPLOAD_DIR + fileName);
        } else {
            throw new IllegalArgumentException("Item image is mandatory.");
        }

        return repository.save(item);
    }

    public List<ResaleItem> getAllActiveItems() {
        return repository.findByIsSoldFalseOrderByPostedDateDesc();
    }

    public void markAsSold(Long itemId) {
        ResaleItem item = repository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        item.setSold(true);
        repository.save(item);
    }
}