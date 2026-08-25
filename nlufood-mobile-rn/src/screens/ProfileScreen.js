import React, { useState, useEffect } from 'react';
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
  const [vipPackages, setVipPackages] = useState([]);
  const [loadingVip, setLoadingVip] = useState(false);

  const isOwner = user?.role === 'OWNER';

  useEffect(() => {
    fetchVipPackages();
  }, []);

  const fetchVipPackages = async () => {
    setLoadingVip(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/vip-packages`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setVipPackages(res.data);
      }
    } catch (e) {
      console.log('Error fetching VIP packages:', e.message);
    } finally {
      setLoadingVip(false);
    }
  };

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

  const handleSubscribeMembership = async (pkg) => {
    Alert.alert(
      'Xác nhận đăng ký Gói VIP',
      `Bạn muốn đăng ký ${pkg.name} với giá ${pkg.price === 0 ? 'Miễn phí' : `${Number(pkg.price).toLocaleString('vi-VN')}đ`} / ${pkg.durationDays} ngày?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng ký ngay',
          onPress: async () => {
            try {
              const res = await axios.post(`${API_BASE_URL}/vip-packages/${pkg.id}/subscribe/${user.id}`);
              const updatedTier = res.data.membershipTier || 'GOLD';
              setMembershipTier(updatedTier);
              
              const updatedUser = { ...user, membershipTier: updatedTier };
              onUpdateUser(updatedUser);
              await AsyncStorage.setItem('user_session', JSON.stringify(updatedUser));
              Alert.alert('🎉 Thành công', `Chúc mừng bạn đã nâng cấp ${pkg.name}!`);
              setView('main');
            } catch (e) {
              Alert.alert('Lỗi', 'Không thể đăng ký gói VIP.');
            }
          }
        }
      ]
    );
  };

  const getTierBadge = (t) => {
    switch (t) {
      case 'SILVER': return 'HSSV Bạc 🥈';
      case 'GOLD': return 'VIP Gold 🥇';
      case 'DIAMOND': return 'Thần Ăn Kim Cương 💎';
      default: return 'Thành viên Tiêu chuẩn ⭐';
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
                  <Text style={styles.tierText}>{getTierBadge(user?.membershipTier || membershipTier)}</Text>
                </View>
              </View>
            </View>

            {/* Menu Sections */}
            <View style={styles.menuBox}>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setView('membership'); fetchVipPackages(); }}>
                <Ionicons name="ribbon-outline" size={22} color="#8B5CF6" />
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
            <Text style={{ fontSize: 13, color: '#666', marginBottom: 14, lineHeight: 18 }}>
              🌟 Đăng ký Gói VIP để tận hưởng ưu đãi Freeship và giảm giá độc quyền dành riêng cho sinh viên NLU!
            </Text>

            {loadingVip ? (
              <ActivityIndicator size="large" color="#8B5CF6" style={{ marginVertical: 30 }} />
            ) : vipPackages.length > 0 ? (
              vipPackages.map(pkg => {
                const isCurrent = 
                  (membershipTier === 'SILVER' && (pkg.name.toLowerCase().includes('đồng') || pkg.name.toLowerCase().includes('silver') || pkg.name.toLowerCase().includes('bạc'))) ||
                  (membershipTier === 'GOLD' && (pkg.name.toLowerCase().includes('vàng') || pkg.name.toLowerCase().includes('gold'))) ||
                  (membershipTier === 'DIAMOND' && (pkg.name.toLowerCase().includes('kim cương') || pkg.name.toLowerCase().includes('diamond')));

                return (
                  <View key={pkg.id} style={styles.pkgCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 20 }}>💎</Text>
                        <Text style={styles.pkgTitle}>{pkg.name}</Text>
                      </View>
                      <Text style={styles.pkgPrice}>
                        {pkg.price === 0 ? 'Miễn phí' : `${Number(pkg.price).toLocaleString('vi-VN')} đ`}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, marginVertical: 8 }}>
                      <View style={{ backgroundColor: '#F3E8FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                        <Text style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 'bold' }}>
                          ⏱️ {pkg.durationDays} ngày
                        </Text>
                      </View>
                      <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                        <Text style={{ fontSize: 11, color: '#16A34A', fontWeight: 'bold' }}>
                          🛵 {pkg.freeshipCount} lượt Freeship
                        </Text>
                      </View>
                      <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                        <Text style={{ fontSize: 11, color: '#D97706', fontWeight: 'bold' }}>
                          🏷️ Giảm {pkg.discountPercent}%
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.pkgDesc}>{pkg.description || 'Gói quyền lợi ưu đãi NLU'}</Text>

                    {isCurrent ? (
                      <View style={styles.currentPkgBadge}>
                        <Text style={styles.currentPkgText}>✓ Gói Hiện Tại Đang Sử Dụng</Text>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.subBtn} onPress={() => handleSubscribeMembership(pkg)}>
                        <Text style={styles.subBtnText}>Đăng ký ngay</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            ) : (
              <Text style={{ textAlign: 'center', color: '#999', marginVertical: 20 }}>
                Không có gói VIP nào khả dụng.
              </Text>
            )}
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
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FF6B00', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#222', marginTop: 10 },
  userEmail: { fontSize: 12, color: '#777', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  roleBadge: { backgroundColor: '#FFF0E6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  roleText: { fontSize: 10, fontWeight: 'bold', color: '#FF6B00' },
  tierBadge: { backgroundColor: '#F3E8FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: '#DDD6FE' },
  tierText: { fontSize: 10, fontWeight: 'bold', color: '#8B5CF6' },
  menuBox: { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#EEE', overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#F5F5F5' },
  menuItemText: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: '#333' },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 14, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#FFEBEE' },
  logoutText: { marginLeft: 8, color: '#E53935', fontSize: 15, fontWeight: 'bold' },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#EEE' },
  label: { fontSize: 13, fontWeight: 'bold', color: '#555', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#222' },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, backgroundColor: '#F9F9F9' },
  genderBtnActive: { borderColor: '#FF6B00', backgroundColor: '#FFF0E6' },
  genderText: { fontSize: 13, color: '#666', fontWeight: '500' },
  genderTextActive: { color: '#FF6B00', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#FF6B00', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  pkgCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1 },
  pkgTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  pkgPrice: { fontSize: 16, fontWeight: 'bold', color: '#8B5CF6' },
  pkgDesc: { fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 18 },
  currentPkgBadge: { marginTop: 12, backgroundColor: '#DCFCE7', paddingVertical: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#86EFAC' },
  currentPkgText: { color: '#16A34A', fontWeight: 'bold', fontSize: 13 },
  subBtn: { marginTop: 12, backgroundColor: '#8B5CF6', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  subBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 }
});
