import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const CATEGORIES = [
  { id: 'all', name: 'Tất cả', icon: '🍱', query: '' },
  { id: 'Cơm', name: 'Cơm tấm', icon: '🍚', query: 'Cơm' },
  { id: 'Món nước', name: 'Món nước', icon: '🍜', query: 'Món nước' },
  { id: 'Đồ uống', name: 'Trà Sữa', icon: '🧋', query: 'Đồ uống' },
  { id: 'Ăn vặt', name: 'Ăn vặt', icon: '🍟', query: 'Ăn vặt' }
];

export default function HomeScreen({ navigation, user, cart = [], setCart }) {
  const [restaurants, setRestaurants] = useState([]);
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [hiddenRestaurants, setHiddenRestaurants] = useState({});
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const cartCount = (cart || []).reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = (cart || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const fetchUnreadNotifications = async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/notifications/user/${user.id}/unread-count`);
      setUnreadNotifCount(res.data || 0);
    } catch (e) {
      console.log('Lỗi lấy số thông báo chưa đọc:', e.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUnreadNotifications();
    }, [user?.id])
  );

  useEffect(() => {
    loadLocalData();
    fetchData();
    fetchUnreadNotifications();
  }, [user?.id]);

  const loadLocalData = async () => {
    try {
      const favs = await AsyncStorage.getItem('favorites_student');
      if (favs) setFavorites(JSON.parse(favs));

      const hidden = await AsyncStorage.getItem('hidden_restaurants_15d');
      if (hidden) {
        const parsed = JSON.parse(hidden);
        const now = Date.now();
        const valid = {};
        Object.keys(parsed).forEach(id => {
          if (parsed[id] > now) valid[id] = parsed[id];
        });
        setHiddenRestaurants(valid);
      }
    } catch (e) {}
  };

  const fetchData = async () => {
    try {
      const [resData, flashData] = await Promise.all([
        axios.get(`${API_BASE_URL}/restaurants`),
        axios.get(`${API_BASE_URL}/restaurants/flash-sales`).catch(() => ({ data: [] }))
      ]);
      setRestaurants(resData.data || []);
      setFlashSales(flashData.data || []);
      setLoading(false);
    } catch (e) {
      console.error('Lỗi khi tải dữ liệu:', e);
      setLoading(false);
    }
  };

  const toggleFavorite = async (id) => {
    const updated = favorites.includes(id)
      ? favorites.filter(fId => fId !== id)
      : [...favorites, id];
    setFavorites(updated);
    await AsyncStorage.setItem('favorites_student', JSON.stringify(updated));
  };

  const hideRestaurant = async (id) => {
    Alert.alert(
      'Ẩn quán ăn',
      'Bạn muốn ẩn quán ăn này trong 15 ngày?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Ẩn 15 ngày',
          onPress: async () => {
            const hideUntil = Date.now() + 15 * 24 * 60 * 60 * 1000;
            const updated = { ...hiddenRestaurants, [id]: hideUntil };
            setHiddenRestaurants(updated);
            await AsyncStorage.setItem('hidden_restaurants_15d', JSON.stringify(updated));
          }
        }
      ]
    );
  };

  const visibleRestaurants = restaurants.filter(r => !hiddenRestaurants[r.id]);
  const displayedRestaurants = showOnlyFavorites
    ? visibleRestaurants.filter(r => favorites.includes(r.id))
    : visibleRestaurants;

  const popularRestaurants = visibleRestaurants.filter(r => (r.rating || 0) >= 4.7);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.headerBox}>
        <View style={styles.greetingRow}>
          <TouchableOpacity
            style={styles.userAvatarContainer}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: user?.imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' }}
              style={styles.userAvatar}
            />
            <View style={styles.avatarCameraBadge}>
              <Text style={{ fontSize: 10 }}>📸</Text>
            </View>
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.greetingText}>Chào {user?.name || 'bạn'}! 🍕</Text>
            <Text style={styles.subGreeting}>Hôm nay bạn muốn ăn gì ở ĐH Nông Lâm?</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={styles.favFilterBtn}
              onPress={() => setShowOnlyFavorites(!showOnlyFavorites)}
            >
              <Text style={{ fontSize: 18 }}>{showOnlyFavorites ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>

            {/* Notification Bell Header Badge */}
            <TouchableOpacity
              style={styles.headerNotifBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Text style={{ fontSize: 19 }}>🔔</Text>
              {unreadNotifCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeCount}>
                    {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Cart Header Badge */}
            <TouchableOpacity
              style={styles.headerCartBtn}
              onPress={() => navigation.navigate('Cart')}
            >
              <Text style={{ fontSize: 20 }}>🛒</Text>
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeCount}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search')}
        >
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Tìm quán ăn, bún bò, cơm tấm...</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Banner Promos */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerBadge}>Ưu đãi HOT Hôm Nay 🔥</Text>
              <Text style={styles.bannerTitle}>Giảm 15% khi thanh toán MoMo</Text>
              <Text style={styles.bannerSub}>Đơn từ 50k + Freeship 0đ cho Hội Viên VIP</Text>
            </View>
            <Text style={{ fontSize: 36 }}>💳</Text>
          </View>
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryItem}
              onPress={() => navigation.navigate('Search', { initialQuery: cat.query })}
            >
              <View style={styles.categoryIconCircle}>
                <Text style={styles.categoryEmoji}>{cat.icon}</Text>
              </View>
              <Text style={styles.categoryName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* SECTION 1: FLASH SALE */}
        {flashSales.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔥 Flash Sale Giá Sốc</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                <Text style={styles.seeAllText}>Tất cả</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={flashSales}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.flashCard}
                  onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: item.restaurant?.id })}
                >
                  <Image source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836' }} style={styles.flashImg} />
                  <View style={styles.flashBadge}>
                    <Text style={styles.flashBadgeText}>GIẢM 50%</Text>
                  </View>
                  <View style={styles.flashOverlay}>
                    <Text style={styles.flashTitle} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.flashPrice}>{item.price?.toLocaleString()}đ</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* SECTION 2: POPULAR RESTAURANTS */}
        {popularRestaurants.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👑 Quán Nổi Tiếng Đánh Giá Cao</Text>
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={popularRestaurants}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.popularCard}
                  onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: item.id })}
                >
                  <Image source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4' }} style={styles.popularImg} />
                  <View style={styles.popularInfo}>
                    <Text style={styles.popularName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.starRow}>
                      <Text style={{ fontSize: 13, color: '#FFB800' }}>⭐</Text>
                      <Text style={styles.starText}>{item.rating || "4.8"}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* SECTION 3: NEARBY RESTAURANTS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {showOnlyFavorites ? '💖 Quán yêu thích' : '📍 Quán ngon gần bạn (ĐH Nông Lâm)'}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#BA3D0E" style={{ marginTop: 30 }} />
        ) : (
          <View style={{ paddingHorizontal: 16 }}>
            {displayedRestaurants.map(r => {
              const isFav = favorites.includes(r.id);
              return (
                <TouchableOpacity
                  key={r.id}
                  style={styles.restaurantCard}
                  onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: r.id })}
                >
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: r.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4' }} style={styles.restaurantImg} />
                    <TouchableOpacity style={styles.heartBtn} onPress={() => toggleFavorite(r.id)}>
                      <Text style={{ fontSize: 18 }}>{isFav ? '❤️' : '🤍'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.hideBtn} onPress={() => hideRestaurant(r.id)}>
                      <Text style={{ fontSize: 16 }}>👁️</Text>
                    </TouchableOpacity>
                    <View style={styles.ratingBadge}>
                      <Text style={{ fontSize: 13, color: '#FFB800' }}>⭐</Text>
                      <Text style={styles.ratingText}>{r.rating || "4.8"}</Text>
                    </View>
                  </View>

                  <View style={styles.restaurantBody}>
                    <Text style={styles.restaurantName}>{r.name}</Text>
                    <Text style={styles.restaurantAddress} numberOfLines={1}>📍 {r.address}</Text>

                    <View style={styles.badgeRow}>
                      <Text style={styles.promoTag}>💳 MoMo Off 15%</Text>
                      <Text style={styles.promoTagGreen}>🎁 Bạn mới -10k</Text>
                      <Text style={styles.promoTagGold}>🌟 VIP Freeship</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Cart Bar (Item 2) */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={styles.floatingCartBar}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.9}
        >
          <View style={styles.floatingCartCountBox}>
            <Text style={styles.floatingCartCountText}>{cartCount}</Text>
          </View>
          <Text style={styles.floatingCartTitle}>Xem giỏ hàng ({cartCount} món)</Text>
          <Text style={styles.floatingCartPriceText}>{cartTotal.toLocaleString()}đ ➔</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  headerBox: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: '#F0ECE8'
  },
  greetingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  userAvatarContainer: { position: 'relative' },
  userAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#BA3D0E' },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BA3D0E'
  },
  greetingText: { fontSize: 18, fontWeight: '800', color: '#2A1608' },
  subGreeting: { fontSize: 12, color: '#7A6658', marginTop: 1 },
  favFilterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFEAE0', justifyContent: 'center', alignItems: 'center' },
  headerNotifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFEAE0', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#BA3D0E',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF'
  },
  notifBadgeCount: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  headerCartBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFEAE0', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#BA3D0E',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF'
  },
  cartBadgeCount: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF9F6',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1E9E4'
  },
  searchPlaceholder: { fontSize: 14, color: '#A89A90' },
  scrollBody: { paddingBottom: 130 },
  bannerContainer: { paddingHorizontal: 16, marginTop: 14 },
  bannerBox: {
    backgroundColor: '#BA3D0E',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#BA3D0E',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  bannerBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 4
  },
  bannerTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  bannerSub: { color: '#FFF', fontSize: 11, marginTop: 2, opacity: 0.9 },
  categoryBar: { marginVertical: 16 },
  categoryItem: { alignItems: 'center', marginRight: 16 },
  categoryIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0ECE8',
    elevation: 2
  },
  categoryEmoji: { fontSize: 28 },
  categoryName: { fontSize: 12, fontWeight: '700', color: '#4A3B32', marginTop: 6 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#2A1608' },
  seeAllText: { fontSize: 13, color: '#BA3D0E', fontWeight: '700' },
  flashCard: { width: 220, height: 130, borderRadius: 18, overflow: 'hidden', marginRight: 12, backgroundColor: '#DDD' },
  flashImg: { width: '100%', height: '100%' },
  flashBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: '#BA3D0E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  flashBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  flashOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10 },
  flashTitle: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  flashPrice: { color: '#FFD700', fontSize: 14, fontWeight: '800', marginTop: 2 },
  popularCard: { width: 150, backgroundColor: '#FFF', borderRadius: 18, overflow: 'hidden', marginRight: 12, borderWidth: 1, borderColor: '#F0ECE8' },
  popularImg: { width: '100%', height: 95 },
  popularInfo: { padding: 10 },
  popularName: { fontSize: 13, fontWeight: '700', color: '#2A1608' },
  starRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  starText: { fontSize: 12, fontWeight: '700', color: '#4A3B32', marginLeft: 4 },
  restaurantCard: { backgroundColor: '#FFF', borderRadius: 22, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#F0ECE8', elevation: 2 },
  imageContainer: { width: '100%', height: 170, position: 'relative' },
  restaurantImg: { width: '100%', height: '100%' },
  heartBtn: { position: 'absolute', top: 12, left: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255, 255, 255, 0.95)', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  hideBtn: { position: 'absolute', top: 12, left: 56, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255, 255, 255, 0.95)', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  ratingBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(255, 255, 255, 0.95)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  ratingText: { fontSize: 12, fontWeight: '800', marginLeft: 4, color: '#2A1608' },
  restaurantBody: { padding: 14 },
  restaurantName: { fontSize: 17, fontWeight: '800', color: '#2A1608' },
  restaurantAddress: { fontSize: 12, color: '#7A6658', marginTop: 4 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  promoTag: { fontSize: 10, fontWeight: '700', color: '#BA3D0E', backgroundColor: '#FFEAE0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  promoTagGreen: { fontSize: 10, fontWeight: '700', color: '#2E7D32', backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  promoTagGold: { fontSize: 10, fontWeight: '700', color: '#B78103', backgroundColor: '#FFF8E1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  floatingCartBar: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 95 : 105,
    left: 16,
    right: 16,
    backgroundColor: '#BA3D0E',
    borderRadius: 22,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 8,
    shadowColor: '#BA3D0E',
    shadowOpacity: 0.35,
    shadowRadius: 8
  },
  floatingCartCountBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  floatingCartCountText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
  floatingCartTitle: { flex: 1, color: '#FFF', fontSize: 15, fontWeight: '800', marginLeft: 12 },
  floatingCartPriceText: { color: '#FFF', fontSize: 15, fontWeight: '900' }
});
