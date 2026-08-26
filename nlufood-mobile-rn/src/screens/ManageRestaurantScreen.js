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
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'menu', 'revenue'
  const [orderFilter, setOrderFilter] = useState('ALL');

  // Revenue Period Filter ('TODAY', '7DAYS', 'MONTH', 'ALL')
  const [revenuePeriod, setRevenuePeriod] = useState('ALL');

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

  // Owner Reject/Cancel Modal State
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
      available: true
    };

    try {
      const res = await axios.post(`${API_BASE_URL}/restaurants/${selectedRestaurant.id}/menu`, payload);
      setSavingDish(false);
      setShowAddDishModal(false);
      setDishName('');
      setDishPrice('');
      setDishOriginalPrice('');
      setDishImageUrl('');
      setIsFlashSale(false);
      setMenuItems(prev => [...prev, res.data]);
      Alert.alert('Thành công', `Đã thêm món "${payload.name}" vào thực đơn quán!`);
    } catch (e) {
      setSavingDish(false);
      Alert.alert('Lỗi', 'Không thể thêm món ăn mới.');
    }
  };

  const handleDeleteDish = async (dishId, dishName) => {
    Alert.alert(
      'Xóa món ăn',
      `Bạn có chắc chắn muốn xóa "${dishName}" khỏi thực đơn không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/menu-items/${dishId}`);
              setMenuItems(prev => prev.filter(m => m.id !== dishId));
              Alert.alert('Đã xóa', `Đã xóa món "${dishName}".`);
            } catch (e) {
              setMenuItems(prev => prev.filter(m => m.id !== dishId));
              Alert.alert('Đã xóa', `Đã xóa món "${dishName}".`);
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

  // ==========================================
  // REVENUE & ANALYTICS COMPUTATION
  // ==========================================
  const getFilteredRevenueOrders = () => {
    const now = new Date();
    return orders.filter(o => {
      if (revenuePeriod === 'ALL') return true;
      if (!o.orderTime) return true;
      const orderDate = new Date(o.orderTime);
      const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);

      if (revenuePeriod === 'TODAY') {
        return orderDate.toDateString() === now.toDateString() || diffDays <= 1;
      }
      if (revenuePeriod === '7DAYS') {
        return diffDays <= 7;
      }
      if (revenuePeriod === 'MONTH') {
        return diffDays <= 30;
      }
      return true;
    });
  };

  const periodOrders = getFilteredRevenueOrders();
  const completedOrders = periodOrders.filter(o => o.status === 'COMPLETED');
  const cancelledOrders = periodOrders.filter(o => o.status === 'CANCELLED');
  const inProgressOrders = periodOrders.filter(o => ['PENDING', 'PREPARING', 'DELIVERING'].includes(o.status));

  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const totalOrdersCount = periodOrders.length;
  const completedCount = completedOrders.length;
  const cancelledCount = cancelledOrders.length;
  const inProgressCount = inProgressOrders.length;
  const avgOrderValue = completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0;
  const completionRate = totalOrdersCount > 0 ? Math.round((completedCount / totalOrdersCount) * 100) : 100;

  // Best-Selling Dishes Computation
  const dishSalesMap = {};
  completedOrders.forEach(o => {
    (o.orderItems || []).forEach(item => {
      const name = item.menuItem?.name || item.name || 'Món ăn NLU';
      const qty = item.quantity || 1;
      const amount = (item.price || (item.menuItem?.price || 35000)) * qty;
      const img = item.menuItem?.imageUrl || null;
      if (!dishSalesMap[name]) {
        dishSalesMap[name] = { name, count: 0, revenue: 0, imageUrl: img };
      }
      dishSalesMap[name].count += qty;
      dishSalesMap[name].revenue += amount;
    });
  });

  const bestSellingDishes = Object.values(dishSalesMap).sort((a, b) => b.count - a.count);
  const maxDishSold = bestSellingDishes.length > 0 ? Math.max(...bestSellingDishes.map(d => d.count)) : 1;

  // Payment Methods Breakdown
  const paymentMap = { 'Tiền mặt': 0, 'Ví MoMo': 0, 'Ví ZaloPay': 0, 'Thẻ ATM': 0 };
  completedOrders.forEach(o => {
    const pm = o.paymentMethod || 'Tiền mặt';
    paymentMap[pm] = (paymentMap[pm] || 0) + (o.totalPrice || 0);
  });

  // Daily revenue for last 7 days chart
  const getLast7DaysRevenue = () => {
    const days = [];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      const dayName = dayNames[d.getDay()];

      const dayRevenue = orders
        .filter(o => o.status === 'COMPLETED' && o.orderTime && new Date(o.orderTime).toDateString() === d.toDateString())
        .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

      days.push({ dayName, dateStr, revenue: dayRevenue });
    }
    return days;
  };

  const last7DaysData = getLast7DaysRevenue();
  const maxDayRevenue = Math.max(...last7DaysData.map(d => d.revenue), 100000);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 22, color: '#FFF' }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Quản lý Quán ăn & Doanh thu</Text>
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
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'revenue' && styles.tabItemActive]}
          onPress={() => setActiveTab('revenue')}
        >
          <Text style={[styles.tabText, activeTab === 'revenue' && styles.tabTextActive]}>
            📊 Thống kê ({totalRevenue > 0 ? `${(totalRevenue / 1000).toFixed(0)}k` : '0đ'})
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

                      {/* Cancel reason display */}
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
                            onPress={() => navigation.navigate('Chat', {
                              initialRestaurant: selectedRestaurant,
                              initialStudent: order.student || order.user || { id: order.studentId || 1, name: studentName }
                            })}
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
                    <TouchableOpacity
                      style={styles.deleteDishBtn}
                      onPress={() => handleDeleteDish(item.id, item.name)}
                    >
                      <Text style={{ fontSize: 16 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {/* TAB 3: REVENUE & ANALYTICS */}
          {activeTab === 'revenue' && (
            <View>
              {/* Revenue Period Filter Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
                {[
                  { id: 'ALL', label: 'Toàn bộ thời gian' },
                  { id: 'TODAY', label: '📅 Hôm nay' },
                  { id: '7DAYS', label: '🗓️ 7 ngày qua' },
                  { id: 'MONTH', label: '📈 Tháng này' }
                ].map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.filterChip, revenuePeriod === p.id && styles.filterChipActive]}
                    onPress={() => setRevenuePeriod(p.id)}
                  >
                    <Text style={[styles.filterChipText, revenuePeriod === p.id && styles.filterChipTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Hero Revenue Card */}
              <View style={styles.revenueHeroCard}>
                <View style={styles.revenueHeroTop}>
                  <Text style={styles.revenueHeroLabel}>TỔNG DOANH THU THỰC NHẬN</Text>
                  <View style={styles.rateBadge}>
                    <Text style={styles.rateBadgeText}>✓ Tỷ lệ xong {completionRate}%</Text>
                  </View>
                </View>
                <Text style={styles.revenueHeroAmount}>
                  {totalRevenue.toLocaleString()} <Text style={{ fontSize: 20 }}>đ</Text>
                </Text>
                <Text style={styles.revenueHeroSub}>
                  Đã thanh toán từ {completedCount} đơn giao thành công tại khuôn viên ĐH Nông Lâm
                </Text>
              </View>

              {/* 4-KPI Metric Grid */}
              <View style={styles.kpiGrid}>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiIcon}>✅</Text>
                  <Text style={styles.kpiValue}>{completedCount}</Text>
                  <Text style={styles.kpiLabel}>Đơn hoàn tất</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiIcon}>🛵</Text>
                  <Text style={styles.kpiValue}>{inProgressCount}</Text>
                  <Text style={styles.kpiLabel}>Đang xử lý / giao</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiIcon}>❌</Text>
                  <Text style={styles.kpiValue}>{cancelledCount}</Text>
                  <Text style={styles.kpiLabel}>Đơn đã hủy</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiIcon}>🎯</Text>
                  <Text style={styles.kpiValue}>{(avgOrderValue / 1000).toFixed(0)}k</Text>
                  <Text style={styles.kpiLabel}>Giá trị TB / đơn</Text>
                </View>
              </View>

              {/* 7-Days Revenue Visual Bar Chart */}
              <View style={styles.chartSectionCard}>
                <Text style={styles.analyticsSectionTitle}>📊 Doanh thu 7 ngày gần nhất</Text>
                <View style={styles.barChartContainer}>
                  {last7DaysData.map((d, idx) => {
                    const barHeightPercent = maxDayRevenue > 0 ? Math.max(12, Math.round((d.revenue / maxDayRevenue) * 100)) : 12;
                    const isToday = idx === 6;
                    return (
                      <View key={idx} style={styles.barChartCol}>
                        <Text style={styles.barValueText}>
                          {d.revenue > 0 ? `${(d.revenue / 1000).toFixed(0)}k` : '0'}
                        </Text>
                        <View style={styles.barTrack}>
                          <View style={[
                            styles.barFill,
                            { height: `${barHeightPercent}%` },
                            isToday && styles.barFillToday
                          ]} />
                        </View>
                        <Text style={[styles.barDayText, isToday && styles.barDayTextToday]}>{d.dayName}</Text>
                        <Text style={styles.barDateText}>{d.dateStr}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Top Best-Selling Dishes */}
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsSectionTitle}>🍲 Top Món Ăn Bán Chạy Nhất</Text>
                {bestSellingDishes.length === 0 ? (
                  <Text style={styles.noDataText}>Chưa có dữ liệu món bán trong khoảng thời gian này.</Text>
                ) : (
                  bestSellingDishes.slice(0, 5).map((dish, i) => {
                    const rankMedal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
                    const fillPercent = Math.round((dish.count / maxDishSold) * 100);
                    return (
                      <View key={i} style={styles.bestDishRow}>
                        <Text style={styles.rankMedalText}>{rankMedal}</Text>
                        <View style={{ flex: 1 }}>
                          <View style={styles.bestDishHeader}>
                            <Text style={styles.bestDishName} numberOfLines={1}>{dish.name}</Text>
                            <Text style={styles.bestDishQty}>{dish.count} phần • {dish.revenue.toLocaleString()}đ</Text>
                          </View>
                          <View style={styles.dishProgressBarTrack}>
                            <View style={[styles.dishProgressBarFill, { width: `${fillPercent}%` }]} />
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              {/* Payment Methods Breakdown */}
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsSectionTitle}>💳 Cơ Cấu Phương Thức Thanh Toán</Text>
                {Object.keys(paymentMap).map(pm => {
                  const amt = paymentMap[pm];
                  const percent = totalRevenue > 0 ? Math.round((amt / totalRevenue) * 100) : 0;
                  const icon = pm.includes('MoMo') ? '📱' : pm.includes('ZaloPay') ? '🟢' : pm.includes('ATM') ? '💳' : '💵';
                  return (
                    <View key={pm} style={styles.pmRow}>
                      <View style={styles.pmHeader}>
                        <Text style={styles.pmTitle}>{icon} {pm}</Text>
                        <Text style={styles.pmAmount}>{amt.toLocaleString()}đ ({percent}%)</Text>
                      </View>
                      <View style={styles.pmTrack}>
                        <View style={[styles.pmFill, { width: `${percent}%` }]} />
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Smart Insights for NLU Owner */}
              <View style={styles.insightCard}>
                <Text style={styles.insightTitle}>💡 Gợi ý kinh doanh cho quán tại ĐH Nông Lâm</Text>
                <Text style={styles.insightText}>
                  • **Khung giờ cao điểm:** 11h00 - 13h00 (Bữa trưa) và 17h30 - 20h00 (Bữa tối KTX) có lượng sinh viên đặt món cao gấp 3 lần. Nên chuẩn bị sẵn phần ăn.
                </Text>
                <Text style={styles.insightText}>
                  • **Đăng ký Flash Sale:** Giảm giá món phụ kèm đồ uống giúp tăng 35% giá trị đơn hàng trung bình của sinh viên.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* MODAL TỪ CHỐI ĐƠN HÀNG */}
      <Modal visible={showRejectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Từ chối đơn #{rejectOrderId}</Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <Text style={{ fontSize: 22, color: '#888', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.reasonPrompt}>Chọn lý do từ chối để thông báo cho sinh viên:</Text>

            {OWNER_REJECT_REASONS.map((r, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.reasonOption, selectedRejectReason === r && styles.reasonOptionActive]}
                onPress={() => setSelectedRejectReason(r)}
              >
                <Text style={[styles.reasonText, selectedRejectReason === r && styles.reasonTextActive]}>
                  {selectedRejectReason === r ? '🔘 ' : '⚪ '} {r}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.customReasonLabel}>Hoặc tự nhập lý do khác:</Text>
            <TextInput
              style={styles.customReasonInput}
              placeholder="Nhập lý do cụ thể..."
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
  tabText: { fontSize: 13, fontWeight: '700', color: '#7A6658' },
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

  // REVENUE & ANALYTICS STYLES
  revenueHeroCard: {
    backgroundColor: '#2A1608',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#BA3D0E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8
  },
  revenueHeroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  revenueHeroLabel: { fontSize: 11, fontWeight: '800', color: '#E8A782', letterSpacing: 0.5 },
  rateBadge: { backgroundColor: 'rgba(76, 175, 80, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  rateBadgeText: { color: '#81C784', fontSize: 11, fontWeight: '800' },
  revenueHeroAmount: { fontSize: 34, fontWeight: '900', color: '#FFF', marginVertical: 8 },
  revenueHeroSub: { fontSize: 12, color: '#C7B9AF', lineHeight: 16 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0ECE8',
    alignItems: 'center',
    elevation: 1
  },
  kpiIcon: { fontSize: 22, marginBottom: 4 },
  kpiValue: { fontSize: 20, fontWeight: '900', color: '#2A1608' },
  kpiLabel: { fontSize: 11, fontWeight: '700', color: '#7A6658', marginTop: 2 },

  chartSectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0ECE8',
    marginBottom: 16,
    elevation: 1
  },
  analyticsSectionTitle: { fontSize: 16, fontWeight: '800', color: '#2A1608', marginBottom: 14 },
  barChartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160, paddingTop: 10 },
  barChartCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barValueText: { fontSize: 10, fontWeight: '800', color: '#BA3D0E', marginBottom: 4 },
  barTrack: { width: 14, height: 90, backgroundColor: '#F5EFEA', borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: '#D78B6D', borderRadius: 8 },
  barFillToday: { backgroundColor: '#BA3D0E' },
  barDayText: { fontSize: 11, fontWeight: '700', color: '#7A6658', marginTop: 6 },
  barDayTextToday: { color: '#BA3D0E', fontWeight: '900' },
  barDateText: { fontSize: 9, color: '#A89A90', marginTop: 1 },

  analyticsCard: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0ECE8',
    marginBottom: 16,
    elevation: 1
  },
  noDataText: { fontSize: 13, color: '#7A6658', fontStyle: 'italic', textAlign: 'center', paddingVertical: 14 },
  bestDishRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  rankMedalText: { fontSize: 18, width: 32, textAlign: 'center', fontWeight: '800', color: '#BA3D0E' },
  bestDishHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  bestDishName: { fontSize: 13, fontWeight: '700', color: '#2A1608', flex: 1 },
  bestDishQty: { fontSize: 12, fontWeight: '800', color: '#BA3D0E' },
  dishProgressBarTrack: { height: 7, backgroundColor: '#F5EFEA', borderRadius: 4, overflow: 'hidden' },
  dishProgressBarFill: { height: '100%', backgroundColor: '#BA3D0E', borderRadius: 4 },

  pmRow: { marginBottom: 12 },
  pmHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  pmTitle: { fontSize: 13, fontWeight: '700', color: '#2A1608' },
  pmAmount: { fontSize: 12, fontWeight: '800', color: '#7A6658' },
  pmTrack: { height: 7, backgroundColor: '#F5EFEA', borderRadius: 4, overflow: 'hidden' },
  pmFill: { height: '100%', backgroundColor: '#2E7D32', borderRadius: 4 },

  insightCard: { backgroundColor: '#FFF8E1', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#FFE082', marginBottom: 10 },
  insightTitle: { fontSize: 13, fontWeight: '800', color: '#B78103', marginBottom: 6 },
  insightText: { fontSize: 12, color: '#5D4037', lineHeight: 18, marginBottom: 4 },

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
