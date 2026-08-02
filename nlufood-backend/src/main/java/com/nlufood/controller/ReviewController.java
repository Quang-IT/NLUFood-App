package com.nlufood.controller;

import com.nlufood.model.Review;
import com.nlufood.model.Restaurant;
import com.nlufood.repository.ReviewRepository;
import com.nlufood.repository.RestaurantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @GetMapping("/restaurant/{restaurantId}")
    public List<Review> getRestaurantReviews(@PathVariable Long restaurantId) {
        return reviewRepository.findByRestaurantIdOrderByReviewTimeDesc(restaurantId);
    }

    @PostMapping
    public Review addReview(@RequestBody Review review) {
        Review savedReview = reviewRepository.save(review);
        
        // Recalculate and update the restaurant average rating
        if (review.getRestaurant() != null && review.getRestaurant().getId() != null) {
            Long restaurantId = review.getRestaurant().getId();
            List<Review> reviews = reviewRepository.findByRestaurantIdOrderByReviewTimeDesc(restaurantId);
            if (!reviews.isEmpty()) {
                double sum = 0;
                for (Review r : reviews) {
                    sum += r.getRating();
                }
                double avg = sum / reviews.size();
                // Round to 1 decimal place (e.g. 4.7)
                double roundedAvg = Math.round(avg * 10.0) / 10.0;
                
                restaurantRepository.findById(restaurantId).ifPresent(restaurant -> {
                    restaurant.setRating(roundedAvg);
                    restaurantRepository.save(restaurant);
                });
            }
        }
        
        return savedReview;
    }
}
