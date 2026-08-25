import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const CATEGORIES = ['Cơm', 'Món nước', 'Đồ uống', 'Ăn vặt'];

const OWNER_REJECT_REASONS = [
  'Quán đã hết nguyên liệu món này',
  'Quán đang quá tải nhiều đơn',
  'Không liên lạc được với khách hàng',
  'Quán sắp đến giờ đóng cửa',
  'Món ăn tạm ngưng phục vụ hôm nay'
];

export default function ManageRestaurantScreen({ navigation, user }) {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'menu'
  const [orderFilter, setOrderFilter] = useState('ALL');

  // Add Dish Modal State
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [dishName, setDishName] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishOriginalPrice, setDishOriginalPrice] = useState('');
  const [dishCategory, setDishCategory] = useState('Cơm');
  const [dishImageUrl, setDishImageUrl] = useState('');
  const [isFlashSale, setIsFlashSale] = useState(false);
  const [savingDish, setSavingDish] = useState(false);

  // Register Restaurant Modal
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regAddress, setRegAddress] = useState('Khu phố 6, Linh Trung, TP. Thủ Đức (Cạnh ĐH Nông Lâm)');
  const [regImageUrl, setRegImageUrl] = useState('');
  const [registering, setRegistering] = useState(false);

  // Owner Reject/Cancel Modal State (Item 3)
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectOrderId, setRejectOrderId] = useState(null);
  const [selectedRejectReason, setSelectedRejectReason] = useState(OWNER_REJECT_REASONS[0]);
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    fetchOwnerRestaurants();
    const interval = setInterval(fetchOrdersAndMenu, 4000);
    return () => clearInterval(interval);
  }, [user, selectedRestaurant]);

  const fetchOwnerRestaurants = async () => {
    if (!user) return;
    try {
      let myRes = [];
      try {
        const res = await axios.get(`${API_BASE_URL}/restaurants/owner/${user.id}`);
        myRes = res.data || [];
      } catch (e) {}

      if (myRes.length === 0) {
        const allRes = await axios.get(`${API_BASE_URL}/restaurants`);
        const found = (allRes.data || []).find(r => r.owner?.id === user.id);
        if (found) myRes = [found];
        else if (allRes.data && allRes.data.length > 0) myRes = [allRes.data[0]];
      }

      setRestaurants(myRes);
      if (myRes.length > 0 && !selectedRestaurant) {
        setSelectedRestaurant(myRes[0]);
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const fetchOrdersAndMenu = async () => {
    if (!selectedRestaurant) return;
    try {
      const [resO, resM] = await Promise.all([
        axios.get(`${API_BASE_URL}/orders/restaurant/${selectedRestaurant.id}`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/restaurants/${selectedRestaurant.id}/menu`).catch(() => ({ data: [] }))
      ]);
      const sortedOrders = (resO.data || []).sort((a, b) => new Date(b.orderTime || 0) - new Date(a.orderTime || 0));
      setOrders(sortedOrders);
      setMenuItems(resM.data || []);
      setRefreshing(false);
    } catch (e) {
      setRefreshing(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus, reason = null) => {
    try {
      let url = `${API_BASE_URL}/orders/${orderId}/status?status=${newStatus}`;
      if (reason) {
        url += `&cancelReason=${encodeURIComponent(reason)}`;
      }
      await axios.put(url);
      fetchOrdersAndMenu();
      Alert.alert('Thành công', 'Đã cập nhật trạng thái đơn hàng!');
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái.');
    }
  };

  const handleOpenRejectModal = (orderId) => {
    setRejectOrderId(orderId);
    setSelectedRejectReason(OWNER_REJECT_REASONS[0]);
    setCustomRejectReason('');
    setShowRejectModal(true);
  };

  const handleConfirmRejectOrder = async () => {
    if (!rejectOrderId) return;
    const finalReason = customRejectReason.trim() ? customRejectReason.trim() : selectedRejectReason;
    setRejecting(true);
    try {
      await handleUpdateOrderStatus(rejectOrderId, 'CANCELLED', finalReason);
      setRejecting(false);
      setShowRejectModal(false);
      Alert.alert('Đã từ chối đơn', `Đã từ chối đơn hàng #${rejectOrderId}.\nLý do: ${finalReason}`);
    } catch (e) {
      setRejecting(false);
      Alert.alert('Lỗi', 'Không thể từ chối đơn hàng.');
    }
  };

  const handleCreateDish = async () => {
    if (!dishName.trim() || !dishPrice.trim() || !selectedRestaurant) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên món và giá bán!');
      return;
    }
    setSavingDish(true);
    const priceNum = parseFloat(dishPrice.trim());
    const origPriceNum = dishOriginalPrice.trim() ? parseFloat(dishOriginalPrice.trim()) : (priceNum * 1.3);

    const payload = {
      name: dishName.trim(),
      price: priceNum,
      originalPrice: origPriceNum,
      category: dishCategory,
      imageUrl: dishImageUrl.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
      isFlashSale: isFlashSale,
      restaurant: { id: selectedRestaurant.id }
    };

    try {
      await axios.post(`${API_BASE_URL}/menu-items`, payload);
      setSavingDish(false);
      setShowAddDishModal(false);
      setDishName('');
      setDishPrice('');
      setDishOriginalPrice('');
      setDishImageUrl('');
      setIsFlashSale(false);
      fetchOrdersAndMenu();
      Alert.alert('Thành công', 'Đã thêm món ăn mới vào Thực đơn quán!');
    } catch (e) {
      setSavingDish(false);
      Alert.alert('Lỗi', 'Không thể thêm món ăn.');
    }
  };

  const handleDeleteDish = (dishId) => {
    Alert.alert(
      'Xóa món ăn',
      'Bạn có chắc chắn muốn xóa món này khỏi thực đơn?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/menu-items/${dishId}`);
              fetchOrdersAndMenu();
              Alert.alert('Thành công', 'Đã xóa món ăn khỏi thực đơn.');
            } catch (e) {
              Alert.alert('Lỗi', 'Không thể xóa món ăn.');
            }
          }
        }
      ]
    );
  };

  const handleRegisterRestaurant = async () => {
    if (!regName.trim() || !regAddress.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên quán và địa chỉ!');
      return;
    }
    setRegistering(true);
    const payload = {
      name: regName.trim(),
      address: regAddress.trim(),
      imageUrl: regImageUrl.trim() || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      rating: 5.0,
      owner: { id: user.id }
    };
    try {
      const res = await axios.post(`${API_BASE_URL}/restaurants`, payload);
      setRegistering(false);
      setShowRegisterModal(false);
      setRestaurants(prev => [...prev, res.data]);
      setSelectedRestaurant(res.data);
      Alert.alert('Thành công', 'Đăng ký quán ăn thành công!');
    } catch (e) {
      setRegistering(false);
      Alert.alert('Lỗi', 'Không thể đăng ký quán ăn.');
    }
  };

  const filteredOrders = orderFilter === 'ALL'
    ? orders
    : orders.filter(o => o.status === orderFilter);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 22, color: '#FFF' }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Quản lý Quán ăn & Đơn hàng</Text>
          <Text style={styles.headerSubTitle}>
            🏪 {selectedRestaurant?.name || 'Chưa đăng ký quán'}
          </Text>
        </View>
        <TouchableOpacity style={styles.addResBtn} onPress={() => setShowRegisterModal(true)}>
          <Text style={styles.addResBtnText}>+ Thêm quán</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'orders' && styles.tabItemActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            📦 Đơn hàng ({orders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'menu' && styles.tabItemActive]}
          onPress={() => setActiveTab('menu')}
        >
          <Text style={[styles.tabText, activeTab === 'menu' && styles.tabTextActive]}>
            🍲 Thực đơn ({menuItems.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#BA3D0E" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrdersAndMenu(); }} />}
          showsVerticalScrollIndicator={false}
        >
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <View>
              {/* Filter Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
                {[
                  { id: 'ALL', label: 'Tất cả' },
                  { id: 'PENDING', label: '⏳ Chờ nhận' },
                  { id: 'PREPARING', label: '👨‍🍳 Đang làm' },
                  { id: 'DELIVERING', label: '🛵 Đang giao' },
                  { id: 'COMPLETED', label: '✓ Hoàn thành' }
                ].map(f => (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.filterChip, orderFilter === f.id && styles.filterChipActive]}
                    onPress={() => setOrderFilter(f.id)}
                  >
                    <Text style={[styles.filterChipText, orderFilter === f.id && styles.filterChipTextActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {filteredOrders.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={{ fontSize: 56, marginBottom: 12 }}>📦</Text>
                  <Text style={styles.emptyTitle}>Chưa có đơn hàng nào</Text>
                  <Text style={styles.emptySub}>
                    Khi sinh viên đặt món từ quán của bạn, đơn hàng sẽ hiển thị tại đây để bạn nhận đơn!
                  </Text>
                </View>
              ) : (
                filteredOrders.map(order => {
                  const studentName = order.student?.name || order.user?.name || 'Sinh viên NLU';
                  const studentPhone = order.student?.phoneNumber || '0912345678';
                  const isPending = order.status === 'PENDING';
                  const isPreparing = order.status === 'PREPARING';
                  const isDelivering = order.status === 'DELIVERING';
                  const isCancelled = order.status === 'CANCELLED';

                  return (
                    <View key={order.id} style={styles.orderCard}>
                      <View style={styles.orderCardHeader}>
                        <View>
                          <Text style={styles.orderCustomerName}>👤 {studentName}</Text>
                          <Text style={styles.orderAddressText}>📍 {order.address || 'KTX Nông Lâm'} • 📞 {studentPhone}</Text>
                        </View>
                        <View style={[styles.orderStatusBadge, isPending ? styles.badgePending : isPreparing ? styles.badgePreparing : isDelivering ? styles.badgeDelivering : styles.badgeCompleted]}>
                          <Text style={styles.orderStatusBadgeText}>
                            {isPending ? '⏳ Chờ duyệt' : isPreparing ? '👨‍🍳 Đang làm' : isDelivering ? '🛵 Đang giao' : isCancelled ? '✕ Đã hủy' : '✓ Xong'}
                          </Text>
                        </View>
                      </View>

                      {/* Cancel reason display (Item 3) */}
                      {isCancelled && order.cancelReason && (
                        <View style={styles.cancelReasonBanner}>
                          <Text style={styles.cancelReasonBannerText}>Lý do hủy: {order.cancelReason}</Text>
                        </View>
                      )}

                      <View style={styles.orderDivider} />

                      {/* Items */}
                      <View style={styles.orderItemsList}>
                        {(order.orderItems || []).map((item, idx) => (
                          <View key={idx} style={styles.orderItemRow}>
                            <Text style={styles.orderItemQty}>{item.quantity}x</Text>
                            <Text style={styles.orderItemName} numberOfLines={1}>{item.menuItem?.name || 'Món ăn'}</Text>
                            <Text style={styles.orderItemPrice}>{(item.price * item.quantity)?.toLocaleString()}đ</Text>
                          </View>
                        ))}
                      </View>

                      <View style={styles.orderDivider} />

                      <View style={styles.orderFooter}>
                        <View>
                          <Text style={styles.orderTotalLabel}>Tổng thu: <Text style={styles.orderTotalPrice}>{order.totalPrice?.toLocaleString()}đ</Text></Text>
                          <Text style={styles.orderPayMethod}>💳 {order.paymentMethod || 'Tiền mặt'}</Text>
                        </View>

                        <View style={styles.orderActionButtons}>
                          {isPending && (
                            <>
                              <TouchableOpacity
                                style={styles.acceptOrderBtn}
                                onPress={() => handleUpdateOrderStatus(order.id, 'PREPARING')}
                              >
                                <Text style={styles.acceptOrderBtnText}>✅ Nhận đơn</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.rejectOrderBtn}
                                onPress={() => handleOpenRejectModal(order.id)}
                              >
                                <Text style={styles.rejectOrderBtnText}>✕ Từ chối</Text>
                              </TouchableOpacity>
                            </>
                          )}

                          {isPreparing && (
                            <TouchableOpacity
                              style={styles.shipOrderBtn}
                              onPress={() => handleUpdateOrderStatus(order.id, 'DELIVERING')}
                            >
                              <Text style={styles.shipOrderBtnText}>🛵 Giao Shipper</Text>
                            </TouchableOpacity>
                          )}

                          {isDelivering && (
                            <TouchableOpacity
                              style={styles.completeOrderBtn}
                              onPress={() => handleUpdateOrderStatus(order.id, 'COMPLETED')}
                            >
                              <Text style={styles.completeOrderBtnText}>✓ Hoàn tất</Text>
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            style={styles.chatCustomerBtn}
                            onPress={() => navigation.navigate('Chat', { initialRestaurant: selectedRestaurant })}
                          >
                            <Text style={styles.chatCustomerBtnText}>💬</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* TAB 2: MENU */}
          {activeTab === 'menu' && (
            <View>
              <View style={styles.menuHeaderRow}>
                <Text style={styles.menuCountTitle}>Danh sách món ăn ({menuItems.length})</Text>
                <TouchableOpacity
                  style={styles.addNewDishBtn}
                  onPress={() => setShowAddDishModal(true)}
                >
                  <Text style={styles.addNewDishBtnText}>+ Thêm món mới</Text>
                </TouchableOpacity>
              </View>

              {menuItems.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={{ fontSize: 56, marginBottom: 12 }}>🍲</Text>
                  <Text style={styles.emptyTitle}>Thực đơn chưa có món nào</Text>
                  <Text style={styles.emptySub}>
                    Hãy bấm nút "+ Thêm món mới" ở trên để đăng các món ăn đặc sắc của quán lên hệ thống!
                  </Text>
                </View>
              ) : (
                menuItems.map(item => (
                  <View key={item.id} style={styles.dishCard}>
                    <Image
                      source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }}
                      style={styles.dishImg}
                    />
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={styles.dishName}>{item.name}</Text>
                      <Text style={styles.dishCat}>Phân loại: {item.category || 'Món chính'}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Text style={styles.dishPrice}>{item.price?.toLocaleString()}đ</Text>
                        {item.isFlashSale && (
                          <View style={styles.flashTag}>
                            <Text style={styles.flashTagText}>⚡ Flash Sale</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity style={styles.deleteDishBtn} onPress={() => handleDeleteDish(item.id)}>
                      <Text style={{ fontSize: 16 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* MODAL TỪ CHỐI ĐƠN HÀNG KÈM LÝ DO CHO CHỦ QUÁN (Item 3) */}
      <Modal visible={showRejectModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Từ chối đơn hàng #{rejectOrderId}</Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <Text style={{ fontSize: 22, color: '#888', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.reasonPrompt}>Vui lòng chọn lý do quán từ chối nhận đơn:</Text>

            {OWNER_REJECT_REASONS.map(reason => {
              const isSelected = selectedRejectReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reasonOption, isSelected && styles.reasonOptionActive]}
                  onPress={() => setSelectedRejectReason(reason)}
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
              value={customRejectReason}
              onChangeText={setCustomRejectReason}
            />

            <TouchableOpacity
              style={styles.confirmRejectBtn}
              onPress={handleConfirmRejectOrder}
              disabled={rejecting}
            >
              {rejecting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmRejectBtnText}>Xác nhận từ chối đơn</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL THÊM MÓN ĂN MỚI */}
      <Modal visible={showAddDishModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm Món Ăn Mới</Text>
              <TouchableOpacity onPress={() => setShowAddDishModal(false)}>
                <Text style={{ fontSize: 22, color: '#888', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>TÊN MÓN ĂN</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ví dụ: Cơm sườn bì chả đặc biệt"
                placeholderTextColor="#A89A90"
                value={dishName}
                onChangeText={setDishName}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>GIÁ BÁN (VNĐ)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="35000"
                    placeholderTextColor="#A89A90"
                    keyboardType="numeric"
                    value={dishPrice}
                    onChangeText={setDishPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>GIÁ GỐC (NẾU GIẢM)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="45000"
                    placeholderTextColor="#A89A90"
                    keyboardType="numeric"
                    value={dishOriginalPrice}
                    onChangeText={setDishOriginalPrice}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>PHÂN LOẠI MÓN</Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChoice, dishCategory === cat && styles.categoryChoiceActive]}
                    onPress={() => setDishCategory(cat)}
                  >
                    <Text style={[styles.categoryChoiceText, dishCategory === cat && styles.categoryChoiceTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>ĐƯỜNG DẪN ẢNH (URL)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor="#A89A90"
                value={dishImageUrl}
                onChangeText={setDishImageUrl}
              />

              {/* Flash Sale Toggle */}
              <TouchableOpacity
                style={[styles.flashToggleBox, isFlashSale && styles.flashToggleBoxActive]}
                onPress={() => setIsFlashSale(!isFlashSale)}
              >
                <Text style={{ fontSize: 20, marginRight: 10 }}>⚡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.flashToggleTitle}>Đưa vào mục Flash Sale Giảm Sốc (50%)</Text>
                  <Text style={styles.flashToggleSub}>Món ăn sẽ xuất hiện nổi bật tại trang chủ sinh viên</Text>
                </View>
                <Text style={{ fontSize: 18 }}>{isFlashSale ? '🔘' : '⚪'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitDishBtn}
                onPress={handleCreateDish}
                disabled={savingDish}
              >
                {savingDish ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitDishBtnText}>Lưu món vào Thực đơn</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL ĐĂNG KÝ QUÁN */}
      <Modal visible={showRegisterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đăng ký Quán Ăn Mới</Text>
              <TouchableOpacity onPress={() => setShowRegisterModal(false)}>
                <Text style={{ fontSize: 22, color: '#888', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>TÊN QUÁN ĂN</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Ví dụ: Cơm Tấm Cô Ba Nông Lâm"
              placeholderTextColor="#A89A90"
              value={regName}
              onChangeText={setRegName}
            />

            <Text style={styles.formLabel}>ĐỊA CHỈ QUÁN</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Địa chỉ khu vực ĐH Nông Lâm..."
              placeholderTextColor="#A89A90"
              value={regAddress}
              onChangeText={setRegAddress}
            />

            <TouchableOpacity
              style={styles.submitDishBtn}
              onPress={handleRegisterRestaurant}
              disabled={registering}
            >
              {registering ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitDishBtnText}>Tạo Quán Ăn</Text>}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#BA3D0E'
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  headerSubTitle: { fontSize: 12, color: '#FFF', opacity: 0.9, marginTop: 2 },
  addResBtn: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  addResBtnText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#F0ECE8' },
  tabItem: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
  tabItemActive: { borderColor: '#BA3D0E' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#7A6658' },
  tabTextActive: { color: '#BA3D0E', fontWeight: '800' },
  scrollContent: { padding: 16, paddingBottom: 120 },
  filterBar: { marginBottom: 14 },
  filterChip: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F0ECE8', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 8 },
  filterChipActive: { backgroundColor: '#BA3D0E', borderColor: '#BA3D0E' },
  filterChipText: { fontSize: 12, fontWeight: '700', color: '#7A6658' },
  filterChipTextActive: { color: '#FFF' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#2A1608' },
  emptySub: { fontSize: 13, color: '#7A6658', textAlign: 'center', marginHorizontal: 30, marginTop: 6, lineHeight: 18 },
  orderCard: { backgroundColor: '#FFF', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: '#F0ECE8', marginBottom: 14, elevation: 2 },
  orderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderCustomerName: { fontSize: 16, fontWeight: '800', color: '#2A1608' },
  orderAddressText: { fontSize: 12, color: '#7A6658', marginTop: 2 },
  orderStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgePending: { backgroundColor: '#FFF3E0' },
  badgePreparing: { backgroundColor: '#E3F2FD' },
  badgeDelivering: { backgroundColor: '#F3E5F5' },
  badgeCompleted: { backgroundColor: '#E8F5E9' },
  orderStatusBadgeText: { fontSize: 11, fontWeight: '800', color: '#2A1608' },
  cancelReasonBanner: { backgroundColor: '#FFF5F5', padding: 8, borderRadius: 10, marginTop: 8, borderWidth: 1, borderColor: '#FFD6D6' },
  cancelReasonBannerText: { fontSize: 11, fontWeight: '800', color: '#C62828' },
  orderDivider: { height: 1, backgroundColor: '#F5F1ED', marginVertical: 12 },
  orderItemsList: { gap: 6 },
  orderItemRow: { flexDirection: 'row', alignItems: 'center' },
  orderItemQty: { fontSize: 13, fontWeight: '800', color: '#BA3D0E', width: 26 },
  orderItemName: { flex: 1, fontSize: 13, color: '#4A3B32' },
  orderItemPrice: { fontSize: 13, fontWeight: '700', color: '#2A1608' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  orderTotalLabel: { fontSize: 12, color: '#7A6658' },
  orderTotalPrice: { fontSize: 16, fontWeight: '900', color: '#BA3D0E' },
  orderPayMethod: { fontSize: 11, color: '#A89A90', marginTop: 2 },
  orderActionButtons: { flexDirection: 'row', gap: 6 },
  acceptOrderBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  acceptOrderBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  rejectOrderBtn: { backgroundColor: '#FFF0F0', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: '#FFD6D6' },
  rejectOrderBtnText: { color: '#E53935', fontSize: 12, fontWeight: '800' },
  shipOrderBtn: { backgroundColor: '#1565C0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  shipOrderBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  completeOrderBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  completeOrderBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  chatCustomerBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFEAE0', justifyContent: 'center', alignItems: 'center' },
  chatCustomerBtnText: { fontSize: 16 },
  menuHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  menuCountTitle: { fontSize: 17, fontWeight: '800', color: '#2A1608' },
  addNewDishBtn: { backgroundColor: '#BA3D0E', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  addNewDishBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  dishCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: '#F0ECE8', marginBottom: 12 },
  dishImg: { width: 68, height: 68, borderRadius: 16 },
  dishName: { fontSize: 15, fontWeight: '700', color: '#2A1608' },
  dishCat: { fontSize: 11, color: '#7A6658', marginTop: 2 },
  dishPrice: { fontSize: 15, fontWeight: '800', color: '#BA3D0E' },
  flashTag: { backgroundColor: '#FFF3E0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
  flashTagText: { fontSize: 10, fontWeight: '800', color: '#E65100' },
  deleteDishBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 19, fontWeight: '800', color: '#2A1608' },
  reasonPrompt: { fontSize: 13, fontWeight: '700', color: '#4A3B32', marginBottom: 10 },
  reasonOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: '#F0ECE8', marginBottom: 8 },
  reasonOptionActive: { borderColor: '#BA3D0E', backgroundColor: '#FFF8F5' },
  reasonText: { fontSize: 13, color: '#7A6658', flex: 1 },
  reasonTextActive: { color: '#BA3D0E', fontWeight: '800' },
  customReasonLabel: { fontSize: 11, fontWeight: '800', color: '#7A6658', marginTop: 8, marginBottom: 6 },
  customReasonInput: { backgroundColor: '#FDF9F6', borderRadius: 14, borderWidth: 1, borderColor: '#F1E9E4', paddingHorizontal: 14, paddingVertical: 8, fontSize: 13, color: '#2A1608', marginBottom: 16 },
  confirmRejectBtn: { backgroundColor: '#E53935', height: 50, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  confirmRejectBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  formLabel: { fontSize: 11, fontWeight: '800', color: '#7A6658', marginBottom: 6, marginTop: 10 },
  formInput: { backgroundColor: '#FDF9F6', borderRadius: 14, borderWidth: 1, borderColor: '#F1E9E4', paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#2A1608' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChoice: { backgroundColor: '#FDF9F6', borderWidth: 1, borderColor: '#F1E9E4', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  categoryChoiceActive: { backgroundColor: '#BA3D0E', borderColor: '#BA3D0E' },
  categoryChoiceText: { fontSize: 13, fontWeight: '700', color: '#7A6658' },
  categoryChoiceTextActive: { color: '#FFF' },
  flashToggleBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E1', borderRadius: 16, padding: 12, marginVertical: 14, borderWidth: 1, borderColor: '#FFE082' },
  flashToggleBoxActive: { borderColor: '#FFA000' },
  flashToggleTitle: { fontSize: 13, fontWeight: '800', color: '#B78103' },
  flashToggleSub: { fontSize: 11, color: '#7A6658', marginTop: 2 },
  submitDishBtn: { backgroundColor: '#BA3D0E', height: 50, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  submitDishBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' }
});
