package com.nlufood.repository;

import com.nlufood.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByRestaurantId(Long restaurantId);
    List<MenuItem> findByIsFlashSaleTrue();
    List<MenuItem> findByNameContainingIgnoreCase(String name);
    List<MenuItem> findByNameContainingIgnoreCaseOrCategoryContainingIgnoreCase(String name, String category);
}
