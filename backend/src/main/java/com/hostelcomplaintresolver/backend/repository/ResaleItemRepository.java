package com.hostelcomplaintresolver.backend.repository;

import com.hostelcomplaintresolver.backend.model.ResaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResaleItemRepository extends JpaRepository<ResaleItem, Long> {

    // Custom query method to find items that are NOT sold, ordered by date
    List<ResaleItem> findByIsSoldFalseOrderByPostedDateDesc();
}
