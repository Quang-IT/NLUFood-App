package com.nlufood.config;

import com.nlufood.model.*;
import com.nlufood.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired private PromoCodeRepository promoCodeRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private RestaurantRepository restaurantRepository;
    @Autowired private MenuItemRepository menuItemRepository;
    @Autowired private SavedVoucherRepository savedVoucherRepository;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private VipPackageRepository vipPackageRepository;
    @Autowired private UserViolationRepository userViolationRepository;
    @Autowired private FavoriteRepository favoriteRepository;
    @Autowired private AddressRepository addressRepository;
    @Autowired private SystemSettingRepository systemSettingRepository;

    @Override
    public void run(String... args) throws Exception {
        seedUsers();
        seedPromoCodes();
        seedRestaurantsAndMenuItems();
        seedVipPackages();
        seedNotifications();
        seedSavedVouchers();
        seedReviews();
        seedOrders();
        seedViolations();
        seedAddresses();
        seedFavorites();
        seedSystemSettings();
    }

    private void seedUsers() {
        if (userRepository.findByEmail("admin@hcmuaf.edu.vn").isEmpty()) {
            User admin = new User(null, "Quản Trị Viên NLUFood (Admin)", "admin@hcmuaf.edu.vn", "123", "ADMIN", "https://images.unsplash.com/photo-1534528741775-53994a69daeb", "Phòng Công Nghệ Thông Tin - ĐH Nông Lâm", "0900000000", 1995, "Nam", "DIAMOND", "ACTIVE");
            userRepository.save(admin);
        }

        String[] ownerEmails = {"owner@hcmuaf.edu.vn", "trasua@nlu.edu.vn", "bunbo@nlu.edu.vn", "garan@nlu.edu.vn"};
        String[] ownerNames = {"Chủ Quán Cơm Tấm Nông Lâm", "Chủ Quán Trà Sữa Cổng NLU", "Chủ Quán Bún Bò KTX A", "Chủ Quán Gà Rán KTX B"};
        for (int i = 0; i < ownerEmails.length; i++) {
            if (userRepository.findByEmail(ownerEmails[i]).isEmpty()) {
                User owner = new User(null, ownerNames[i], ownerEmails[i], "123", "OWNER", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d", "Linh Trung, Thủ Đức", "098765432" + i, 1985 + i, "Nam", "NORMAL", "ACTIVE");
                userRepository.save(owner);
            }
        }

        String[] studentNames = {
            "Nguyễn Văn A (Sinh viên)", "Lê Thị B (Sinh viên)", "Trần Hoàng Nam", "Phạm Minh Tuấn",
            "Đặng Thu Thảo", "Vũ Hoàng Long", "Ngô Bích Phương", "Bùi Anh Tuấn",
            "Đỗ Thị Mai", "Hoàng Văn Thái", "Lý Thanh Hà", "Dương Minh Trí",
            "Nguyễn Thị Hương", "Trịnh Quốc Bảo", "Hồ Phương Thảo", "Phan Gia Huy"
        };
        String[] tiers = {"NORMAL", "SILVER", "GOLD", "DIAMOND"};

        for (int i = 0; i < studentNames.length; i++) {
            String email = (i == 0) ? "student@hcmuaf.edu.vn" : ((i == 1) ? "student2@nlu.edu.vn" : "student" + (i + 1) + "@nlu.edu.vn");
            if (userRepository.findByEmail(email).isEmpty()) {
                String gender = (i % 2 == 0) ? "Nam" : "Nữ";
                String address = (i % 2 == 0) ? "KTX A, ĐH Nông Lâm" : "KTX B, ĐH Nông Lâm";
                User student = new User(null, studentNames[i], email, "123", "STUDENT", "https://images.unsplash.com/photo-1494790108377-be9c29b29330", address, "09123456" + (i < 10 ? "0" + i : i), 2002 + (i % 3), gender, tiers[i % 4], (i == 15 ? "BANNED" : "ACTIVE"));
                userRepository.save(student);
            }
        }
        System.out.println(">> Seeded User accounts successfully.");
    }

    private void seedPromoCodes() {
        List<PromoCode> promos = List.of(
            new PromoCode("NLUSTUDENT", "Giảm ngay 20,000đ cho sinh viên NLU", "FLAT", 20000, 50000, 0, LocalDateTime.now().plusDays(30)),
            new PromoCode("FOOD50", "Giảm 50% tối đa 30,000đ", "PERCENTAGE", 50, 60000, 30000, LocalDateTime.now().plusDays(15)),
            new PromoCode("FREESHIP", "Miễn phí vận chuyển 15,000đ", "FLAT", 15000, 30000, 0, LocalDateTime.now().plusDays(45)),
            new PromoCode("VOUCHER10K", "Giảm ngay 10,000đ mọi đơn", "FLAT", 10000, 0, 0, LocalDateTime.now().plusDays(10)),
            new PromoCode("NLUVIPPRO", "Đặc quyền NLU VIP Pro giảm 35k", "FLAT", 35000, 70000, 0, LocalDateTime.now().plusDays(60)),
            new PromoCode("LUNCH20", "Ưu đãi ăn trưa KTX giảm 20%", "PERCENTAGE", 20, 40000, 20000, LocalDateTime.now().plusDays(20)),
            new PromoCode("NIGHT30", "Ăn đêm KTX B giảm 30k", "FLAT", 30000, 80000, 0, LocalDateTime.now().plusDays(25)),
            new PromoCode("MILKTEA15", "Giảm 15k cho Trà sữa NLU", "FLAT", 15000, 35000, 0, LocalDateTime.now().plusDays(30)),
            new PromoCode("FREESHIPVIP", "Freeship thần tốc 20k", "FLAT", 20000, 40000, 0, LocalDateTime.now().plusDays(50)),
            new PromoCode("BIGDEAL50", "Giảm 50k đơn từ 150k", "FLAT", 50000, 150000, 0, LocalDateTime.now().plusDays(15)),
            new PromoCode("DEAL1K", "Đồng giá 1k món thứ 2", "FLAT", 15000, 30000, 0, LocalDateTime.now().plusDays(5)),
            new PromoCode("TUESDAY30", "Thứ ba vui vẻ giảm 30%", "PERCENTAGE", 30, 50000, 25000, LocalDateTime.now().plusDays(12)),
            new PromoCode("COMBOFOOD", "Giảm 25k khi mua Combo", "FLAT", 25000, 60000, 0, LocalDateTime.now().plusDays(18)),
            new PromoCode("NLUFRIENDS", "Đi nhóm 4 người giảm 40k", "FLAT", 40000, 100000, 0, LocalDateTime.now().plusDays(40)),
            new PromoCode("SNACK10", "Giảm 10k đồ ăn vặt", "FLAT", 10000, 25000, 0, LocalDateTime.now().plusDays(30)),
            new PromoCode("EXAMBOOST", "Tăng lực mùa thi giảm 15%", "PERCENTAGE", 15, 30000, 15000, LocalDateTime.now().plusDays(22)),
            new PromoCode("WEEKEND25", "Cuối tuần xả hơi giảm 25k", "FLAT", 25000, 55000, 0, LocalDateTime.now().plusDays(14)),
            new PromoCode("PAYMOMO", "Thanh toán MoMo giảm 15%", "PERCENTAGE", 15, 50000, 20000, LocalDateTime.now().plusDays(30)),
            new PromoCode("ZALOPAY10", "ZaloPay giảm 10k", "FLAT", 10000, 30000, 0, LocalDateTime.now().plusDays(30)),
            new PromoCode("SUPERVIP100", "Siêu VIP giảm 100k đơn từ 300k", "FLAT", 100000, 300000, 0, LocalDateTime.now().plusDays(90))
        );

        for (PromoCode p : promos) {
            if (promoCodeRepository.findByCodeIgnoreCase(p.getCode()).isEmpty()) {
                promoCodeRepository.save(p);
            }
        }
        System.out.println(">> Seeded PromoCodes safely.");
    }

    private void seedRestaurantsAndMenuItems() {
        if (restaurantRepository.count() < 20) {
            User owner1 = userRepository.findByEmail("owner@hcmuaf.edu.vn").orElse(null);
            User owner2 = userRepository.findByEmail("trasua@nlu.edu.vn").orElse(null);

            String[] names = {
                "Cơm Tấm Nông Lâm 🥩", "Bún Bò Huế & Phở Sinh Viên 🍜", "Trà Sữa Cổng Trường NLU 🧋",
                "Gà Rán & Bánh Mì KTX A 🍔", "Chè Thái & Ăn Vặt Nông Lâm 🍧", "Bún Đậu Mắm Tôm KTX B 🍢",
                "Cơm Gà Xối Mỡ Linh Trung 🍗", "Cà Phê Muối Nông Lâm ☕", "Hủ Tiếu Nam Vang Cô Ba 🍜",
                "Mì Cay 7 Cấp Độ NLU 🌶️", "Bánh Xèo Miền Tây KTX A 🥞", "Bánh Cuốn Tráng Tay Nông Lâm 🍥",
                "Sinh Tố & Trái Cây Dầm 🍓", "Bún Thịt Nướng Bà Bảy 🥗", "Cơm Bình Dân Sinh Viên 🍛",
                "Quán Ăn Vặt Hàn Quốc KPOP 🍡", "Bánh Mì Kebab Thổ Nhĩ Kỳ 🥙", "Cháo Lòng & Bún Mắm NLU 🥘",
                "Quán Lẩu Cốc Sinh Viên 🍲", "Nước Đậu Đậu Lạc Hồng 🥛"
            };

            String[] statuses = {"APPROVED", "APPROVED", "APPROVED", "APPROVED", "APPROVED", "APPROVED", "APPROVED", "APPROVED", "APPROVED", "APPROVED", "APPROVED", "APPROVED", "APPROVED", "APPROVED", "APPROVED", "PENDING", "PENDING", "PENDING", "REJECTED", "APPROVED"};

            for (int i = 0; i < names.length; i++) {
                String img = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";
                if (i % 4 == 1) img = "https://images.unsplash.com/photo-1569718212165-3a8278d5f624";
                if (i % 4 == 2) img = "https://images.unsplash.com/photo-1551024709-8f23befc6f87";
                if (i % 4 == 3) img = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd";
            }
        }

        // Ensure all restaurants have non-null valid status
        List<Restaurant> allR = restaurantRepository.findAll();
        for (int i = 0; i < allR.size(); i++) {
            Restaurant r = allR.get(i);
            if (r.getStatus() == null || r.getStatus().isBlank()) {
                if (i == 15 || i == 16 || i == 17) {
                    r.setStatus("PENDING");
                } else if (i == 18) {
                    r.setStatus("REJECTED");
                } else {
                    r.setStatus("APPROVED");
                }
                restaurantRepository.save(r);
            }
        }

        if (menuItemRepository.count() < 10) {
            Restaurant r1 = restaurantRepository.findAll().get(0);
            Restaurant r2 = restaurantRepository.findAll().get(1);
            Restaurant r3 = restaurantRepository.findAll().get(2);

            menuItemRepository.saveAll(List.of(
                new MenuItem(null, "Cơm sườn bì chả nướng đặc biệt", 35000.0, 40000.0, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", "Cơm", true, r1),
                new MenuItem(null, "Cơm gà chiên mắm tỏi thơm lừng", 38000.0, 42000.0, "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b", "Cơm", true, r1),
                new MenuItem(null, "Cơm sườn nướng mỡ hành", 32000.0, 36000.0, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", "Cơm", true, r1),
                new MenuItem(null, "Canh khổ qua dồn thịt", 12000.0, 15000.0, "https://images.unsplash.com/photo-1547592180-85f173990554", "Cơm", true, r1),
                new MenuItem(null, "Bún bò Huế giò heo đặc biệt", 40000.0, 45000.0, "https://images.unsplash.com/photo-1569718212165-3a8278d5f624", "Món nước", true, r2),
                new MenuItem(null, "Phở bò tái nạm bò viên", 42000.0, 48000.0, "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43", "Món nước", true, r2),
                new MenuItem(null, "Hủ tiếu Nam Vang tôm mực", 38000.0, 42000.0, "https://images.unsplash.com/photo-1569718212165-3a8278d5f624", "Món nước", true, r2),
                new MenuItem(null, "Trà sữa trân châu đường đen NLU", 25000.0, 30000.0, "https://images.unsplash.com/photo-1551024709-8f23befc6f87", "Đồ uống", true, r3),
                new MenuItem(null, "Trà đào cam sả thanh nhiệt", 22000.0, 25000.0, "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd", "Đồ uống", true, r3),
                new MenuItem(null, "Trà tắc xí muội giải khát", 18000.0, 20000.0, "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd", "Đồ uống", true, r3),
                new MenuItem(null, "Sữa tươi trân châu đường đen", 28000.0, 32000.0, "https://images.unsplash.com/photo-1551024709-8f23befc6f87", "Đồ uống", true, r3)
            ));
            System.out.println(">> Seeded 20 Restaurants successfully.");
        }
    }

    private void seedVipPackages() {
        if (vipPackageRepository.count() == 0) {
            vipPackageRepository.saveAll(List.of(
                new VipPackage(null, "Gói NLU Đồng (Silver)", 29000.0, 30, 10, 5, "Miễn phí ship 5 đơn hàng/tháng, giảm 10% đồ uống", true),
                new VipPackage(null, "Gói NLU Vàng (Gold)", 59000.0, 30, 20, 15, "Miễn phí ship 15 đơn hàng/tháng, giảm 20% toàn bộ thực đơn", true),
                new VipPackage(null, "Gói NLU Kim Cương (Diamond Pro)", 99000.0, 30, 30, 999, "Freeship không giới hạn mọi đơn hàng NLU, giảm 30% món ăn", true),
                new VipPackage(null, "Gói Mùa Thi Nông Lâm (Exam Boost)", 19000.0, 7, 15, 3, "Gói ngắn hạn 7 ngày ưu đãi mùa thi KTX", true),
                new VipPackage(null, "Gói Học Kỳ NLU (Semester Pass)", 199000.0, 120, 25, 50, "Ưu đãi trọn gói 4 tháng học kỳ sinh viên", true)
            ));
            System.out.println(">> Seeded 5 VIP Packages successfully.");
        }
    }

    private void seedNotifications() {
        userRepository.findByEmail("student@hcmuaf.edu.vn").ifPresent(student -> {
            Long studentId = student.getId();
            if (notificationRepository.findByUserIdOrderByCreatedTimeDesc(studentId).size() < 20) {
                List<Notification> notifs = new ArrayList<>();
                for (int i = 1; i <= 20; i++) {
                    notifs.add(new Notification(studentId, "Thông báo ưu đãi #" + i + " 🎉", "NLUFood cập nhật ưu đãi món ăn mới cho sinh viên KTX! Nhập mã 'NLUSTUDENT' để nhận ưu đãi giảm 20k ngay hôm nay."));
                }
                notificationRepository.saveAll(notifs);
                System.out.println(">> Seeded 20 Notifications successfully.");
            }
        });
    }

    private void seedSavedVouchers() {
        userRepository.findByEmail("student@hcmuaf.edu.vn").ifPresent(student -> {
            if (savedVoucherRepository.findByUserId(student.getId()).size() < 10) {
                promoCodeRepository.findAll().stream().limit(10).forEach(p -> {
                    savedVoucherRepository.save(new SavedVoucher(student, p));
                });
                System.out.println(">> Seeded saved vouchers for student.");
            }
        });
    }

    private void seedReviews() {
        if (reviewRepository.count() < 20) {
            User student = userRepository.findByEmail("student@hcmuaf.edu.vn").orElse(null);
            List<Restaurant> restList = restaurantRepository.findAll();
            if (student != null && !restList.isEmpty()) {
                List<Review> revs = new ArrayList<>();
                for (int i = 0; i < 20; i++) {
                    Restaurant r = restList.get(i % restList.size());
                    revs.add(new Review(null, "Món ăn ngon hợp vị sinh viên #" + (i + 1) + ", giao cực nhanh KTX!", 4 + (i % 2), student, r));
                }
                reviewRepository.saveAll(revs);
                System.out.println(">> Seeded 20 Reviews successfully.");
            }
        }
    }

    private void seedOrders() {
        if (orderRepository.count() < 20) {
            User student = userRepository.findByEmail("student@hcmuaf.edu.vn").orElse(null);
            Restaurant r1 = restaurantRepository.findAll().get(0);

            if (student != null && r1 != null) {
                String[] statuses = {"COMPLETED", "DELIVERING", "PREPARING", "CANCELLED"};
                String[] payments = {"Ví MoMo", "Tiền mặt", "ZaloPay", "Thẻ ATM"};

                List<Order> orders = new ArrayList<>();
                for (int i = 1; i <= 20; i++) {
                    Order o = new Order();
                    o.setStudent(student);
                    o.setRestaurant(r1);
                    o.setStatus(statuses[i % 4]);
                    o.setTotalPrice(35000.0 + (i * 5000.0));
                    o.setOrderTime(LocalDateTime.now().minusHours(i * 2));
                    o.setPaymentMethod(payments[i % 4]);
                    o.setDriverName("Nguyễn Văn Hùng (Shipper NLU)");
                    o.setDriverPhone("0988 123 456");
                    o.setDriverLicensePlate("59-X1 678.90");
                    orders.add(o);
                }
                orderRepository.saveAll(orders);
                System.out.println(">> Seeded 20 Orders with driver details successfully.");
            }
        }
    }

    private void seedViolations() {
        if (userViolationRepository.count() > 3) {
            userViolationRepository.deleteAll();
        }
        if (userViolationRepository.count() == 0) {
            User student = userRepository.findByEmail("student@hcmuaf.edu.vn").orElse(null);
            if (student != null) {
                userViolationRepository.save(new UserViolation(null, student, "Spam đặt 5 đơn ảo không lấy hàng tại Cơm Tấm Nông Lâm", "Chủ Quán Cơm Tấm", "PENDING"));
                userViolationRepository.save(new UserViolation(null, student, "Dùng ngôn từ không chuẩn mực trong Chat với Chủ quán", "Chủ Quán Trà Sữa", "PENDING"));
                userViolationRepository.save(new UserViolation(null, student, "Đăng tải đánh giá sai sự thật về chất lượng món ăn", "Chủ Quán Bún Bò", "RESOLVED"));
                System.out.println(">> Seeded 3 distinct User Violation reports successfully.");
            }
        }
    }

    private void seedAddresses() {
        if (addressRepository.count() == 0) {
            User student = userRepository.findByEmail("student@hcmuaf.edu.vn").orElse(null);
            if (student != null) {
                addressRepository.save(new Address(null, "Ký Túc Xá A", "Phòng 302, KTX A, ĐH Nông Lâm TP.HCM, P. Linh Trung, TP. Thủ Đức", "Nguyễn Văn A", "0912345678", true, student));
                addressRepository.save(new Address(null, "Ký Túc Xá B", "Phòng 510, KTX B, ĐH Nông Lâm TP.HCM, P. Linh Trung, TP. Thủ Đức", "Nguyễn Văn A", "0912345678", false, student));
                addressRepository.save(new Address(null, "Giảng Đường K", "Cổng Giảng Đường K (Khoa CNTT), ĐH Nông Lâm TP.HCM", "Nguyễn Văn A", "0912345678", false, student));
                addressRepository.save(new Address(null, "Viện Sinh Học", "Sảnh Cổng Viện Công Nghệ Sinh Học Nông Lâm", "Nguyễn Văn A", "0912345678", false, student));
                System.out.println(">> Seeded 4 default Address entries successfully.");
            }
        }
    }

    private void seedFavorites() {
        if (favoriteRepository.count() == 0) {
            User student = userRepository.findByEmail("student@hcmuaf.edu.vn").orElse(null);
            List<Restaurant> restList = restaurantRepository.findAll();
            if (student != null && !restList.isEmpty()) {
                favoriteRepository.save(new Favorite(null, student, restList.get(0), null));
                favoriteRepository.save(new Favorite(null, student, restList.get(1), null));
                favoriteRepository.save(new Favorite(null, student, restList.get(2), null));
                System.out.println(">> Seeded 3 default Favorite entries successfully.");
            }
        }
    }

    private void seedSystemSettings() {
        if (systemSettingRepository.count() == 0) {
            systemSettingRepository.save(new SystemSetting(null, "SHIPPING_FEE_PER_KM", "15000", "Phí giao hàng cố định mỗi kilomet (VNĐ)"));
            systemSettingRepository.save(new SystemSetting(null, "RESTAURANT_COMMISSION_PERCENT", "10", "Tỷ lệ chiết khấu doanh thu quán ăn (%)"));
            systemSettingRepository.save(new SystemSetting(null, "VIP_MEMBERSHIP_DISCOUNT_PERCENT", "20", "Mức giảm giá mặc định cho hội viên NLU VIP Gold (%)"));
            systemSettingRepository.save(new SystemSetting(null, "FREE_SHIPPING_MIN_ORDER", "30000", "Giá trị đơn hàng tối thiểu để freeship (VNĐ)"));
            System.out.println(">> Seeded 4 default SystemSettings entries successfully.");
        }
    }
}
