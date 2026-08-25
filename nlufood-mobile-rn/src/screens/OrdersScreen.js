import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  Modal,
  TextInput
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const STUDENT_CANCEL_REASONS = [
  'Đổi ý không muốn ăn nữa',
  'Đặt nhầm món / nhầm số lượng',
  'Nhập sai địa chỉ giao hàng KTX',
  'Quán chuẩn bị món quá lâu',
  'Có việc bận đột xuất'
];

export default function OrdersScreen({ navigation, user, setCart }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('current'); // 'current' vs 'history'

  // Student Cancel Modal State (Item 3)
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderIdToCancel, setSelectedOrderIdToCancel] = useState(null);
  const [selectedReason, setSelectedReason] = useState(STUDENT_CANCEL_REASONS[0]);
  const [customReasonText, setCustomReasonText] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/orders/student/${user.id}`);
      } catch (e) {
        res = await axios.get(`${API_BASE_URL}/orders/user/${user.id}`);
      }
      const sorted = (res.data || []).sort((a, b) => new Date(b.orderTime || 0) - new Date(a.orderTime || 0));
      setOrders(sorted);
      setLoading(false);
      setRefreshing(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenCancelModal = (orderId) => {
    setSelectedOrderIdToCancel(orderId);
    setSelectedReason(STUDENT_CANCEL_REASONS[0]);
    setCustomReasonText('');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrderIdToCancel) return;
    const finalReason = customReasonText.trim() ? customReasonText.trim() : selectedReason;
    setCancelling(true);

    try {
      await axios.put(`${API_BASE_URL}/orders/${selectedOrderIdToCancel}/status?status=CANCELLED&cancelReason=${encodeURIComponent(finalReason)}`);
      setCancelling(false);
      setShowCancelModal(false);
      fetchOrders();
      Alert.alert('Đã hủy đơn', `Đơn hàng #${selectedOrderIdToCancel} đã được hủy.\nLý do: ${finalReason}`);
    } catch (e) {
      setCancelling(false);
      Alert.alert('Lỗi', 'Không thể hủy đơn hàng.');
    }
  };

  const handleReorder = (order) => {
    if (order.orderItems && order.orderItems.length > 0) {
      const newItems = order.orderItems.map(oi => ({
        id: oi.menuItem?.id || oi.id,
        name: oi.menuItem?.name || 'Món ăn',
        price: oi.price || 30000,
        quantity: oi.quantity || 1,
        imageUrl: oi.menuItem?.imageUrl,
        restaurant: order.restaurant
      }));
      setCart(newItems);
      Alert.alert('Thành công', 'Đã thêm các món vào giỏ hàng!', [
        { text: 'Xem giỏ hàng', onPress: () => navigation.navigate('Cart') }
      ]);
    }
  };

  const getStatusBadge = (status, cancelReason) => {
    switch (status) {
      case 'PENDING': return { text: '⏳ Đang chờ quán nhận đơn', color: '#E65100', bg: '#FFF3E0' };
      case 'PREPARING': return { text: '👨‍🍳 Quán đang chuẩn bị món', color: '#1565C0', bg: '#E3F2FD' };
      case 'DELIVERING': return { text: '🛵 Đang giao đến KTX', color: '#6A1B9A', bg: '#F3E5F5' };
      case 'COMPLETED': return { text: '✓ Đã hoàn thành', color: '#2E7D32', bg: '#E8F5E9' };
      case 'CANCELLED': return { text: '✕ Đã hủy', color: '#C62828', bg: '#FFEBEE' };
      default: return { text: status, color: '#666', bg: '#EEE' };
    }
  };

  const currentOrders = orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
  const historyOrders = orders.filter(o => o.status === 'COMPLETED' || o.status === 'CANCELLED');
  const displayedOrders = activeTab === 'current' ? currentOrders : historyOrders;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'current' && styles.tabBtnActive]}
          onPress={() => setActiveTab('current')}
        >
          <Text style={[styles.tabText, activeTab === 'current' && styles.tabTextActive]}>
            🛵 Đang giao ({currentOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            📜 Lịch sử đơn ({historyOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#BA3D0E" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />}
          showsVerticalScrollIndicator={false}
        >
          {displayedOrders.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 56, marginBottom: 12 }}>{activeTab === 'current' ? '🛵' : '📜'}</Text>
              <Text style={styles.emptyTitle}>
                {activeTab === 'current' ? 'Không có đơn hàng nào đang giao' : 'Chưa có lịch sử đơn hàng'}
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === 'current'
                  ? 'Hãy chọn món và đặt hàng từ các quán ăn yêu thích nhé!'
                  : 'Các đơn hàng đã hoàn tất hoặc đã hủy sẽ được lưu trữ tại đây.'}
              </Text>
            </View>
          ) : (
            displayedOrders.map(order => {
              const badge = getStatusBadge(order.status, order.cancelReason);
              return (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.cardTop}>
                    <View>
                      <Text style={styles.storeName}>{order.restaurant?.name || 'Quán Ăn Nông Lâm'}</Text>
                      <Text style={styles.orderIdText}>Mã đơn: #{order.id} • {order.orderTime ? new Date(order.orderTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.statusText, { color: badge.color }]}>{badge.text}</Text>
                    </View>
                  </View>

                  {/* Cancel Reason display (Item 3) */}
                  {order.status === 'CANCELLED' && order.cancelReason && (
                    <View style={styles.cancelReasonBox}>
                      <Text style={styles.cancelReasonLabel}>Lý do hủy: <Text style={styles.cancelReasonVal}>{order.cancelReason}</Text></Text>
                    </View>
                  )}

                  <View style={styles.divider} />

                  {/* Order Items */}
                  <View style={styles.itemsBox}>
                    {(order.orderItems || []).map((item, idx) => (
                      <View key={idx} style={styles.orderItemRow}>
                        <Text style={styles.itemQty}>{item.quantity}x</Text>
                        <Text style={styles.itemTitle} numberOfLines={1}>{item.menuItem?.name || 'Món ăn'}</Text>
                        <Text style={styles.itemPrice}>{(item.price * item.quantity)?.toLocaleString()}đ</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.cardBottom}>
                    <View>
                      <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
                      <Text style={styles.totalPrice}>{order.totalPrice?.toLocaleString()}đ</Text>
                    </View>

                    <View style={styles.actionRow}>
                      {order.status === 'PENDING' && (
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => handleOpenCancelModal(order.id)}>
                          <Text style={styles.cancelBtnText}>✕ Hủy đơn</Text>
                        </TouchableOpacity>
                      )}

                      {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                        <TouchableOpacity
                          style={styles.chatBtn}
                          onPress={() => navigation.navigate('Chat', { initialRestaurant: order.restaurant })}
                        >
                          <Text style={styles.chatBtnText}>💬 Nhắn quán</Text>
                        </TouchableOpacity>
                      )}

                      {(order.status === 'COMPLETED' || order.status === 'CANCELLED') && (
                        <TouchableOpacity style={styles.reorderBtn} onPress={() => handleReorder(order)}>
                          <Text style={styles.reorderBtnText}>🛒 Đặt lại</Text>
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

      {/* ======================================================= */}
      {/* MODAL HỦY ĐƠN KÈM LÝ DO CHO SINH VIÊN (Item 3)           */}
      {/* ======================================================= */}
      <Modal visible={showCancelModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hủy đơn hàng #{selectedOrderIdToCancel}</Text>
              <TouchableOpacity onPress={() => setShowCancelModal(false)}>
                <Text style={{ fontSize: 22, color: '#888', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.reasonPrompt}>Vui lòng chọn lý do bạn muốn hủy đơn:</Text>

            {STUDENT_CANCEL_REASONS.map(reason => {
              const isSelected = selectedReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reasonOption, isSelected && styles.reasonOptionActive]}
                  onPress={() => setSelectedReason(reason)}
                >
                  <Text style={{ fontSize: 16, marginRight: 8 }}>{isSelected ? '🔘' : '⚪'}</Text>
                  <Text style={[styles.reasonText, isSelected && styles.reasonTextActive]}>{reason}</Text>
                </TouchableOpacity>
              );
            })}

            <Text style={styles.customReasonLabel}>Hoặc tự nhập lý do khác:</Text>
            <TextInput
              style={styles.customReasonInput}
              placeholder="Nhập lý do chi tiết..."
              placeholderTextColor="#A89A90"
              value={customReasonText}
              onChangeText={setCustomReasonText}
            />

            <TouchableOpacity
              style={styles.confirmCancelBtn}
              onPress={handleConfirmCancel}
              disabled={cancelling}
            >
              {cancelling ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmCancelBtnText}>Xác nhận hủy đơn hàng</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  header: {
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderColor: '#F0ECE8'
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#2A1608' },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0ECE8',
    margin: 16,
    borderRadius: 18,
    padding: 4
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#FFFFFF', elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '700', color: '#7A6658' },
  tabTextActive: { color: '#BA3D0E', fontWeight: '800' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 120 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#2A1608' },
  emptySub: { fontSize: 13, color: '#7A6658', textAlign: 'center', marginHorizontal: 30, marginTop: 6, lineHeight: 18 },
  orderCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#F0ECE8', marginBottom: 14, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  storeName: { fontSize: 16, fontWeight: '800', color: '#2A1608' },
  orderIdText: { fontSize: 11, color: '#A89A90', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800' },
  cancelReasonBox: { backgroundColor: '#FFF5F5', padding: 10, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: '#FFE0E0' },
  cancelReasonLabel: { fontSize: 12, fontWeight: '800', color: '#C62828' },
  cancelReasonVal: { fontWeight: '500', color: '#555' },
  divider: { height: 1, backgroundColor: '#F5F1ED', marginVertical: 12 },
  itemsBox: { gap: 6 },
  orderItemRow: { flexDirection: 'row', alignItems: 'center' },
  itemQty: { fontSize: 13, fontWeight: '800', color: '#BA3D0E', width: 26 },
  itemTitle: { flex: 1, fontSize: 13, color: '#4A3B32' },
  itemPrice: { fontSize: 13, fontWeight: '700', color: '#2A1608' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 11, color: '#7A6658' },
  totalPrice: { fontSize: 16, fontWeight: '900', color: '#BA3D0E' },
  actionRow: { flexDirection: 'row', gap: 8 },
  cancelBtn: { backgroundColor: '#FFF0F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: '#FFD6D6' },
  cancelBtnText: { color: '#E53935', fontSize: 12, fontWeight: '800' },
  chatBtn: { backgroundColor: '#FFEAE0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  chatBtnText: { color: '#BA3D0E', fontSize: 12, fontWeight: '800' },
  reorderBtn: { backgroundColor: '#BA3D0E', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  reorderBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#2A1608' },
  reasonPrompt: { fontSize: 13, fontWeight: '700', color: '#4A3B32', marginBottom: 10 },
  reasonOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: '#F0ECE8', marginBottom: 8 },
  reasonOptionActive: { borderColor: '#BA3D0E', backgroundColor: '#FFF8F5' },
  reasonText: { fontSize: 13, color: '#7A6658', flex: 1 },
  reasonTextActive: { color: '#BA3D0E', fontWeight: '800' },
  customReasonLabel: { fontSize: 11, fontWeight: '800', color: '#7A6658', marginTop: 8, marginBottom: 6 },
  customReasonInput: { backgroundColor: '#FDF9F6', borderRadius: 14, borderWidth: 1, borderColor: '#F1E9E4', paddingHorizontal: 14, paddingVertical: 8, fontSize: 13, color: '#2A1608', marginBottom: 16 },
  confirmCancelBtn: { backgroundColor: '#E53935', height: 50, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  confirmCancelBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' }
});
