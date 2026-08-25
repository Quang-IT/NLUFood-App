import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';

export default function RestaurantDetailScreen({ route, navigation, cart, setCart, user }) {
  const { restaurantId } = route.params;
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchRestaurantData();
  }, [restaurantId]);

  const fetchRestaurantData = async () => {
    try {
      const [resR, resM, resRev] = await Promise.all([
        axios.get(`${API_BASE_URL}/restaurants/${restaurantId}`),
        axios.get(`${API_BASE_URL}/restaurants/${restaurantId}/menu`),
        axios.get(`${API_BASE_URL}/reviews/restaurant/${restaurantId}`).catch(() => ({ data: [] }))
      ]);
      setRestaurant(resR.data);
      setMenuItems(resM.data || []);
      setReviews(resRev.data || []);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    setCart(prevCart => {
      const existing = prevCart.find(i => i.id === item.id);
      if (existing) {
        return prevCart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        return [...prevCart, { ...item, quantity: 1, restaurant }];
      }
    });
    Alert.alert('Thành công', `Đã thêm ${item.name} vào giỏ hàng!`);
  };

  const handleSubmitReview = async () => {
    if (!commentInput.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập nội dung đánh giá của bạn!');
      return;
    }
    setSubmittingReview(true);
    try {
      const payload = {
        restaurant: { id: restaurantId },
        user: { id: user?.id || 1 },
        userName: user?.name || 'Sinh viên NLU',
        rating: ratingInput,
        comment: commentInput.trim(),
        reviewTime: new Date().toLocaleDateString('vi-VN')
      };
      const res = await axios.post(`${API_BASE_URL}/reviews`, payload);
      setSubmittingReview(false);
      setShowReviewModal(false);
      setCommentInput('');
      setReviews(prev => [res.data || payload, ...prev]);
      Alert.alert('Thành công', 'Cảm ơn bạn đã gửi đánh giá cho quán ăn!');
    } catch (e) {
      setSubmittingReview(false);
      const localReview = {
        id: Date.now(),
        userName: user?.name || 'Sinh viên NLU',
        rating: ratingInput,
        comment: commentInput.trim(),
        reviewTime: new Date().toLocaleDateString('vi-VN')
      };
      setReviews(prev => [localReview, ...prev]);
      setShowReviewModal(false);
      setCommentInput('');
      Alert.alert('Thành công', 'Đã lưu đánh giá của bạn!');
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading || !restaurant) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#BA3D0E" size="large" />
      </View>
    );
  }

  const categories = ['Tất cả', ...new Set(menuItems.map(i => i.category || 'Món chính')), 'Đánh giá'];

  const filteredItems = activeTab === 'Tất cả'
    ? menuItems
    : menuItems.filter(i => i.category === activeTab);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Hero Round Image with Overlays */}
        <View style={styles.heroBox}>
          <Image
            source={{ uri: restaurant.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }}
            style={styles.heroImage}
          />
          <TouchableOpacity style={styles.topBtnLeft} onPress={() => navigation.goBack()}>
            <Text style={{ fontSize: 20, color: '#2A1608' }}>←</Text>
          </TouchableOpacity>
          <View style={styles.topBtnRightGroup}>
            <TouchableOpacity style={styles.topBtnRight} onPress={() => navigation.navigate('Search')}>
              <Text style={{ fontSize: 16 }}>🔍</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.topBtnRight} onPress={() => setIsFavorite(!isFavorite)}>
              <Text style={{ fontSize: 18 }}>{isFavorite ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Restaurant Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.restaurantTitle}>{restaurant.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={{ fontSize: 14, color: '#FFB800' }}>⭐</Text>
              <Text style={styles.metaText}>{restaurant.rating || 4.8} (1.2k)</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={{ fontSize: 14, color: '#BA3D0E' }}>⏱️</Text>
              <Text style={styles.metaText}>15 mins</Text>
            </View>
          </View>

          <View style={styles.addressPill}>
            <Text style={{ fontSize: 14, marginRight: 6 }}>📍</Text>
            <Text style={styles.addressText} numberOfLines={1}>{restaurant.address}</Text>
          </View>

          <TouchableOpacity
            style={styles.chatPill}
            onPress={() => navigation.navigate('Chat', { initialRestaurant: restaurant })}
          >
            <Text style={{ fontSize: 16, marginRight: 6 }}>💬</Text>
            <Text style={styles.chatPillText}>Tin nhắn với quán</Text>
          </TouchableOpacity>

          {/* Category Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map(cat => {
              const isActive = activeTab === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryTab, isActive && (cat === 'Đánh giá' ? styles.categoryTabActiveBlue : styles.categoryTabActive)]}
                  onPress={() => setActiveTab(cat)}
                >
                  <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Menu Content or Reviews Content */}
        {activeTab === 'Đánh giá' ? (
          <View style={styles.reviewSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Đánh giá ({reviews.length})</Text>
              <TouchableOpacity
                style={styles.writeReviewBtn}
                onPress={() => setShowReviewModal(true)}
              >
                <Text style={styles.writeReviewText}>✍️ Viết đánh giá</Text>
              </TouchableOpacity>
            </View>

            {reviews.length === 0 ? (
              <View style={styles.noReviewBox}>
                <Text style={styles.noReviewText}>Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá quán ăn này!</Text>
              </View>
            ) : (
              reviews.map((rev, idx) => (
                <View key={rev.id || idx} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarLetter}>{(rev.userName || 'N')[0]}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.reviewerName}>{rev.userName || 'Sinh viên NLU'}</Text>
                      <Text style={styles.reviewDate}>{rev.reviewTime || 'Hôm nay'}</Text>
                    </View>
                    <View style={styles.starGroup}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Text key={star} style={{ fontSize: 13, color: star <= (rev.rating || 5) ? '#FFB800' : '#DDD' }}>⭐</Text>
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{rev.comment}</Text>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Thực đơn món ăn</Text>
            {filteredItems.map(item => (
              <View key={item.id} style={styles.menuCard}>
                <Image
                  source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }}
                  style={styles.menuImg}
                />
                <View style={styles.menuInfo}>
                  <Text style={styles.menuName}>{item.name}</Text>
                  <Text style={styles.menuCat}>{item.category || 'Món chính'}</Text>
                  <Text style={styles.menuPrice}>{item.price?.toLocaleString()}đ</Text>
                </View>

                {/* Requirement 3: Explicit + Thêm button */}
                <TouchableOpacity style={styles.addBtnExplicit} onPress={() => handleAddToCart(item)}>
                  <Text style={styles.addBtnText}>+ Thêm</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Cart Bar */}
      {cartCount > 0 && (
        <View style={styles.floatingCartContainer}>
          <TouchableOpacity
            style={styles.floatingCartBtn}
            onPress={() => navigation.navigate('Cart')}
          >
            <View style={styles.cartCountCircle}>
              <Text style={styles.cartCountNumber}>{cartCount}</Text>
            </View>
            <Text style={styles.cartBtnText}>Xem giỏ hàng</Text>
            <Text style={styles.cartBtnPrice}>{cartTotal.toLocaleString()}đ</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Interactive Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đánh giá quán ăn</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Text style={{ fontSize: 22, color: '#A89A90', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.ratingSelectLabel}>Chọn mức độ hài lòng:</Text>
            <View style={styles.starPickerRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setRatingInput(star)} style={{ padding: 6 }}>
                  <Text style={{ fontSize: 32, opacity: star <= ratingInput ? 1 : 0.3 }}>⭐</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.commentLabel}>Nhận xét của bạn:</Text>
            <TextInput
              style={styles.commentTextInput}
              placeholder="Món ăn ngon, giao nhanh, đóng gói cẩn thận..."
              placeholderTextColor="#A89A90"
              multiline
              numberOfLines={4}
              value={commentInput}
              onChangeText={setCommentInput}
            />

            <TouchableOpacity
              style={styles.submitReviewBtn}
              onPress={handleSubmitReview}
              disabled={submittingReview}
            >
              {submittingReview ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitReviewBtnText}>Gửi đánh giá</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF8F5' },
  scrollContent: { paddingBottom: 130 },
  heroBox: {
    width: '100%',
    height: 310,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10
  },
  heroImage: { width: 250, height: 250, borderRadius: 125 },
  topBtnLeft: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 44 : 54,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3
  },
  topBtnRightGroup: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 44 : 54,
    right: 20,
    flexDirection: 'row',
    gap: 10
  },
  topBtnRight: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    marginTop: -20,
    elevation: 2
  },
  restaurantTitle: { fontSize: 26, fontWeight: '800', color: '#2A1608', marginBottom: 12 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 14, fontWeight: '700', color: '#4A3B32' },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F3EE',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 12
  },
  addressText: { fontSize: 13, color: '#6A584C', flex: 1 },
  chatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEAE0',
    borderWidth: 1,
    borderColor: '#FFD6C7',
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 16
  },
  chatPillText: { fontSize: 14, fontWeight: '700', color: '#BA3D0E' },
  categoryScroll: { flexDirection: 'row', marginTop: 6 },
  categoryTab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0ECE8',
    marginRight: 10
  },
  categoryTabActive: { backgroundColor: '#BA3D0E' },
  categoryTabActiveBlue: { backgroundColor: '#29B6F6' },
  categoryTabText: { fontSize: 13, fontWeight: '600', color: '#6A584C' },
  categoryTabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  menuSection: { padding: 20 },
  reviewSection: { padding: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#2A1608', marginBottom: 14 },
  writeReviewBtn: { backgroundColor: '#BA3D0E', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14 },
  writeReviewText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  noReviewBox: { padding: 30, alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20 },
  noReviewText: { color: '#A89A90', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0EAE4'
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFEAE0', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 16, fontWeight: '800', color: '#BA3D0E' },
  reviewerName: { fontSize: 14, fontWeight: '700', color: '#2A1608' },
  reviewDate: { fontSize: 11, color: '#A89A90', marginTop: 2 },
  starGroup: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: 13, color: '#4A3B32', lineHeight: 18 },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0EAE4'
  },
  menuImg: { width: 72, height: 72, borderRadius: 16 },
  menuInfo: { flex: 1, marginLeft: 14 },
  menuName: { fontSize: 15, fontWeight: '700', color: '#2A1608' },
  menuCat: { fontSize: 12, color: '#7A6658', marginTop: 2 },
  menuPrice: { fontSize: 15, fontWeight: '800', color: '#BA3D0E', marginTop: 4 },
  addBtnExplicit: {
    backgroundColor: '#BA3D0E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#BA3D0E',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2
  },
  addBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  floatingCartContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  floatingCartBtn: {
    backgroundColor: '#BA3D0E',
    borderRadius: 20,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 6
  },
  cartCountCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.25)', justifyContent: 'center', alignItems: 'center' },
  cartCountNumber: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  cartBtnText: { flex: 1, color: '#FFF', fontSize: 15, fontWeight: '700', marginLeft: 12 },
  cartBtnPrice: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#2A1608' },
  ratingSelectLabel: { fontSize: 13, fontWeight: '700', color: '#4A3B32', marginBottom: 6 },
  starPickerRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 18 },
  commentLabel: { fontSize: 13, fontWeight: '700', color: '#4A3B32', marginBottom: 6 },
  commentTextInput: {
    backgroundColor: '#FDF9F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1E9E4',
    padding: 14,
    fontSize: 14,
    color: '#2A1608',
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20
  },
  submitReviewBtn: {
    backgroundColor: '#BA3D0E',
    borderRadius: 18,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center'
  },
  submitReviewBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' }
});
