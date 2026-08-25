package com.nlufood.config;

import com.nlufood.model.PromoCode;
import com.nlufood.model.Notification;
import com.nlufood.model.User;
import com.nlufood.model.Restaurant;
import com.nlufood.model.MenuItem;
import com.nlufood.model.SavedVoucher;
import com.nlufood.model.Review;
import com.nlufood.model.Order;
import com.nlufood.model.OrderItem;
import com.nlufood.repository.PromoCodeRepository;
import com.nlufood.repository.NotificationRepository;
import com.nlufood.repository.UserRepository;
import com.nlufood.repository.RestaurantRepository;
import com.nlufood.repository.MenuItemRepository;
import com.nlufood.repository.SavedVoucherRepository;
import com.nlufood.repository.ReviewRepository;
import com.nlufood.repository.OrderRepository;
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

    @Autowired
    private SavedVoucherRepository savedVoucherRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Override
    public void run(String... args) throws Exception {
        seedUsers();
        seedPromoCodes();
        seedRestaurantsAndMenuItems();
        seedNotifications();
        seedSavedVouchers();
        seedReviews();
        seedOrders();
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
            student.setGender("Nam");
            student.setMembershipTier("GOLD");
            userRepository.save(student);
        }

        if (userRepository.findByEmail("student2@nlu.edu.vn").isEmpty()) {
            User student2 = new User();
            student2.setName("Lê Thị B (Sinh viên)");
            student2.setEmail("student2@nlu.edu.vn");
            student2.setPassword("123");
            student2.setRole("STUDENT");
            student2.setPhoneNumber("0911223344");
            student2.setAddress("Ký túc xá B, ĐH Nông Lâm");
            student2.setBirthYear(2004);
            student2.setGender("Nữ");
            student2.setMembershipTier("SILVER");
            userRepository.save(student2);
        }

        if (userRepository.findByEmail("nam.nguyen@nlu.edu.vn").isEmpty()) {
            User student3 = new User();
            student3.setName("Trần Hoàng Nam");
            student3.setEmail("nam.nguyen@nlu.edu.vn");
            student3.setPassword("123");
            student3.setRole("STUDENT");
            student3.setPhoneNumber("0933445566");
            student3.setAddress("Giảng đường K, ĐH Nông Lâm");
            student3.setBirthYear(2002);
            student3.setGender("Nam");
            student3.setMembershipTier("DIAMOND");
            userRepository.save(student3);
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

        if (userRepository.findByEmail("trasua@nlu.edu.vn").isEmpty()) {
            User owner2 = new User();
            owner2.setName("Chủ Quán Trà Sữa Nông Lâm");
            owner2.setEmail("trasua@nlu.edu.vn");
            owner2.setPassword("123");
            owner2.setRole("OWNER");
            owner2.setPhoneNumber("0977889900");
            owner2.setAddress("Đường số 8, Linh Trung, Thủ Đức");
            userRepository.save(owner2);
        }
        System.out.println(">> Seeded rich user accounts successfully.");
    }

    private void seedPromoCodes() {
        if (promoCodeRepository.count() == 0) {
            promoCodeRepository.saveAll(List.of(
                new PromoCode("NLUSTUDENT", "Mã giảm giá 20,000đ dành riêng cho sinh viên Nông Lâm", "FLAT", 20000, 50000, 0, LocalDateTime.now().plusDays(30)),
                new PromoCode("FOOD50", "Giảm giá 50% tối đa 30,000đ cho mọi đơn hàng", "PERCENTAGE", 50, 60000, 30000, LocalDateTime.now().plusDays(15)),
                new PromoCode("FREESHIP", "Miễn phí vận chuyển 15,000đ cho đơn hàng từ 30,000đ", "FLAT", 15000, 30000, 0, LocalDateTime.now().plusDays(45)),
                new PromoCode("VOUCHER10K", "Giảm ngay 10,000đ không yêu cầu giá trị tối thiểu", "FLAT", 10000, 0, 0, LocalDateTime.now().plusDays(10)),
                new PromoCode("NLUVIPPRO", "Đặc quyền NLU VIP Pro giảm 35,000đ đơn từ 70,000đ", "FLAT", 35000, 70000, 0, LocalDateTime.now().plusDays(60))
            ));
            System.out.println(">> Seeded 5 PromoCodes successfully.");
        }
    }

    private void seedSavedVouchers() {
        userRepository.findByEmail("student@hcmuaf.edu.vn").ifPresent(student -> {
            if (savedVoucherRepository.findByUserId(student.getId()).isEmpty()) {
                promoCodeRepository.findByCodeIgnoreCase("NLUSTUDENT").ifPresent(p1 -> savedVoucherRepository.save(new SavedVoucher(student, p1)));
                promoCodeRepository.findByCodeIgnoreCase("FREESHIP").ifPresent(p2 -> savedVoucherRepository.save(new SavedVoucher(student, p2)));
                promoCodeRepository.findByCodeIgnoreCase("FOOD50").ifPresent(p3 -> savedVoucherRepository.save(new SavedVoucher(student, p3)));
                System.out.println(">> Seeded saved vouchers for student.");
            }
        });
    }

    private void seedRestaurantsAndMenuItems() {
        if (restaurantRepository.count() == 0) {
            User owner1 = userRepository.findByEmail("owner@hcmuaf.edu.vn").orElse(null);
            User owner2 = userRepository.findByEmail("trasua@nlu.edu.vn").orElse(null);

            Restaurant r1 = new Restaurant(null, "Cơm Tấm Nông Lâm 🥩", "Khu phố 6, P. Linh Trung, TP. Thủ Đức", 4.8, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", owner1);
            Restaurant r2 = new Restaurant(null, "Bún Bò Huế & Phở Sinh Viên 🍜", "Cổng Phụ KTX A Nông Lâm", 4.7, "https://images.unsplash.com/photo-1569718212165-3a8278d5f624", owner1);
            Restaurant r3 = new Restaurant(null, "Trà Sữa Cổng Trường NLU 🧋", "Đường số 8, KTX B Nông Lâm", 4.9, "https://images.unsplash.com/photo-1551024709-8f23befc6f87", owner2);
            Restaurant r4 = new Restaurant(null, "Gà Rán & Bánh Mì KTX A 🍔", "Cổng chính KTX A Nông Lâm", 4.6, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", owner2);
            Restaurant r5 = new Restaurant(null, "Chè Thái & Ăn Vặt Nông Lâm 🍧", "Đường Z1, KTX B Nông Lâm", 4.8, "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0", owner2);

            restaurantRepository.saveAll(List.of(r1, r2, r3, r4, r5));

            menuItemRepository.saveAll(List.of(
                // Cơm Tấm Nông Lâm
                new MenuItem(null, "Cơm sườn bì chả nướng đặc biệt", 35000.0, 40000.0, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", "Cơm", true, r1),
                new MenuItem(null, "Cơm gà chiên mắm tỏi thơm lừng", 38000.0, 42000.0, "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b", "Cơm", true, r1),
                new MenuItem(null, "Cơm sườn nướng mỡ hành", 32000.0, 36000.0, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", "Cơm", true, r1),
                new MenuItem(null, "Canh khổ qua dồn thịt", 12000.0, 15000.0, "https://images.unsplash.com/photo-1547592180-85f173990554", "Cơm", true, r1),

                // Bún Bò Huế
                new MenuItem(null, "Bún bò Huế giò heo đặc biệt", 40000.0, 45000.0, "https://images.unsplash.com/photo-1569718212165-3a8278d5f624", "Món nước", true, r2),
                new MenuItem(null, "Phở bò tái nạm bò viên", 42000.0, 48000.0, "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43", "Món nước", true, r2),
                new MenuItem(null, "Hủ tiếu Nam Vang tôm mực", 38000.0, 42000.0, "https://images.unsplash.com/photo-1569718212165-3a8278d5f624", "Món nước", true, r2),

                // Trà Sữa
                new MenuItem(null, "Trà sữa trân châu đường đen NLU", 25000.0, 30000.0, "https://images.unsplash.com/photo-1551024709-8f23befc6f87", "Đồ uống", true, r3),
                new MenuItem(null, "Trà đào cam sả thanh nhiệt", 22000.0, 25000.0, "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd", "Đồ uống", true, r3),
                new MenuItem(null, "Trà tắc xí muội giải khát", 18000.0, 20000.0, "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd", "Đồ uống", true, r3),
                new MenuItem(null, "Sữa tươi trân châu đường đen", 28000.0, 32000.0, "https://images.unsplash.com/photo-1551024709-8f23befc6f87", "Đồ uống", true, r3),

                // Gà Rán & Bánh Mì
                new MenuItem(null, "Combo Gà Rán sốt cay Hàn Quốc", 45000.0, 50000.0, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", "Ăn vặt", true, r4),
                new MenuItem(null, "Bánh mì ốp la xíu mại giòn rụm", 20000.0, 22000.0, "https://images.unsplash.com/photo-1509722747041-616f39b57569", "Ăn vặt", true, r4),
                new MenuItem(null, "Khoai tây chiên lắc phô mai", 20000.0, 25000.0, "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0", "Ăn vặt", true, r4),

                // Chè Thái & Ăn Vặt
                new MenuItem(null, "Chè Thái sầu riêng sương sáo", 25000.0, 30000.0, "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0", "Ăn vặt", true, r5),
                new MenuItem(null, "Bánh rán Doraemon lắc phô mai", 18000.0, 20000.0, "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0", "Ăn vặt", true, r5),
                new MenuItem(null, "Bún đậu mắm tôm thập cẩm", 45000.0, 50000.0, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", "Món nước", true, r5)
            ));

            System.out.println(">> Seeded 5 Restaurants and 17 MenuItems successfully.");
        }
    }

    private void seedNotifications() {
        userRepository.findByEmail("student@hcmuaf.edu.vn").ifPresent(student -> {
            Long studentId = student.getId();
            if (notificationRepository.findByUserIdOrderByCreatedTimeDesc(studentId).isEmpty()) {
                notificationRepository.save(new Notification(studentId, "Chào mừng đến với NLUFood! 🎉", "Chúc mừng bạn đã gia nhập NLUFood - Ứng dụng đặt đồ ăn nhanh chóng, tiện lợi nhất dành cho sinh viên Nông Lâm!"));
                notificationRepository.save(new Notification(studentId, "Khuyến mãi chào bạn mới! 🎁", "Nhập ngay mã 'NLUSTUDENT' khi thanh toán để giảm 20,000đ cho đơn hàng từ 50,000đ nhé!"));
                notificationRepository.save(new Notification(studentId, "Đơn hàng của bạn đã hoàn thành 🛵", "Đơn hàng #101 tại 'Cơm Tấm Nông Lâm' đã giao thành công. Chúc bạn ngon miệng!"));
            }
        });
    }

    private void seedReviews() {
        if (reviewRepository.count() == 0) {
            User student = userRepository.findByEmail("student@hcmuaf.edu.vn").orElse(null);
            restaurantRepository.findAll().forEach(r -> {
                reviewRepository.save(new Review(null, "Món ăn rất ngon, giao hàng siêu nhanh chỉ trong 15 phút KTX A!", 5, student, r));
                reviewRepository.save(new Review(null, "Đồ ăn nêm nếm vừa vị sinh viên, giá hợp lý!", 4, student, r));
            });
        }
    }

    private void seedOrders() {
        if (orderRepository.count() == 0) {
            User student = userRepository.findByEmail("student@hcmuaf.edu.vn").orElse(null);
            Restaurant r1 = restaurantRepository.findAll().get(0);
            Restaurant r2 = restaurantRepository.findAll().get(2);

            if (student != null && r1 != null) {
                // Completed Order
                Order o1 = new Order();
                o1.setStudent(student);
                o1.setRestaurant(r1);
                o1.setStatus("COMPLETED");
                o1.setTotalPrice(70000.0);
                o1.setOrderTime(LocalDateTime.now().minusDays(1));
                o1.setPaymentMethod("Ví MoMo");
                o1.setDriverName("Nguyễn Văn Hùng (Shipper NLU)");
                o1.setDriverPhone("0988 123 456");
                o1.setDriverLicensePlate("59-X1 678.90");
                orderRepository.save(o1);

                // Delivering Order
                Order o2 = new Order();
                o2.setStudent(student);
                o2.setRestaurant(r2);
                o2.setStatus("DELIVERING");
                o2.setTotalPrice(47000.0);
                o2.setOrderTime(LocalDateTime.now().minusMinutes(20));
                o2.setPaymentMethod("Tiền mặt");
                o2.setDriverName("Nguyễn Văn Hùng (Shipper NLU)");
                o2.setDriverPhone("0988 123 456");
                o2.setDriverLicensePlate("59-X1 678.90");
                orderRepository.save(o2);

                System.out.println(">> Seeded sample orders with driver details successfully.");
            }
        }
    }
}
