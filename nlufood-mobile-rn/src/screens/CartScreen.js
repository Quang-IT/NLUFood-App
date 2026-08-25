import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';

export default function CartScreen({ navigation, cart, setCart, user }) {
  const [address, setAddress] = useState(user?.address || 'Ký túc xá A, ĐH Nông Lâm');
  const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [loading, setLoading] = useState(false);

  const itemsTotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const deliveryFee = 15000;
  const promoDiscount = appliedPromo ? appliedPromo.discountAmount : 0;
  const momoDiscount = paymentMethod === 'Ví MoMo' && itemsTotal >= 50000 ? Math.round(itemsTotal * 0.15) : 0;
  const totalDiscount = promoDiscount + momoDiscount;
  const grandTotal = Math.max(0, itemsTotal + deliveryFee - totalDiscount);

  const updateQuantity = (id, delta) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.id === id) {
          const newQty = i.quantity + delta;
          return newQty > 0 ? { ...i, quantity: newQty } : null;
        }
        return i;
      }).filter(Boolean);
    });
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/promocodes/validate`, {
        params: { code: promoCode.trim(), orderValue: itemsTotal }
      });
      if (response.data.success) {
        setAppliedPromo(response.data);
        Alert.alert('Thành công', `Áp dụng mã '${response.data.code}' thành công! Giảm ${response.data.discountAmount.toLocaleString()}đ`);
      } else {
        Alert.alert('Lỗi', response.data.message);
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể áp dụng mã.');
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Thông báo', 'Giỏ hàng của bạn đang trống!');
      return;
    }
    setLoading(true);

    const restaurantId = cart[0]?.restaurant?.id || 1;
    const payload = {
      user: { id: user.id },
      restaurant: { id: restaurantId },
      totalPrice: grandTotal,
      address,
      paymentMethod,
      items: cart.map(i => ({
        menuItem: { id: i.id },
        quantity: i.quantity,
        price: i.price
      }))
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/orders`, payload);
      setLoading(false);
      setCart([]);
      Alert.alert(
        '🎉 Đặt hàng thành công!',
        `Mã đơn hàng #${response.data.id}. Quán ăn đã nhận đơn và đang chuẩn bị món cho bạn!`,
        [{ text: 'Xem đơn hàng', onPress: () => navigation.navigate('Orders') }]
      );
    } catch (e) {
      setLoading(false);
      Alert.alert('Lỗi đặt hàng', 'Không thể tạo đơn hàng.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng của bạn</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {cart.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="cart-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
            <Text style={styles.emptySub}>Hãy chọn các món ăn ưa thích từ trang chủ để đặt món nhé!</Text>
          </View>
        ) : (
          <>
            {/* Cart Items List */}
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Món ăn đã chọn ({cart.length})</Text>
              {cart.map(item => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>{item.price?.toLocaleString()}đ</Text>
                  </View>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, -1)}>
                      <Ionicons name="remove" size={16} color="#555" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, 1)}>
                      <Ionicons name="add" size={16} color="#555" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Address */}
            <View style={styles.card}>
              <Text style={styles.cardHeader}>📍 Địa chỉ giao hàng</Text>
              <TextInput
                style={styles.addressInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Nhập địa chỉ KTX hoặc Giảng đường..."
              />
            </View>

            {/* Promo Code */}
            <View style={styles.card}>
              <Text style={styles.cardHeader}>🎁 Khuyến mãi Sinh viên</Text>
              <View style={styles.promoRow}>
                <TextInput
                  style={styles.promoInput}
                  placeholder="Nhập mã (NLUSTUDENT...)"
                  value={promoCode}
                  onChangeText={t => setPromoCode(t.toUpperCase())}
                />
                <TouchableOpacity style={styles.promoBtn} onPress={handleApplyPromo}>
                  <Text style={styles.promoBtnText}>Áp dụng</Text>
                </TouchableOpacity>
              </View>
              {appliedPromo && (
                <Text style={styles.appliedText}>✓ Đã áp dụng mã {appliedPromo.code} (-{appliedPromo.discountAmount.toLocaleString()}đ)</Text>
              )}
            </View>

            {/* Payment Method */}
            <View style={styles.card}>
              <Text style={styles.cardHeader}>💳 Phương thức thanh toán</Text>
              {[
                { id: 'Tiền mặt', label: 'Tiền mặt khi nhận hàng (COD)', icon: 'cash-outline' },
                { id: 'Ví MoMo', label: 'Ví MoMo (Giảm 15% đơn > 50k)', icon: 'wallet-outline' },
                { id: 'ZaloPay', label: 'Ví ZaloPay', icon: 'qr-code-outline' },
                { id: 'Thẻ ATM', label: 'Thẻ ngân hàng ATM / VISA', icon: 'card-outline' }
              ].map(pm => (
                <TouchableOpacity
                  key={pm.id}
                  style={[styles.payOption, paymentMethod === pm.id && styles.payOptionActive]}
                  onPress={() => setPaymentMethod(pm.id)}
                >
                  <Ionicons name={pm.icon} size={20} color={paymentMethod === pm.id ? "#FF6B00" : "#777"} />
                  <Text style={[styles.payOptionText, paymentMethod === pm.id && styles.payOptionTextActive]}>{pm.label}</Text>
                  {paymentMethod === pm.id && <Ionicons name="checkmark-circle" size={20} color="#FF6B00" />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Price Summary */}
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Chi tiết thanh toán</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tiền món ăn:</Text>
                <Text style={styles.summaryVal}>{itemsTotal.toLocaleString()}đ</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phí giao hàng NLU:</Text>
                <Text style={styles.summaryVal}>{deliveryFee.toLocaleString()}đ</Text>
              </View>
              {totalDiscount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: '#2E7D32' }]}>Tổng giảm giá:</Text>
                  <Text style={[styles.summaryVal, { color: '#2E7D32' }]}>-{totalDiscount.toLocaleString()}đ</Text>
                </View>
              )}
              <View style={[styles.summaryRow, { borderTopWidth: 1, borderColor: '#EEE', paddingTop: 10, marginTop: 6 }]}>
                <Text style={styles.grandLabel}>Tổng thanh toán:</Text>
                <Text style={styles.grandVal}>{grandTotal.toLocaleString()}đ</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Footer Place Order Button */}
      {cart.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.orderBtn} onPress={handlePlaceOrder} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.orderBtnText}>Xác nhận đặt hàng ({grandTotal.toLocaleString()}đ)</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EEE' },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#444', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#888', textAlign: 'center', marginHorizontal: 30, marginTop: 4 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#EEE' },
  cardHeader: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemName: { fontSize: 14, fontWeight: 'bold', color: '#222' },
  itemPrice: { fontSize: 13, color: '#FF6B00', fontWeight: 'bold', marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  qtyBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 14, fontWeight: 'bold', marginHorizontal: 8, color: '#333' },
  addressInput: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#DDD', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#333' },
  promoRow: { flexDirection: 'row', gap: 10 },
  promoInput: { flex: 1, backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#DDD', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: '#333' },
  promoBtn: { backgroundColor: '#FF6B00', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  promoBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  appliedText: { fontSize: 12, color: '#2E7D32', fontWeight: 'bold', marginTop: 8 },
  payOption: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#DDD', borderRadius: 12, marginBottom: 8 },
  payOptionActive: { borderColor: '#FF6B00', backgroundColor: '#FFF0E6' },
  payOptionText: { flex: 1, fontSize: 13, color: '#555', marginLeft: 10 },
  payOptionTextActive: { fontWeight: 'bold', color: '#FF6B00' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontSize: 13, color: '#666' },
  summaryVal: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  grandLabel: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  grandVal: { fontSize: 18, fontWeight: 'bold', color: '#FF6B00' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 16, borderTopWidth: 1, borderColor: '#EEE' },
  orderBtn: { backgroundColor: '#FF6B00', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  orderBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
