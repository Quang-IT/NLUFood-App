import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  Platform
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function SearchScreen({ navigation, route, cart = [] }) {
  const initialQuery = route.params?.initialQuery || '';
  const [query, setQuery] = useState(initialQuery);
  const [restaurants, setRestaurants] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterSort, setFilterSort] = useState('RECOMMENDED');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const cartCount = (cart || []).reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = (cart || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/restaurants`)
      .then(res => setAllRestaurants(res.data || []))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setRestaurants([]);
      setDishes([]);
      return;
    }
    const timer = setTimeout(() => {
      setLoading(true);
      Promise.all([
        axios.get(`${API_BASE_URL}/restaurants/search?q=${query}`),
        axios.get(`${API_BASE_URL}/menu-items/search?q=${query}`)
      ])
      .then(([resR, resD]) => {
        setRestaurants(resR.data || []);
        setDishes(resD.data || []);
        setLoading(false);
      })
      .catch(err => setLoading(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const applyFilters = (list) => {
    let result = [...list];
    if (filterCategory !== 'ALL') {
      result = result.filter(r => {
        const str = (r.name + ' ' + (r.address || '')).toLowerCase();
        if (filterCategory === 'Cơm') return str.includes('cơm') || str.includes('rice');
        if (filterCategory === 'Món nước') return str.includes('bún') || str.includes('phở') || str.includes('mì');
        if (filterCategory === 'Đồ uống') return str.includes('trà') || str.includes('sữa') || str.includes('cà phê');
        if (filterCategory === 'Ăn vặt') return str.includes('vặt') || str.includes('bánh');
        return true;
      });
    }
    if (filterSort === 'RATING') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return result;
  };

  const displayedRestaurants = query.trim() ? applyFilters(restaurants) : applyFilters(allRestaurants);

  return (
    <View style={styles.container}>
      {/* Header Search Input */}
      <View style={styles.searchHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 22, color: '#2A1608' }}>←</Text>
        </TouchableOpacity>
        <View style={styles.inputBox}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>🔍</Text>
          <TextInput
            style={styles.input}
            placeholder="Tìm cơm, bún bò, trà sữa..."
            placeholderTextColor="#A89A90"
            value={query}
            onChangeText={setQuery}
            autoFocus={!initialQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={{ fontSize: 16, color: '#999' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Categories */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'Cơm', label: '🍚 Cơm tấm' },
            { id: 'Món nước', label: '🍜 Món nước' },
            { id: 'Đồ uống', label: '🧋 Trà Sữa' },
            { id: 'Ăn vặt', label: '🍟 Ăn vặt' }
          ].map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, filterCategory === cat.id && styles.chipActive]}
              onPress={() => setFilterCategory(cat.id)}
            >
              <Text style={[styles.chipText, filterCategory === cat.id && styles.chipTextActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color="#BA3D0E" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {query.trim() ? (
            <>
              {displayedRestaurants.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.sectionTitle}>Quán ăn ({displayedRestaurants.length})</Text>
                  {displayedRestaurants.map(r => (
                    <TouchableOpacity
                      key={r.id}
                      style={styles.card}
                      onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: r.id })}
                    >
                      <Image source={{ uri: r.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4' }} style={styles.cardImg} />
                      <View style={styles.cardBody}>
                        <Text style={styles.cardTitle}>{r.name}</Text>
                        <Text style={styles.cardSub} numberOfLines={1}>📍 {r.address}</Text>
                        <Text style={styles.ratingText}>⭐ {r.rating || "4.8"}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {dishes.length > 0 && (
                <View>
                  <Text style={styles.sectionTitle}>Món ăn ({dishes.length})</Text>
                  {dishes.map(d => (
                    <TouchableOpacity
                      key={d.id}
                      style={styles.card}
                      onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: d.restaurant?.id })}
                    >
                      <Image source={{ uri: d.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836' }} style={styles.cardImg} />
                      <View style={styles.cardBody}>
                        <Text style={styles.cardTitle}>{d.name}</Text>
                        <Text style={styles.cardStore}>{d.restaurant?.name}</Text>
                        <Text style={styles.cardPrice}>{d.price?.toLocaleString()}đ</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          ) : (
            <View>
              <Text style={styles.sectionTitle}>Khám phá theo bộ lọc ({displayedRestaurants.length} quán)</Text>
              {displayedRestaurants.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.card}
                  onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: r.id })}
                >
                  <Image source={{ uri: r.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4' }} style={styles.cardImg} />
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{r.name}</Text>
                    <Text style={styles.cardSub} numberOfLines={1}>📍 {r.address}</Text>
                    <Text style={styles.ratingText}>⭐ {r.rating || "4.8"}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

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
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderColor: '#F0ECE8'
  },
  backBtn: { marginRight: 12, padding: 4 },
  inputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDF9F6', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 16, borderWidth: 1, borderColor: '#F1E9E4' },
  input: { flex: 1, fontSize: 14, color: '#2A1608' },
  filterSection: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#F0ECE8' },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#FDF9F6', borderWidth: 1, borderColor: '#F1E9E4', marginRight: 8 },
  chipActive: { backgroundColor: '#BA3D0E', borderColor: '#BA3D0E' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#7A6658' },
  chipTextActive: { color: '#FFF' },
  scrollBody: { padding: 16, paddingBottom: 130 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#2A1608', marginBottom: 12 },
  card: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#F0ECE8', alignItems: 'center', elevation: 1 },
  cardImg: { width: 72, height: 72, borderRadius: 16, backgroundColor: '#DDD' },
  cardBody: { flex: 1, marginLeft: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#2A1608' },
  cardSub: { fontSize: 12, color: '#7A6658', marginTop: 2 },
  cardStore: { fontSize: 11, fontWeight: '700', color: '#BA3D0E', marginTop: 2 },
  cardPrice: { fontSize: 15, fontWeight: '800', color: '#BA3D0E', marginTop: 4 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#4A3B32', marginTop: 4 },
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
