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
  ScrollView
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';

export default function SearchScreen({ navigation, route }) {
  const initialQuery = route.params?.initialQuery || '';
  const [query, setQuery] = useState(initialQuery);
  const [restaurants, setRestaurants] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterSort, setFilterSort] = useState('RECOMMENDED');
  const [filterCategory, setFilterCategory] = useState('ALL');

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
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.inputBox}>
          <Ionicons name="search" size={18} color="#888" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.input}
            placeholder="Tìm cơm, bún bò, trà sữa..."
            value={query}
            onChangeText={setQuery}
            autoFocus={!initialQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* FILTER BAR */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {[
            { id: 'RECOMMENDED', label: 'Được đề xuất 👍' },
            { id: 'RATING', label: 'Đánh giá cao ⭐' },
            { id: 'FREE_SHIP', label: 'Freeship 🛵' },
            { id: 'FAST', label: 'Giao nhanh 15p ⏱️' },
          ].map(f => (
            <TouchableOpacity
              key={f.id}
              style={[styles.chip, filterSort === f.id && styles.chipActive]}
              onPress={() => setFilterSort(f.id)}
            >
              <Text style={[styles.chipText, filterSort === f.id && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'Cơm', label: 'Cơm tấm 🍚' },
            { id: 'Món nước', label: 'Bún / Phở 🍜' },
            { id: 'Đồ uống', label: 'Trà Sữa 🧋' },
            { id: 'Ăn vặt', label: 'Ăn vặt 🍰' }
          ].map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.subChip, filterCategory === c.id && styles.subChipActive]}
              onPress={() => setFilterCategory(c.id)}
            >
              <Text style={[styles.subChipText, filterCategory === c.id && styles.subChipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* RESULTS */}
      {loading ? (
        <ActivityIndicator color="#FF6B00" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {query.trim() !== '' ? (
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  searchHeader: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EEE' },
  backBtn: { marginRight: 12 },
  inputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F2', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14 },
  input: { flex: 1, fontSize: 14, color: '#333' },
  filterSection: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FAFAFA', borderBottomWidth: 1, borderColor: '#EEE' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', marginRight: 8 },
  chipActive: { backgroundColor: '#FF6B00', borderColor: '#FF6B00' },
  chipText: { fontSize: 12, fontWeight: 'bold', color: '#555' },
  chipTextActive: { color: '#FFF' },
  subChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#EEE', marginRight: 6 },
  subChipActive: { backgroundColor: '#333' },
  subChipText: { fontSize: 11, fontWeight: '600', color: '#666' },
  subChipTextActive: { color: '#FFF' },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  card: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#EEE', alignItems: 'center' },
  cardImg: { width: 70, height: 70, borderRadius: 12, backgroundColor: '#DDD' },
  cardBody: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#222' },
  cardSub: { fontSize: 12, color: '#777', marginTop: 2 },
  cardStore: { fontSize: 10, fontWeight: 'bold', color: '#FF6B00', marginTop: 2 },
  cardPrice: { fontSize: 14, fontWeight: 'bold', color: '#FF6B00', marginTop: 4 },
  ratingText: { fontSize: 12, fontWeight: 'bold', color: '#FFB800', marginTop: 4 }
});
