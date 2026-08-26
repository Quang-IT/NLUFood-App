package com.nlufood.controller;

import com.nlufood.model.ChatMessage;
import com.nlufood.model.Notification;
import com.nlufood.model.Order;
import com.nlufood.model.Restaurant;
import com.nlufood.model.User;
import com.nlufood.repository.ChatMessageRepository;
import com.nlufood.repository.NotificationRepository;
import com.nlufood.repository.OrderRepository;
import com.nlufood.repository.RestaurantRepository;
import com.nlufood.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private OrderRepository orderRepository;

    @GetMapping("/messages")
    public List<ChatMessage> getMessages(
            @RequestParam Long restaurantId,
            @RequestParam Long studentId) {
        return chatMessageRepository.findByRestaurantIdAndStudentIdOrderByTimestampAsc(restaurantId, studentId);
    }

    @PostMapping("/messages")
    public ChatMessage sendMessage(@RequestBody ChatMessage message) {
        if (message.getTimestamp() == null) {
            message.setTimestamp(LocalDateTime.now());
        }
        ChatMessage saved = chatMessageRepository.save(message);

        // Notify recipient
        try {
            if ("STUDENT".equalsIgnoreCase(message.getSenderRole())) {
                // Sender is Student -> Notify Restaurant Owner
                Restaurant restaurant = restaurantRepository.findById(message.getRestaurantId()).orElse(null);
                if (restaurant != null && restaurant.getOwner() != null) {
                    notificationRepository.save(new Notification(
                        restaurant.getOwner().getId(),
                        "Tin nhắn mới từ khách hàng! 💬",
                        message.getSenderName() + ": " + message.getContent()
                    ));
                }
            } else {
                // Sender is Owner -> Notify Student
                Restaurant restaurant = restaurantRepository.findById(message.getRestaurantId()).orElse(null);
                String restName = restaurant != null ? restaurant.getName() : "Quán ăn";
                notificationRepository.save(new Notification(
                    message.getStudentId(),
                    "Tin nhắn mới từ " + restName + " 💬",
                    message.getContent()
                ));
            }
        } catch (Exception e) {
            System.err.println("Error sending chat notification: " + e.getMessage());
        }

        return saved;
    }

    @PutMapping("/read")
    public void markAsRead(
            @RequestParam Long restaurantId,
            @RequestParam Long studentId,
            @RequestParam String readerRole) {
        List<ChatMessage> messages = chatMessageRepository.findByRestaurantIdAndStudentIdOrderByTimestampAsc(restaurantId, studentId);
        for (ChatMessage msg : messages) {
            if (!msg.isRead() && !readerRole.equalsIgnoreCase(msg.getSenderRole())) {
                msg.setRead(true);
                chatMessageRepository.save(msg);
            }
        }
    }

    @GetMapping("/conversations/owner/{ownerId}")
    public List<Map<String, Object>> getOwnerConversations(@PathVariable Long ownerId) {
        List<Restaurant> restaurants = restaurantRepository.findByOwnerId(ownerId);
        if (restaurants.isEmpty()) {
            restaurants = restaurantRepository.findAll();
        }
        List<Map<String, Object>> conversations = new ArrayList<>();
        Set<String> processedKeys = new HashSet<>();

        for (Restaurant rest : restaurants) {
            // 1. Student IDs from existing chat messages
            List<Long> studentIds = new ArrayList<>(chatMessageRepository.findDistinctStudentIdsByRestaurantId(rest.getId()));

            // 2. Student IDs from orders at this restaurant
            try {
                List<Order> restOrders = orderRepository.findByRestaurantId(rest.getId());
                for (Order o : restOrders) {
                    if (o.getStudent() != null && !studentIds.contains(o.getStudent().getId())) {
                        studentIds.add(o.getStudent().getId());
                    }
                }
            } catch (Exception ignored) {}

            for (Long studentId : studentIds) {
                String key = rest.getId() + "_" + studentId;
                if (processedKeys.contains(key)) continue;
                processedKeys.add(key);

                User student = userRepository.findById(studentId).orElse(null);
                List<ChatMessage> msgs = chatMessageRepository.findByRestaurantIdAndStudentIdOrderByTimestampAsc(rest.getId(), studentId);
                ChatMessage lastMsg = msgs.isEmpty() ? null : msgs.get(msgs.size() - 1);
                long unreadCount = msgs.stream().filter(m -> !m.isRead() && "STUDENT".equalsIgnoreCase(m.getSenderRole())).count();

                Map<String, Object> item = new HashMap<>();
                item.put("restaurantId", rest.getId());
                item.put("restaurantName", rest.getName());
                item.put("restaurantImage", rest.getImageUrl());
                item.put("studentId", studentId);
                item.put("studentName", student != null ? student.getName() : "Khách hàng #" + studentId);
                item.put("studentAvatar", student != null ? student.getImageUrl() : null);
                item.put("lastMessage", lastMsg != null ? lastMsg.getContent() : "Khách hàng vừa đặt món tại quán");
                item.put("lastTimestamp", lastMsg != null ? lastMsg.getTimestamp() : LocalDateTime.now().minusHours(1));
                item.put("unreadCount", unreadCount);

                conversations.add(item);
            }
        }

        // Sort by latest message timestamp desc
        conversations.sort((a, b) -> {
            LocalDateTime tA = (LocalDateTime) a.get("lastTimestamp");
            LocalDateTime tB = (LocalDateTime) b.get("lastTimestamp");
            if (tA == null && tB == null) return 0;
            if (tA == null) return 1;
            if (tB == null) return -1;
            return tB.compareTo(tA);
        });

        return conversations;
    }

    @GetMapping("/conversations/student/{studentId}")
    public List<Map<String, Object>> getStudentConversations(@PathVariable Long studentId) {
        List<Long> restaurantIds = chatMessageRepository.findDistinctRestaurantIdsByStudentId(studentId);
        List<Map<String, Object>> conversations = new ArrayList<>();

        for (Long restId : restaurantIds) {
            Restaurant rest = restaurantRepository.findById(restId).orElse(null);
            if (rest == null) continue;

            List<ChatMessage> msgs = chatMessageRepository.findByRestaurantIdAndStudentIdOrderByTimestampAsc(restId, studentId);
            ChatMessage lastMsg = msgs.isEmpty() ? null : msgs.get(msgs.size() - 1);
            long unreadCount = msgs.stream().filter(m -> !m.isRead() && "OWNER".equalsIgnoreCase(m.getSenderRole())).count();

            Map<String, Object> item = new HashMap<>();
            item.put("restaurantId", rest.getId());
            item.put("restaurantName", rest.getName());
            item.put("restaurantImage", rest.getImageUrl());
            item.put("studentId", studentId);
            item.put("lastMessage", lastMsg != null ? lastMsg.getContent() : "");
            item.put("lastTimestamp", lastMsg != null ? lastMsg.getTimestamp() : null);
            item.put("unreadCount", unreadCount);

            conversations.add(item);
        }

        conversations.sort((a, b) -> {
            LocalDateTime tA = (LocalDateTime) a.get("lastTimestamp");
            LocalDateTime tB = (LocalDateTime) b.get("lastTimestamp");
            if (tA == null && tB == null) return 0;
            if (tA == null) return 1;
            if (tB == null) return -1;
            return tB.compareTo(tA);
        });

        return conversations;
    }
}

