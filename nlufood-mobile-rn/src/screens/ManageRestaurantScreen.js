import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';

export default function ManageRestaurantScreen({ navigation, user }) {
  const [tab, setTab] = useState('orders'); // 'orders', 'menu'
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  // New item form
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Cơm');

  useEffect(() => {
    fetchOwnerData();
    const interval = setInterval(fetchOwnerData, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchOwnerData = async () => {
    if (!user) return;
    try {
      const resR = await axios.get(`${API_BASE_URL}/restaurants`);
      const myRestaurant = resR.data?.find(r => r.owner?.id === user.id) || resR.data?.[0];
      setRestaurant(myRestaurant);

      if (myRestaurant) {
        const [resO, resM] = await Promise.all([
          axios.get(`${API_BASE_URL}/orders/restaurant/${myRestaurant.id}`),
          axios.get(`${API_BASE_URL}/menu-items/restaurant/${myRestaurant.id}`)
        ]);
        setOrders(resO.data || []);
        setMenuItems(resM.data || []);
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/orders/${orderId}/status?status=${newStatus}`);
      fetchOwnerData();
      Alert.alert('Thành công', 'Đã cập nhật trạng thái đơn hàng!');
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái.');
    }
  };

  const handleAddMenuItem = async () => {
    if (!newItemName.trim() || !newItemPrice.trim() || !restaurant) return;
    try {
      await axios.post(`${API_BASE_URL}/menu-items`, {
        name: newItemName.trim(),
        price: parseFloat(newItemPrice.trim()),
        category: newItemCategory,
        available: true,
        restaurant: { id: restaurant.id }
      });
      setNewItemName('');
      setNewItemPrice('');
      fetchOwnerData();
      Alert.alert('Thành công', 'Đã thêm món mới vào Thực đơn!');
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể thêm món.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Quản lý Quán ăn & Đơn hàng</Text>
          <Text style={styles.subTitle}>{restaurant?.name || 'Quán của bạn'}</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'orders' && styles.tabBtnActive]} onPress={() => setTab('orders')}>
          <Text style={[styles.tabText, tab === 'orders' && styles.tabTextActive]}>Đơn hàng ({orders.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'menu' && styles.tabBtnActive]} onPress={() => setTab('menu')}>
          <Text style={[styles.tabText, tab === 'menu' && styles.tabTextActive]}>Thực đơn ({menuItems.length})</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#FF6B00" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          {tab === 'orders' && (
            <View>
              {orders.length === 0 ? (
                <Text style={styles.emptyText}>Chưa có đơn hàng nào từ sinh viên.</Text>
              ) : (
                orders.map(order => (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.orderTop}>
                      <Text style={styles.orderUser}>👤 Khách hàng #{order.user?.id} ({order.user?.name})</Text>
                      <Text style={styles.orderId}>#{order.id}</Text>
                    </View>

                    <Text style={styles.addressText}>📍 Giao đến: {order.address}</Text>

                    <View style={styles.itemsBox}>
                      {order.items?.map((item, idx) => (
                        <Text key={idx} style={styles.itemText}>• {item.menuItem?.name} x{item.quantity}</Text>
                      ))}
                    </View>

                    <View style={styles.orderBottom}>
                      <Text style={styles.totalText}>Tong: {order.totalPrice?.toLocaleString()}đ</Text>

                      <View style={styles.statusButtons}>
                        {order.status === 'PENDING' && (
                          <TouchableOpacity style={styles.statusBtnBlue} onPress={() => updateOrderStatus(order.id, 'PREPARING')}>
                            <Text style={styles.btnTextWhite}>👨‍🍳 Làm món</Text>
                          </TouchableOpacity>
                        )}
                        {order.status === 'PREPARING' && (
                          <TouchableOpacity style={styles.statusBtnPurple} onPress={() => updateOrderStatus(order.id, 'DELIVERING')}>
                            <Text style={styles.btnTextWhite}>🛵 Giao hàng</Text>
                          </TouchableOpacity>
                        )}
                        {order.status === 'DELIVERING' && (
                          <TouchableOpacity style={styles.statusBtnGreen} onPress={() => updateOrderStatus(order.id, 'COMPLETED')}>
                            <Text style={styles.btnTextWhite}>✓ Hoàn thành</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {tab === 'menu' && (
            <View>
              {/* Add New Item Form */}
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Thêm món ăn mới</Text>
                <TextInput style={styles.input} placeholder="Tên món ăn (VD: Cơm sườn nướng)" value={newItemName} onChangeText={setNewItemName} />
                <TextInput style={styles.input} placeholder="Giá tiền (VD: 35000)" value={newItemPrice} onChangeText={setNewItemPrice} keyboardType="number-pad" />
                <TouchableOpacity style={styles.addBtn} onPress={handleAddMenuItem}>
                  <Text style={styles.addBtnText}>+ Thêm vào Menu</Text>
                </TouchableOpacity>
              </View>

              {/* Existing Menu Items */}
              {menuItems.map(item => (
                <View key={item.id} style={styles.menuRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuName}>{item.name}</Text>
                    <Text style={styles.menuPrice}>{item.price?.toLocaleString()}đ</Text>
                  </View>
                  <Text style={styles.stockBadge}>{item.available ? '🟢 Còn bán' : '🔴 Hết món'}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EEE' },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  subTitle: { fontSize: 12, color: '#777', marginTop: 2 },
  tabRow: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EEE' },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 3, borderColor: '#FF6B00' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#FF6B00', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 14 },
  orderCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#EEE' },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderUser: { fontSize: 14, fontWeight: 'bold', color: '#222' },
  orderId: { fontSize: 12, fontWeight: 'bold', color: '#888' },
  addressText: { fontSize: 12, color: '#666', marginTop: 4 },
  itemsBox: { backgroundColor: '#F9F9F9', padding: 10, borderRadius: 10, marginVertical: 10 },
  itemText: { fontSize: 13, color: '#444' },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: '#EEE', paddingTop: 10 },
  totalText: { fontSize: 15, fontWeight: 'bold', color: '#FF6B00' },
  statusButtons: { flexDirection: 'row', gap: 6 },
  statusBtnBlue: { backgroundColor: '#1565C0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  statusBtnPurple: { backgroundColor: '#6A1B9A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  statusBtnGreen: { backgroundColor: '#2E7D32', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  btnTextWhite: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  formCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#EEE' },
  formTitle: { fontSize: 15, fontWeight: 'bold', color: '#222', marginBottom: 12 },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#DDD', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#333', marginBottom: 10 },
  addBtn: { backgroundColor: '#FF6B00', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  addBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
  menuName: { fontSize: 14, fontWeight: 'bold', color: '#222' },
  menuPrice: { fontSize: 13, fontWeight: 'bold', color: '#FF6B00', marginTop: 2 },
  stockBadge: { fontSize: 12, fontWeight: 'bold', color: '#555' }
});
