import React, { useState, useEffect } from 'react';
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
  Alert
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';

export default function HomeScreen({ navigation, user }) {
  const [restaurants, setRestaurants] = useState([]);
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [hiddenRestaurants, setHiddenRestaurants] = useState({});
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  useEffect(() => {
    loadLocalData();
    fetchData();
  }, []);

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
        axios.get(`${API_BASE_URL}/restaurants/flash-sales`)
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
      {/* Search Header */}
      <View style={styles.headerBox}>
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingText}>Chào bạn! 🍕</Text>
            <Text style={styles.subGreeting}>Hôm nay bạn muốn ăn gì ở ĐH Nông Lâm?</Text>
          </View>
          <TouchableOpacity
            style={styles.favFilterBtn}
            onPress={() => setShowOnlyFavorites(!showOnlyFavorites)}
          >
            <Ionicons name={showOnlyFavorites ? "heart" : "heart-outline"} size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search')}
        >
          <Ionicons name="search" size={20} color="#999" style={{ marginRight: 8 }} />
          <Text style={styles.searchPlaceholder}>Tìm quán ăn, bún bò, cơm tấm...</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Banner Promos */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerBadge}>Ưu đãi HOT Hôm Nay 🔥</Text>
              <Text style={styles.bannerTitle}>Giảm 15% khi thanh toán MoMo</Text>
              <Text style={styles.bannerSub}>Đơn từ 50k + Freeship 0đ cho Hội Viên VIP</Text>
            </View>
            <Text style={{ fontSize: 40 }}>💳</Text>
          </View>
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar}>
          {[
            { id: 'all', name: 'Tất cả', icon: 'fast-food-outline', query: '' },
            { id: 'Cơm', name: 'Cơm tấm', icon: 'restaurant-outline', query: 'Cơm' },
            { id: 'Món nước', name: 'Món nước', icon: 'journal-outline', query: 'Món nước' },
            { id: 'Đồ uống', name: 'Trà Sữa', icon: 'cafe-outline', query: 'Đồ uống' },
            { id: 'Ăn vặt', name: 'Ăn vặt', icon: 'ice-cream-outline', query: 'Ăn vặt' }
          ].map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryItem}
              onPress={() => navigation.navigate('Search', { initialQuery: cat.query })}
            >
              <View style={styles.categoryIconCircle}>
                <Ionicons name={cat.icon} size={24} color="#FF6B00" />
              </View>
              <Text style={styles.categoryName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* SECTION 1: FLASH SALE */}
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

        {/* SECTION 2: POPULAR RESTAURANTS */}
        {popularRestaurants.length > 0 && (
          <View style={{ marginTop: 20 }}>
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
                      <Ionicons name="star" size={14} color="#FFB800" />
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
          <ActivityIndicator color="#FF6B00" style={{ marginTop: 30 }} />
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
                    
                    {/* Heart Favorite Button */}
                    <TouchableOpacity style={styles.heartBtn} onPress={() => toggleFavorite(r.id)}>
                      <Ionicons name={isFav ? "heart" : "heart-outline"} size={22} color="#FF3B30" />
                    </TouchableOpacity>

                    {/* Hide Button */}
                    <TouchableOpacity style={styles.hideBtn} onPress={() => hideRestaurant(r.id)}>
                      <Ionicons name="eye-off-outline" size={20} color="#555" />
                    </TouchableOpacity>

                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={12} color="#FFB800" />
                      <Text style={styles.ratingText}>{r.rating || "4.8"}</Text>
                    </View>
                  </View>

                  <View style={styles.restaurantBody}>
                    <Text style={styles.restaurantName}>{r.name}</Text>
                    <Text style={styles.restaurantAddress} numberOfLines={1}>📍 {r.address}</Text>

                    {/* PROMO BADGES */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  headerBox: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#EEE' },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  greetingText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  subGreeting: { fontSize: 12, color: '#777' },
  favFilterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F2', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16 },
  searchPlaceholder: { fontSize: 14, color: '#999' },
  bannerContainer: { paddingHorizontal: 16, marginTop: 16 },
  bannerBox: { backgroundColor: '#FF6B00', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerBadge: { backgroundColor: 'rgba(255,255,255,0.25)', color: '#FFF', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 4 },
  bannerTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  bannerSub: { color: '#FFF', fontSize: 11, marginTop: 2, opacity: 0.9 },
  categoryBar: { marginVertical: 16, paddingLeft: 16 },
  categoryItem: { alignItems: 'center', marginRight: 20 },
  categoryIconCircle: { width: 56, height: 56, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  categoryName: { fontSize: 11, fontWeight: 'bold', color: '#555', marginTop: 6 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  seeAllText: { fontSize: 12, color: '#FF6B00', fontWeight: 'bold' },
  flashCard: { width: 240, height: 140, borderRadius: 18, overflow: 'hidden', marginRight: 14, backgroundColor: '#DDD' },
  flashImg: { width: '100%', height: '100%' },
  flashBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: '#E53935', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  flashBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  flashOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10 },
  flashTitle: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  flashPrice: { color: '#FFD700', fontSize: 15, fontWeight: 'bold', marginTop: 2 },
  popularCard: { width: 160, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', marginRight: 12, borderWidth: 1, borderColor: '#EEE' },
  popularImg: { width: '100%', height: 100 },
  popularInfo: { padding: 10 },
  popularName: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  starRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  starText: { fontSize: 12, fontWeight: 'bold', color: '#555', marginLeft: 4 },
  restaurantCard: { backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#EEE', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  imageContainer: { width: '100%', height: 180, position: 'relative' },
  restaurantImg: { width: '100%', height: '100%' },
  heartBtn: { position: 'absolute', top: 12, left: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  hideBtn: { position: 'absolute', top: 12, left: 56, width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  ratingBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  ratingText: { fontSize: 12, fontWeight: 'bold', marginLeft: 4, color: '#333' },
  restaurantBody: { padding: 14 },
  restaurantName: { fontSize: 17, fontWeight: 'bold', color: '#222' },
  restaurantAddress: { fontSize: 12, color: '#777', marginTop: 4 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  promoTag: { fontSize: 10, fontWeight: 'bold', color: '#C2185B', backgroundColor: '#FCE4EC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  promoTagGreen: { fontSize: 10, fontWeight: 'bold', color: '#2E7D32', backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  promoTagGold: { fontSize: 10, fontWeight: 'bold', color: '#E65100', backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }
});
