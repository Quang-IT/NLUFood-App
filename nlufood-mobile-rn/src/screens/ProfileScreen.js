import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';

export default function ProfileScreen({ user, onUpdateUser, onLogout, navigation }) {
  const [view, setView] = useState('main'); // 'main', 'edit', 'membership'

  const [name, setName] = useState(user?.name || '');
  const [address, setAddress] = useState(user?.address || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [gender, setGender] = useState(user?.gender || 'Nam');
  const [birthYear, setBirthYear] = useState(user?.birthYear ? user.birthYear.toString() : '');
  const [imageUrl, setImageUrl] = useState(user?.imageUrl || '');
  const [membershipTier, setMembershipTier] = useState(user?.membershipTier || 'NORMAL');
  const [loading, setLoading] = useState(false);

  const isOwner = user?.role === 'OWNER';

  const pickAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets?.[0]?.base64) {
      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImageUrl(base64Img);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/users/${user.id}`, {
        name,
        address,
        imageUrl,
        phoneNumber,
        gender,
        birthYear: birthYear ? parseInt(birthYear) : null
      });
      setLoading(false);
      onUpdateUser(response.data);
      await AsyncStorage.setItem('user_session', JSON.stringify(response.data));
      Alert.alert('Thành công', 'Đã cập nhật thông tin hồ sơ!');
      setView('main');
    } catch (e) {
      setLoading(false);
      Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ.');
    }
  };

  const handleSubscribeMembership = async (tier) => {
    Alert.alert(
      'Xác nhận đăng ký',
      `Bạn muốn nâng cấp gói ${tier}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng ký ngay',
          onPress: async () => {
            try {
              const res = await axios.put(`${API_BASE_URL}/users/${user.id}/membership?tier=${tier}`);
              setMembershipTier(tier);
              onUpdateUser(res.data);
              await AsyncStorage.setItem('user_session', JSON.stringify(res.data));
              Alert.alert('🎉 Thành công', `Đã nâng cấp gói ${tier}!`);
              setView('main');
            } catch (e) {
              Alert.alert('Lỗi', 'Không thể đăng ký gói.');
            }
          }
        }
      ]
    );
  };

  const getTierBadge = (t) => {
    switch (t) {
      case 'SILVER': return 'Gói HSSV Tiết Kiệm 🥈';
      case 'GOLD': return 'Gói NLU VIP Pro 🥇';
      case 'DIAMOND': return 'Gói Thần Ăn Nông Lâm 💎';
      default: return 'Thành viên Tiêu chuẩn';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {view !== 'main' && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setView('main')}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>
          {view === 'edit' ? 'Chỉnh sửa hồ sơ' : view === 'membership' ? 'Gói Hội Viên NLU VIP' : 'Hồ sơ tài khoản'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {view === 'main' && (
          <>
            {/* Header Profile Card */}
            <View style={styles.profileCard}>
              <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrapper}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={40} color="#FF6B00" />
                  </View>
                )}
                <View style={styles.cameraIcon}>
                  <Ionicons name="camera" size={14} color="#FFF" />
                </View>
              </TouchableOpacity>

              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>

              <View style={styles.badgeRow}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{isOwner ? 'Đối tác Cửa hàng' : 'Sinh viên NLU'}</Text>
                </View>
                <View style={styles.tierBadge}>
                  <Text style={styles.tierText}>{getTierBadge(user?.membershipTier)}</Text>
                </View>
              </View>
            </View>

            {/* Menu Sections */}
            <View style={styles.menuBox}>
              <TouchableOpacity style={styles.menuItem} onPress={() => setView('membership')}>
                <Ionicons name="ribbon-outline" size={22} color="#FFB800" />
                <Text style={styles.menuItemText}>Gói Hội Viên NLU VIP</Text>
                <Ionicons name="chevron-forward" size={18} color="#CCC" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => setView('edit')}>
                <Ionicons name="create-outline" size={22} color="#FF6B00" />
                <Text style={styles.menuItemText}>Chỉnh sửa thông tin cá nhân</Text>
                <Ionicons name="chevron-forward" size={18} color="#CCC" />
              </TouchableOpacity>

              {isOwner && (
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ManageRestaurant')}>
                  <Ionicons name="storefront-outline" size={22} color="#29B6F6" />
                  <Text style={styles.menuItemText}>Quản lý Quán ăn & Đơn hàng</Text>
                  <Ionicons name="chevron-forward" size={18} color="#CCC" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
              <Ionicons name="log-out-outline" size={20} color="#E53935" />
              <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
            </TouchableOpacity>
          </>
        )}

        {view === 'edit' && (
          <View style={styles.card}>
            <TouchableOpacity onPress={pickAvatar} style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={styles.avatarWrapper}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={40} color="#FF6B00" />
                  </View>
                )}
              </View>
              <Text style={{ color: '#FF6B00', fontWeight: 'bold', fontSize: 13, marginTop: 8 }}>Chạm vào ảnh để đổi Avatar 📸</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Họ và tên</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />

            <Text style={styles.label}>Giới tính</Text>
            <View style={styles.genderRow}>
              {['Nam', 'Nữ', 'Khác'].map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />

            <Text style={styles.label}>Năm sinh</Text>
            <TextInput style={styles.input} value={birthYear} onChangeText={setBirthYear} keyboardType="number-pad" />

            <Text style={styles.label}>Địa chỉ mặc định</Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} />

            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Lưu thay đổi</Text>}
            </TouchableOpacity>
          </View>
        )}

        {view === 'membership' && (
          <View>
            {[
              { id: 'NORMAL', name: 'Gói Tiêu chuẩn', price: 'Miễn phí', desc: 'Đặt đồ ăn tiêu chuẩn NLU' },
              { id: 'SILVER', name: 'Gói HSSV Tiết Kiệm 🥈', price: '19.000đ / tháng', desc: 'Freeship 5 đơn/tháng + Giảm 10% quán NLU' },
              { id: 'GOLD', name: 'Gói NLU VIP Pro 🥇', price: '39.000đ / tháng', desc: 'Freeship 100% mọi đơntừ 40k + Voucher 20k/tuần' },
              { id: 'DIAMOND', name: 'Gói Thần Ăn Nông Lâm 💎', price: '69.000đ / tháng', desc: 'Freeship KHÔNG GIỚI HẠN + Voucher 50k/tuần + Giao hỏa tốc 15p' }
            ].map(pkg => (
              <View key={pkg.id} style={styles.pkgCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.pkgTitle}>{pkg.name}</Text>
                  <Text style={styles.pkgPrice}>{pkg.price}</Text>
                </View>
                <Text style={styles.pkgDesc}>{pkg.desc}</Text>
                {membershipTier === pkg.id ? (
                  <View style={styles.currentPkgBadge}>
                    <Text style={styles.currentPkgText}>✓ Gói hiện tại</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.subBtn} onPress={() => handleSubscribeMembership(pkg.id)}>
                    <Text style={styles.subBtnText}>Đăng ký ngay</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EEE' },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  profileCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#EEE' },
  avatarWrapper: { width: 84, height: 84, borderRadius: 42, overflow: 'hidden', position: 'relative' },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', backgroundColor: '#FFF0E6', justifyContent: 'center', alignItems: 'center' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FF6B00', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderHeight: 2, borderColor: '#FFF' },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#222', marginTop: 10 },
  userEmail: { fontSize: 12, color: '#777', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  roleBadge: { backgroundColor: '#FFF0E6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  roleText: { fontSize: 10, fontWeight: 'bold', color: '#FF6B00' },
  tierBadge: { backgroundColor: '#FFF8E1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  tierText: { fontSize: 10, fontWeight: 'bold', color: '#FF8F00' },
  menuBox: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#EEE', marginBottom: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#F5F5F5' },
  menuItemText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#333', marginLeft: 12 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFEBEE', paddingVertical: 14, borderRadius: 16 },
  logoutText: { fontSize: 14, fontWeight: 'bold', color: '#E53935', marginLeft: 8 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EEE' },
  label: { fontSize: 11, fontWeight: 'bold', color: '#555', uppercase: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#DDD', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#333', marginBottom: 14 },
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  genderBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', alignItems: 'center' },
  genderBtnActive: { backgroundColor: '#FF6B00', borderColor: '#FF6B00' },
  genderText: { fontSize: 13, color: '#555', fontWeight: '600' },
  genderTextActive: { color: '#FFF', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#FF6B00', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  pkgCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#EEE' },
  pkgTitle: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  pkgPrice: { fontSize: 13, fontWeight: 'bold', color: '#FF6B00' },
  pkgDesc: { fontSize: 12, color: '#666', marginTop: 6, marginBottom: 12 },
  subBtn: { backgroundColor: '#FF6B00', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  subBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  currentPkgBadge: { backgroundColor: '#E8F5E9', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  currentPkgText: { color: '#2E7D32', fontSize: 13, fontWeight: 'bold' }
});
