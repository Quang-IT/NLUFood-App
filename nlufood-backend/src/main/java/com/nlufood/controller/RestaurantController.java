package com.nlufood.controller;

import com.nlufood.model.MenuItem;
import com.nlufood.model.Restaurant;
import com.nlufood.repository.MenuItemRepository;
import com.nlufood.repository.RestaurantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants")
@CrossOrigin(origins = "*")
public class RestaurantController {

    @Autowired
    private RestaurantRepository restaurantRepository;
    
    @Autowired
    private MenuItemRepository menuItemRepository;

    @GetMapping
    public List<Restaurant> getAllRestaurants() {
        return restaurantRepository.findAll();
    }
    
    @GetMapping("/search")
    public List<Restaurant> searchRestaurants(@RequestParam String q) {
        return restaurantRepository.findByNameContainingIgnoreCase(q);
    }
    
    @GetMapping("/{id}")
    public Restaurant getRestaurantById(@PathVariable Long id) {
        return restaurantRepository.findById(id).orElse(null);
    }

    @GetMapping("/{id}/menu")
    public List<MenuItem> getRestaurantMenu(@PathVariable Long id) {
        return menuItemRepository.findByRestaurantId(id);
    }
    
    @GetMapping("/flash-sales")
    public List<MenuItem> getFlashSales() {
        return menuItemRepository.findByIsFlashSaleTrue();
    }
    
    @GetMapping("/owner/{ownerId}")
    public List<Restaurant> getRestaurantsByOwner(@PathVariable Long ownerId) {
        return restaurantRepository.findByOwnerId(ownerId);
    }

    @PostMapping
    public Restaurant createRestaurant(@RequestBody Restaurant restaurant) {
        if (restaurant.getRating() == null) {
            restaurant.setRating(5.0); // default rating for new restaurants
        }
        return restaurantRepository.save(restaurant);
    }

    @PutMapping("/{id}")
    public Restaurant updateRestaurant(@PathVariable Long id, @RequestBody Restaurant updatedRestaurant) {
        return restaurantRepository.findById(id).map(restaurant -> {
            restaurant.setName(updatedRestaurant.getName());
            restaurant.setAddress(updatedRestaurant.getAddress());
            if (updatedRestaurant.getImageUrl() != null && !updatedRestaurant.getImageUrl().isEmpty()) {
                restaurant.setImageUrl(updatedRestaurant.getImageUrl());
            }
            return restaurantRepository.save(restaurant);
        }).orElseThrow(() -> new RuntimeException("Restaurant not found with id " + id));
    }

    @DeleteMapping("/{id}")
    public void deleteRestaurant(@PathVariable Long id) {
        restaurantRepository.deleteById(id);
    }
}
