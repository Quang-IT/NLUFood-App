package com.nlufood.config;

import com.nlufood.model.PromoCode;
import com.nlufood.model.Notification;
import com.nlufood.model.User;
import com.nlufood.model.Restaurant;
import com.nlufood.model.MenuItem;
import com.nlufood.repository.PromoCodeRepository;
import com.nlufood.repository.NotificationRepository;
import com.nlufood.repository.UserRepository;
import com.nlufood.repository.RestaurantRepository;
import com.nlufood.repository.MenuItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private PromoCodeRepository promoCodeRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Override
    public void run(String... args) throws Exception {
        seedUsers();
        seedPromoCodes();
        seedRestaurantsAndMenuItems();
        seedNotifications();
        migrateCategories();
    }

    private void seedUsers() {
        if (userRepository.findByEmail("student@hcmuaf.edu.vn").isEmpty()) {
            User student = new User();
            student.setName("Nguyễn Văn A (Sinh viên)");
            student.setEmail("student@hcmuaf.edu.vn");
            student.setPassword("123");
            student.setRole("STUDENT");
            student.setPhoneNumber("0912345678");
            student.setAddress("Ký túc xá A, ĐH Nông Lâm");
            student.setBirthYear(2003);
            userRepository.save(student);
        }

        if (userRepository.findByEmail("student@nlu.edu.vn").isEmpty()) {
            User student2 = new User();
            student2.setName("Lê Thị B (Sinh viên)");
            student2.setEmail("student@nlu.edu.vn");
            student2.setPassword("123");
            student2.setRole("STUDENT");
            student2.setPhoneNumber("0911223344");
            student2.setAddress("Ký túc xá B, ĐH Nông Lâm");
            student2.setBirthYear(2004);
            userRepository.save(student2);
        }

        if (userRepository.findByEmail("owner@hcmuaf.edu.vn").isEmpty()) {
            User owner = new User();
            owner.setName("Chủ Quán Cơm Tấm Nông Lâm");
            owner.setEmail("owner@hcmuaf.edu.vn");
            owner.setPassword("123");
            owner.setRole("OWNER");
            owner.setPhoneNumber("0987654321");
            owner.setAddress("Khu phố 6, Linh Trung, Thủ Đức");
            userRepository.save(owner);
        }
        System.out.println(">> Seeded default user accounts successfully.");
    }

    private void seedPromoCodes() {
        if (promoCodeRepository.count() == 0) {
            promoCodeRepository.saveAll(List.of(
                new PromoCode("NLUSTUDENT", "Mã giảm giá 20,000đ dành riêng cho sinh viên Nông Lâm", "FLAT", 20000, 50000, 0, LocalDateTime.now().plusDays(30)),
                new PromoCode("FOOD50", "Giảm giá 50% tối đa 30,000đ cho mọi đơn hàng", "PERCENTAGE", 50, 60000, 30000, LocalDateTime.now().plusDays(15)),
                new PromoCode("FREESHIP", "Miễn phí vận chuyển 15,000đ cho đơn hàng từ 30,000đ", "FLAT", 15000, 30000, 0, LocalDateTime.now().plusDays(45)),
                new PromoCode("VOUCHER10K", "Giảm ngay 10,000đ không yêu cầu giá trị tối thiểu", "FLAT", 10000, 0, 0, LocalDateTime.now().plusDays(10))
            ));
            System.out.println(">> Seeded 4 default PromoCodes successfully.");
        }
    }

    private void seedRestaurantsAndMenuItems() {
        if (restaurantRepository.count() == 0) {
            User owner = userRepository.findByEmail("owner@hcmuaf.edu.vn").orElse(null);

            Restaurant r1 = new Restaurant(null, "Cơm Tấm Nông Lâm", "Khu phố 6, P. Linh Trung, TP. Thủ Đức", 4.8, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", owner);
            Restaurant r2 = new Restaurant(null, "Bún Bò Huế ĐH Nông Lâm", "Cổng Phụ KTX A Nông Lâm", 4.6, "https://images.unsplash.com/photo-1569718212165-3a8278d5f624", owner);
            Restaurant r3 = new Restaurant(null, "Trà Sữa Sinh Viên", "Đường số 8, KTX B Nông Lâm", 4.9, "https://images.unsplash.com/photo-1551024709-8f23befc6f87", owner);

            restaurantRepository.saveAll(List.of(r1, r2, r3));

            menuItemRepository.saveAll(List.of(
                new MenuItem(null, "Cơm sườn bì chả", 35000.0, 40000.0, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", "Cơm", true, r1),
                new MenuItem(null, "Cơm gà chiên mắm", 38000.0, 42000.0, "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b", "Cơm", false, r1),
                new MenuItem(null, "Bún bò đặc biệt", 40000.0, 45000.0, "https://images.unsplash.com/photo-1569718212165-3a8278d5f624", "Món nước", true, r2),
                new MenuItem(null, "Phở bò tái nạm", 42000.0, 48000.0, "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43", "Món nước", false, r2),
                new MenuItem(null, "Trà sữa trân châu đường đen", 25000.0, 30000.0, "https://images.unsplash.com/photo-1551024709-8f23befc6f87", "Đồ uống", true, r3),
                new MenuItem(null, "Trà đào cam sả", 22000.0, 25000.0, "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd", "Đồ uống", false, r3),
                new MenuItem(null, "Bánh rán lắc phô mai", 18000.0, 20000.0, "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0", "Ăn vặt", false, r3)
            ));

            System.out.println(">> Seeded default Restaurants and MenuItems successfully.");
        }
    }

    private void seedNotifications() {
        userRepository.findByEmail("student@hcmuaf.edu.vn").ifPresent(student -> {
            Long studentId = student.getId();
            if (notificationRepository.findByUserIdOrderByCreatedTimeDesc(studentId).isEmpty()) {
                notificationRepository.save(new Notification(studentId, "Chào mừng đến với NLUFood! 🎉", "Chúc mừng bạn đã gia nhập NLUFood - Ứng dụng đặt đồ ăn nhanh chóng, tiện lợi nhất dành cho sinh viên Nông Lâm. Rất nhiều ưu đãi đang chờ bạn khám phá!"));
                notificationRepository.save(new Notification(studentId, "Khuyến mãi chào bạn mới! 🎁", "Nhập ngay mã khuyến mãi 'NLUSTUDENT' khi thanh toán để được giảm ngay 20,000đ cho đơn hàng đầu tiên của bạn từ 50,000đ nhé!"));
                notificationRepository.save(new Notification(studentId, "Đơn hàng của bạn đã hoàn thành 🛵", "Đơn hàng #3829 tại 'Cơm Tấm Nông Lâm' đã được giao thành công. Chúc bạn ngon miệng!"));
                System.out.println(">> Seeded 3 default notifications for student user ID: " + studentId);
            }
        });
    }

    private void migrateCategories() {
        List<MenuItem> items = menuItemRepository.findAll();
        boolean changed = false;
        for (MenuItem item : items) {
            String oldCat = item.getCategory();
            if (oldCat == null) continue;
            String newCat = null;
            if (oldCat.equalsIgnoreCase("Rice") || oldCat.equalsIgnoreCase("Cơm tấm") || oldCat.equalsIgnoreCase("cơm")) {
                newCat = "Cơm";
            } else if (oldCat.equalsIgnoreCase("Noodles") || oldCat.equalsIgnoreCase("bún/phở") || oldCat.equalsIgnoreCase("bún")) {
                newCat = "Món nước";
            } else if (oldCat.equalsIgnoreCase("Drinks") || oldCat.equalsIgnoreCase("nước uống") || oldCat.equalsIgnoreCase("đồ uống")) {
                newCat = "Đồ uống";
            } else if (oldCat.equalsIgnoreCase("Snacks") || oldCat.equalsIgnoreCase("Fast Food") || oldCat.equalsIgnoreCase("Tráng miệng") || oldCat.equalsIgnoreCase("ăn vặt")) {
                newCat = "Ăn vặt";
            }
            
            if (newCat != null && !newCat.equals(oldCat)) {
                item.setCategory(newCat);
                menuItemRepository.save(item);
                changed = true;
            }
        }
        if (changed) {
            System.out.println(">> Migrated menu item categories to unified Vietnamese successfully.");
        }
    }
}
