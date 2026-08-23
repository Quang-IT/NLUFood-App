import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';

export default function OrdersScreen({ navigation, user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/user/${user.id}`);
      setOrders(response.data || []);
      setLoading(false);
      setRefreshing(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancelOrder = (orderId) => {
    Alert.alert(
      'Hủy đơn hàng',
      'Bạn có chắc chắn muốn hủy đơn hàng này?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đơn',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.put(`${API_BASE_URL}/orders/${orderId}/status?status=CANCELLED`);
              fetchOrders();
              Alert.alert('Thành công', 'Đã hủy đơn hàng.');
            } catch (e) {
              Alert.alert('Lỗi', 'Không thể hủy đơn hàng.');
            }
          }
        }
      ]
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return { text: '⏳ Đang chờ quán nhận đơn', color: '#E65100', bg: '#FFF3E0' };
      case 'PREPARING': return { text: '👨‍🍳 Quán đang làm món', color: '#1565C0', bg: '#E3F2FD' };
      case 'DELIVERING': return { text: '🛵 Đang giao hàng', color: '#6A1B9A', bg: '#F3E5F5' };
      case 'COMPLETED': return { text: '✓ Đơn hàng hoàn thành', color: '#2E7D32', bg: '#E8F5E9' };
      case 'CANCELLED': return { text: '✕ Đã hủy đơn', color: '#C62828', bg: '#FFEBEE' };
      default: return { text: status, color: '#666', bg: '#EEE' };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#FF6B00" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />}
        >
          {orders.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={64} color="#CCC" />
              <Text style={styles.emptyTitle}>Chưa có đơn hàng nào</Text>
              <Text style={styles.emptySub}>Các đơn hàng bạn đặt sẽ xuất hiện hành trình tại đây!</Text>
            </View>
          ) : (
            orders.map(order => {
              const badge = getStatusBadge(order.status);
              return (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.cardTop}>
                    <Text style={styles.storeName}>{order.restaurant?.name || 'Quán ăn'}</Text>
                    <Text style={styles.orderId}>#{order.id}</Text>
                  </View>

                  {/* Status Badge */}
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusText, { color: badge.color }]}>{badge.text}</Text>
                  </View>

                  {/* Order Items */}
                  <View style={styles.itemsBox}>
                    {order.items?.map((item, idx) => (
                      <Text key={idx} style={styles.itemText}>
                        • {item.menuItem?.name} x{item.quantity} ({item.price?.toLocaleString()}đ)
                      </Text>
                    ))}
                  </View>

                  {/* Shipper Info */}
                  {order.status === 'DELIVERING' && order.driverName && (
                    <View style={styles.driverBox}>
                      <Text style={{ fontSize: 24, marginRight: 10 }}>🛵</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.driverName}>{order.driverName}</Text>
                        <Text style={styles.driverPhone}>{order.driverPhone} • {order.driverLicensePlate}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.cardBottom}>
                    <View>
                      <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
                      <Text style={styles.totalPrice}>{order.totalPrice?.toLocaleString()}đ</Text>
                    </View>

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.chatBtn}
                        onPress={() => navigation.navigate('Chat', { initialRestaurant: order.restaurant })}
                      >
                        <Ionicons name="chatbubbles-outline" size={16} color="#FF6B00" />
                        <Text style={styles.chatBtnText}>Tin nhắn</Text>
                      </TouchableOpacity>

                      {order.status === 'PENDING' && (
                        <TouchableOpacity
                          style={styles.cancelBtn}
                          onPress={() => handleCancelOrder(order.id)}
                        >
                          <Text style={styles.cancelBtnText}>Hủy đơn</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EEE' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#444', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#888', textAlign: 'center', marginHorizontal: 30, marginTop: 4 },
  orderCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#EEE' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storeName: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  orderId: { fontSize: 12, fontWeight: 'bold', color: '#888' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start', marginVertical: 10 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  itemsBox: { backgroundColor: '#F9F9F9', padding: 10, borderRadius: 10, marginBottom: 12 },
  itemText: { fontSize: 13, color: '#444', marginBottom: 2 },
  driverBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E5F5', padding: 10, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E1BEE7' },
  driverName: { fontSize: 13, fontWeight: 'bold', color: '#4A148C' },
  driverPhone: { fontSize: 11, color: '#6A1B9A', marginTop: 1 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: '#EEE', paddingTop: 12 },
  totalLabel: { fontSize: 11, color: '#777' },
  totalPrice: { fontSize: 16, fontWeight: 'bold', color: '#FF6B00' },
  actionRow: { flexDirection: 'row', gap: 8 },
  chatBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0E6', borderWidth: 1, borderColor: '#FF6B00', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  chatBtnText: { fontSize: 12, fontWeight: 'bold', color: '#FF6B00', marginLeft: 4 },
  cancelBtn: { backgroundColor: '#FFEBEE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  cancelBtnText: { fontSize: 12, fontWeight: 'bold', color: '#C62828' }
});
