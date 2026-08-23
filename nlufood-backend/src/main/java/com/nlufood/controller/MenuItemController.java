package com.nlufood.controller;

import com.nlufood.model.MenuItem;
import com.nlufood.repository.MenuItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu-items")
@CrossOrigin(origins = "*")
public class MenuItemController {

    @Autowired
    private MenuItemRepository menuItemRepository;

    @PostMapping
    public MenuItem createMenuItem(@RequestBody MenuItem item) {
        return menuItemRepository.save(item);
    }

    @PutMapping("/{id}")
    public MenuItem updateMenuItem(@PathVariable Long id, @RequestBody MenuItem updatedItem) {
        return menuItemRepository.findById(id).map(item -> {
            item.setName(updatedItem.getName());
            item.setPrice(updatedItem.getPrice());
            item.setOriginalPrice(updatedItem.getOriginalPrice());
            item.setImageUrl(updatedItem.getImageUrl());
            item.setCategory(updatedItem.getCategory());
            item.setIsFlashSale(updatedItem.getIsFlashSale());
            return menuItemRepository.save(item);
        }).orElseThrow(() -> new RuntimeException("MenuItem not found"));
    }

    @DeleteMapping("/{id}")
    public void deleteMenuItem(@PathVariable Long id) {
        menuItemRepository.deleteById(id);
    }

    @GetMapping("/search")
    public List<MenuItem> searchMenuItems(@RequestParam String q) {
        String mappedCategory = q;
        if (q.equalsIgnoreCase("cơm") || q.equalsIgnoreCase("rice")) mappedCategory = "Cơm";
        else if (q.equalsIgnoreCase("nước uống") || q.equalsIgnoreCase("nước") || q.equalsIgnoreCase("đồ uống") || q.equalsIgnoreCase("drinks") || q.equalsIgnoreCase("local_cafe")) mappedCategory = "Đồ uống";
        else if (q.equalsIgnoreCase("bún") || q.equalsIgnoreCase("phở") || q.equalsIgnoreCase("mì") || q.equalsIgnoreCase("món nước") || q.equalsIgnoreCase("noodles")) mappedCategory = "Món nước";
        else if (q.equalsIgnoreCase("ăn vặt") || q.equalsIgnoreCase("tráng miệng") || q.equalsIgnoreCase("fast food") || q.equalsIgnoreCase("snacks")) mappedCategory = "Ăn vặt";
        
        return menuItemRepository.findByNameContainingIgnoreCaseOrCategoryContainingIgnoreCase(q, mappedCategory);
    }
}
