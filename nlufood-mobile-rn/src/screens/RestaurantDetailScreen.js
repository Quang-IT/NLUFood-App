import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';

export default function RestaurantDetailScreen({ route, navigation, cart, setCart }) {
  const { restaurantId } = route.params;
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurantDetail();
  }, [restaurantId]);

  const fetchRestaurantDetail = async () => {
    try {
      const [resR, resM] = await Promise.all([
        axios.get(`${API_BASE_URL}/restaurants/${restaurantId}`),
        axios.get(`${API_BASE_URL}/menu-items/restaurant/${restaurantId}`)
      ]);
      setRestaurant(resR.data);
      setMenuItems(resM.data || []);
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

  if (loading || !restaurant) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#FF6B00" size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header Image */}
        <View style={styles.imageBox}>
          <Image source={{ uri: restaurant.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4' }} style={styles.headerImg} />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Restaurant Details */}
        <View style={styles.infoBox}>
          <Text style={styles.title}>{restaurant.name}</Text>
          <Text style={styles.address}>📍 {restaurant.address}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#FFB800" />
            <Text style={styles.ratingText}>{restaurant.rating || "4.8"}</Text>
            <Text style={styles.deliveryText}> • Giao hàng 15-20 min</Text>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => navigation.navigate('Chat', { initialRestaurant: restaurant })}
          >
            <Ionicons name="chatbubbles-outline" size={18} color="#FF6B00" style={{ marginRight: 6 }} />
            <Text style={styles.chatBtnText}>Tin nhắn với quán</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items Section */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Thực đơn quán ăn</Text>
          {menuItems.map(item => (
            <View key={item.id} style={styles.menuCard}>
              <Image source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836' }} style={styles.menuImg} />
              <View style={styles.menuBody}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCategory}>{item.category || 'Món ăn'}</Text>
                <Text style={styles.itemPrice}>{item.price?.toLocaleString()}đ</Text>
              </View>

              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => handleAddToCart(item)}
              >
                <Ionicons name="add" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Cart Floating Button */}
      {cart.length > 0 && (
        <TouchableOpacity style={styles.cartBar} onPress={() => navigation.navigate('Cart')}>
          <View style={styles.cartCountBadge}>
            <Text style={styles.cartCountText}>{cart.reduce((a, b) => a + b.quantity, 0)}</Text>
          </View>
          <Text style={styles.cartBarText}>Xem giỏ hàng</Text>
          <Text style={styles.cartBarTotal}>
            {cart.reduce((a, b) => a + (b.price * b.quantity), 0).toLocaleString()}đ
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  imageBox: { width: '100%', height: 220, position: 'relative' },
  headerImg: { width: '100%', height: '100%' },
  backBtn: { position: 'absolute', top: 50, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  infoBox: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EEE' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#222' },
  address: { fontSize: 13, color: '#666', marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  ratingText: { fontSize: 14, fontWeight: 'bold', marginLeft: 4, color: '#333' },
  deliveryText: { fontSize: 13, color: '#777' },
  chatBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#FFF0E6', borderWidth: 1, borderColor: '#FF6B00', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginTop: 14 },
  chatBtnText: { fontSize: 13, fontWeight: 'bold', color: '#FF6B00' },
  menuSection: { padding: 16 },
  menuTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 14 },
  menuCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#EEE', alignItems: 'center' },
  menuImg: { width: 75, height: 75, borderRadius: 12 },
  menuBody: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  itemCategory: { fontSize: 11, color: '#888', marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: 'bold', color: '#FF6B00', marginTop: 4 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FF6B00', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  cartBar: { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: '#FF6B00', borderRadius: 25, paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 6 },
  cartCountBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  cartCountText: { fontSize: 12, fontWeight: 'bold', color: '#FF6B00' },
  cartBarText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  cartBarTotal: { fontSize: 16, fontWeight: 'bold', color: '#FFF' }
});
