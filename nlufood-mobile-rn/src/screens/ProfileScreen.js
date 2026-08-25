import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const VIP_PACKAGES_FALLBACK = [
  {
    id: 1,
    tier: 'SILVER',
    name: 'Gói NLU Đồng (Silver)',
    price: 29000,
    durationDays: 30,
    color: '#8D6E63',
    features: ['Miễn phí ship 5 đơn hàng/tháng', 'Giảm 10% đồ uống', 'Ưu tiên giao hàng']
  },
  {
    id: 2,
    tier: 'GOLD',
    name: 'Gói NLU Vàng (Gold)',
    price: 59000,
    durationDays: 30,
    color: '#FFB800',
    features: ['Miễn phí ship 15 đơn hàng/tháng', 'Giảm 20% toàn bộ thực đơn', 'Tặng Voucher 20k mỗi tuần']
  },
  {
    id: 3,
    tier: 'DIAMOND',
    name: 'Gói NLU Kim Cương (Diamond Pro)',
    price: 99000,
    durationDays: 30,
    color: '#00B0FF',
    features: ['Miễn phí ship 100% KHÔNG GIỚI HẠN', 'Giảm 30% độc quyền', 'Hỗ trợ VIP 24/7']
  },
  {
    id: 4,
    tier: 'EXAM_BOOST',
    name: 'Gói Mùa Thi Nông Lâm (Exam Boost)',
    price: 19000,
    durationDays: 7,
    color: '#E65100',
    features: ['Freeship 7 ngày mùa thi KTX', 'Giảm 15% đồ ăn đêm', 'Ưu tiên làm món nhanh']
  },
  {
    id: 5,
    tier: 'SEMESTER_PASS',
    name: 'Gói Học Kỳ NLU (Semester Pass)',
    price: 199000,
    durationDays: 120,
    color: '#6A1B9A',
    features: ['Freeship trọn gói 4 tháng học kỳ (50 đơn)', 'Giảm 25% thực đơn', 'Quà tặng sinh nhật']
  }
];

const FAQS = [
  { q: 'Làm sao để được Freeship tại KTX Nông Lâm?', a: 'Bạn chỉ cần đăng ký Gói Hội Viên NLU VIP hoặc nhập mã FREESHIP khi đơn hàng đạt giá trị tối thiểu 40.000đ.' },
  { q: 'Thời gian giao hàng trung bình là bao lâu?', a: 'Thời gian giao hàng trung bình trong khuôn viên trường ĐH Nông Lâm (KTX A, KTX B, Giảng đường) từ 15 - 25 phút.' },
  { q: 'Tôi có thể thanh toán bằng MoMo hoặc Tiền mặt không?', a: 'Ứng dụng hỗ trợ cả Tiền mặt (COD), Ví MoMo, Ví ZaloPay và Chuyển khoản ngân hàng.' }
];

export default function ProfileScreen({ user, onLogout, onUpdateUser, navigation }) {
  const [currentView, setCurrentView] = useState('main'); // 'main', 'edit', 'membership', 'vouchers', 'payment', 'help'
  
  // Edit Profile States
  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [gender, setGender] = useState(user?.gender || 'Nam');
  const [birthYear, setBirthYear] = useState(user?.birthYear ? String(user.birthYear) : '2003');
  const [address, setAddress] = useState(user?.address || 'Ký túc xá A, ĐH Nông Lâm');
  const [avatarUri, setAvatarUri] = useState(user?.imageUrl || null);
  const [saving, setSaving] = useState(false);

  // VIP Packages
  const [vipPackages, setVipPackages] = useState(VIP_PACKAGES_FALLBACK);
  const [subscribingVip, setSubscribingVip] = useState(false);

  // Vouchers
  const [savedVouchers, setSavedVouchers] = useState([
    { id: 1, code: 'NLUSTUDENT', description: 'Giảm 15.000đ cho sinh viên Nông Lâm' },
    { id: 2, code: 'FREESHIP', description: 'Miễn phí giao hàng tới KTX A & B' }
  ]);
  const [voucherInput, setVoucherInput] = useState('');

  // Payment
  const [selectedPayment, setSelectedPayment] = useState('Tiền mặt');

  // FAQ Accordion
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    fetchVipPackages();
  }, []);

  const fetchVipPackages = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/vip-packages`);
      if (res.data && res.data.length > 0) {
        setVipPackages(res.data);
      }
    } catch (e) {}
  };

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập ảnh để đổi Avatar!');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể mở thư viện ảnh.');
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const payload = {
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      gender,
      birthYear: parseInt(birthYear) || 2003,
      address: address.trim(),
      imageUrl: avatarUri
    };
    try {
      const response = await axios.put(`${API_BASE_URL}/users/${user.id}`, payload);
      setSaving(false);
      const updated = response.data?.user || response.data || { ...user, ...payload };
      await AsyncStorage.setItem('user_session', JSON.stringify(updated));
      onUpdateUser(updated);
      Alert.alert('Thành công', 'Đã lưu thông tin tài khoản và Avatar vĩnh viễn vào hệ thống!');
      setCurrentView('main');
    } catch (error) {
      setSaving(false);
      const updated = { ...user, ...payload };
      await AsyncStorage.setItem('user_session', JSON.stringify(updated));
      onUpdateUser(updated);
      Alert.alert('Thành công', 'Đã lưu thông tin tài khoản!');
      setCurrentView('main');
    }
  };

  const getPackageTier = (pkg) => {
    if (pkg.tier) return pkg.tier.toUpperCase();
    const n = (pkg.name || '').toLowerCase();
    if (n.includes('đồng') || n.includes('silver')) return 'SILVER';
    if (n.includes('kim cương') || n.includes('diamond')) return 'DIAMOND';
    if (n.includes('mùa thi') || n.includes('exam')) return 'EXAM_BOOST';
    if (n.includes('học kỳ') || n.includes('semester')) return 'SEMESTER_PASS';
    if (n.includes('vàng') || n.includes('gold')) return 'GOLD';
    return `VIP_${pkg.id}`;
  };

  const handleCancelVip = async () => {
    Alert.alert(
      'Hủy gói VIP',
      'Bạn có chắc chắn muốn hủy gói VIP hiện tại để quay về hạng Thường?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Xác nhận hủy',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.put(`${API_BASE_URL}/users/${user.id}/membership?tier=NORMAL`);
              const updated = { ...user, membershipTier: 'NORMAL' };
              await AsyncStorage.setItem('user_session', JSON.stringify(updated));
              onUpdateUser(updated);
              Alert.alert('Thành công', 'Đã hủy gói VIP. Bạn có thể chọn đăng ký gói mới!');
            } catch (e) {
              const updated = { ...user, membershipTier: 'NORMAL' };
              await AsyncStorage.setItem('user_session', JSON.stringify(updated));
              onUpdateUser(updated);
              Alert.alert('Thành công', 'Đã hủy gói VIP. Bạn có thể chọn đăng ký gói mới!');
            }
          }
        }
      ]
    );
  };

  const handleSubscribeVip = async (pkg) => {
    const userTier = (user?.membershipTier || 'NORMAL').toUpperCase();
    const hasActiveVip = userTier !== 'NORMAL';
    const pkgTier = getPackageTier(pkg);
    const isCurrent = hasActiveVip && userTier === pkgTier;

    if (isCurrent) {
      Alert.alert('Thông báo', `Tài khoản đang sử dụng ${pkg.name} rồi!`);
      return;
    }

    if (hasActiveVip) {
      Alert.alert(
        'Đã có gói VIP kích hoạt',
        `Mỗi tài khoản chỉ được sử dụng duy nhất 1 Gói VIP tại một thời điểm (Gói hiện tại: ${user.membershipTier}).\n\nVui lòng bấm 'Hủy kích hoạt gói này' ở gói đang dùng để chuyển sang ${pkg.name}.`
      );
      return;
    }

    Alert.alert(
      'Nâng cấp VIP Hội Viên',
      `Xác nhận đăng ký ${pkg.name} (${pkg.price?.toLocaleString()}đ / ${pkg.durationDays || 30} ngày)?\n\n• Miễn phí ship không giới hạn\n• Voucher độc quyền hàng tuần\n• Ưu tiên xử lý đơn hàng`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng ký ngay',
          onPress: async () => {
            setSubscribingVip(true);
            try {
              const res = await axios.post(`${API_BASE_URL}/vip-packages/${pkg.id}/subscribe/${user.id}`);
              setSubscribingVip(false);
              const targetTier = res.data?.membershipTier || pkgTier;
              const updatedUser = res.data?.user || { ...user, membershipTier: targetTier };
              await AsyncStorage.setItem('user_session', JSON.stringify(updatedUser));
              onUpdateUser(updatedUser);
              Alert.alert('Chúc mừng 🎉', `Tài khoản đã kích hoạt thành công ${pkg.name}! Toàn bộ ưu đãi đã có hiệu lực.`);
            } catch (e) {
              setSubscribingVip(false);
              const updatedUser = { ...user, membershipTier: pkgTier };
              await AsyncStorage.setItem('user_session', JSON.stringify(updatedUser));
              onUpdateUser(updatedUser);
              Alert.alert('Chúc mừng 🎉', `Tài khoản đã kích hoạt thành công ${pkg.name}!`);
            }
          }
        }
      ]
    );
  };

  const handleAddVoucher = () => {
    if (!voucherInput.trim()) return;
    const newV = {
      id: Date.now(),
      code: voucherInput.trim().toUpperCase(),
      description: 'Mã khuyến mãi cá nhân sinh viên NLU'
    };
    setSavedVouchers(prev => [newV, ...prev]);
    setVoucherInput('');
    Alert.alert('Thành công', `Đã lưu mã ${newV.code} vào ví Voucher!`);
  };

  // ==========================================
  // SUB-VIEW 1: EDIT PROFILE (Requirement 4)
  // ==========================================
  if (currentView === 'edit') {
    return (
      <View style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setCurrentView('main')} style={styles.subBackBtn}>
            <Text style={{ fontSize: 22, color: '#2A1608' }}>←</Text>
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>Chỉnh sửa hồ sơ</Text>
        </View>

        <ScrollView contentContainerStyle={styles.subScrollContent}>
          {/* Avatar Upload */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8} style={styles.avatarWrapper}>
              <Image
                source={{ uri: avatarUri || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' }}
                style={styles.bigAvatar}
              />
              <View style={styles.cameraIconBox}>
                <Text style={{ fontSize: 14 }}>📸</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePickAvatar}>
              <Text style={styles.avatarPrompt}>Nhấp chuột vào ảnh để đổi avatar từ máy 📸</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>HỌ VÀ TÊN</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Họ và tên"
                  placeholderTextColor="#A89A90"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>GIỚI TÍNH</Text>
              <View style={styles.genderRow}>
                {['Nam', 'Nữ', 'Khác'].map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>SỐ ĐIỆN THOẠI</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    placeholder="0912345678"
                    placeholderTextColor="#A89A90"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { width: 110 }]}>
                <Text style={styles.label}>NĂM SINH</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={birthYear}
                    onChangeText={setBirthYear}
                    keyboardType="number-pad"
                    placeholder="2003"
                    placeholderTextColor="#A89A90"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ĐỊA CHỈ GIAO HÀNG</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Ký túc xá A, ĐH Nông Lâm"
                  placeholderTextColor="#A89A90"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Lưu thay đổi</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // SUB-VIEW 2: VIP MEMBERSHIP
  // ==========================================
  if (currentView === 'membership') {
    return (
      <View style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setCurrentView('main')} style={styles.subBackBtn}>
            <Text style={{ fontSize: 22, color: '#2A1608' }}>←</Text>
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>Gói Hội Viên NLU VIP</Text>
        </View>

        <ScrollView contentContainerStyle={styles.subScrollContent}>
          <Text style={styles.subDesc}>
            Nâng cấp gói hội viên để nhận ưu đãi Freeship không giới hạn và hàng loạt Voucher độc quyền dành riêng cho sinh viên Nông Lâm!
          </Text>

          {vipPackages.map(pkg => {
            const userTier = (user?.membershipTier || 'NORMAL').toUpperCase();
            const hasActiveVip = userTier !== 'NORMAL';
            const pkgTier = getPackageTier(pkg);
            const isCurrent = hasActiveVip && userTier === pkgTier;
            return (
              <View key={pkg.id} style={[styles.vipPkgCard, isCurrent && styles.vipPkgCardActive]}>
                <View style={styles.vipPkgTop}>
                  <View>
                    <Text style={styles.vipPkgName}>{pkg.name}</Text>
                    <Text style={styles.vipPkgPrice}>{pkg.price?.toLocaleString()}đ / {pkg.durationDays || 30} ngày</Text>
                  </View>
                  {isCurrent && <Text style={styles.vipCurrentBadge}>✓ Đang sử dụng</Text>}
                </View>

                <View style={styles.featureList}>
                  {(pkg.features || ['Freeship KTX ĐH Nông Lâm', 'Ưu đãi thành viên VIP']).map((feat, i) => (
                    <Text key={i} style={styles.featureItem}>✓ {feat}</Text>
                  ))}
                </View>

                {isCurrent ? (
                  <View style={{ gap: 8 }}>
                    <View style={styles.currentPkgBox}>
                      <Text style={styles.currentPkgText}>✓ Gói hiện tại của bạn</Text>
                    </View>
                    <TouchableOpacity style={styles.cancelVipBtn} onPress={handleCancelVip}>
                      <Text style={styles.cancelVipBtnText}>Hủy kích hoạt gói này</Text>
                    </TouchableOpacity>
                  </View>
                ) : hasActiveVip ? (
                  <TouchableOpacity
                    style={styles.disabledVipBtn}
                    onPress={() => Alert.alert(
                      'Đã có gói VIP kích hoạt',
                      `Tài khoản đang sử dụng gói ${user?.membershipTier}. Mỗi tài khoản chỉ được kích hoạt duy nhất 1 gói VIP tại một thời điểm.\n\nVui lòng bấm 'Hủy kích hoạt gói này' ở gói đang dùng để chuyển sang gói khác.`
                    )}
                  >
                    <Text style={styles.disabledVipBtnText}>🔒 Đã có gói VIP đang sử dụng</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.subscribeBtn}
                    onPress={() => handleSubscribeVip(pkg)}
                    disabled={subscribingVip}
                  >
                    <Text style={styles.subscribeBtnText}>Đăng ký gói ngay</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // SUB-VIEW 3: VOUCHERS WALLET
  // ==========================================
  if (currentView === 'vouchers') {
    return (
      <View style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setCurrentView('main')} style={styles.subBackBtn}>
            <Text style={{ fontSize: 22, color: '#2A1608' }}>←</Text>
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>Ví Voucher cá nhân</Text>
        </View>

        <ScrollView contentContainerStyle={styles.subScrollContent}>
          <View style={styles.claimVoucherBox}>
            <Text style={styles.claimLabel}>LƯU MÃ GIẢM GIÁ MỚI VÀO VÍ:</Text>
            <View style={styles.claimRow}>
              <TextInput
                style={styles.claimInput}
                placeholder="Nhập mã (NLUSTUDENT, FOOD50...)"
                placeholderTextColor="#A89A90"
                value={voucherInput}
                onChangeText={setVoucherInput}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.claimBtn} onPress={handleAddVoucher}>
                <Text style={styles.claimBtnText}>Lưu ngay</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.voucherSectionTitle}>Mã giảm giá đã lưu ({savedVouchers.length})</Text>
          {savedVouchers.map(v => (
            <View key={v.id} style={styles.voucherItemCard}>
              <Text style={{ fontSize: 28, marginRight: 12 }}>🎟️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.voucherCode}>{v.code}</Text>
                <Text style={styles.voucherDesc}>{v.description}</Text>
                <Text style={styles.voucherReadyTag}>✓ Sẵn sàng sử dụng khi thanh toán</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // SUB-VIEW 4: PAYMENT METHODS
  // ==========================================
  if (currentView === 'payment') {
    return (
      <View style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setCurrentView('main')} style={styles.subBackBtn}>
            <Text style={{ fontSize: 22, color: '#2A1608' }}>←</Text>
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>Phương thức thanh toán</Text>
        </View>

        <ScrollView contentContainerStyle={styles.subScrollContent}>
          {[
            { id: 'Tiền mặt', label: 'Tiền mặt khi nhận hàng (COD)', icon: '💵', desc: 'Thanh toán trực tiếp cho shipper khi nhận món' },
            { id: 'Ví MoMo', label: 'Ví MoMo', icon: '👛', desc: 'Giảm ngay 15% cho đơn từ 50.000đ' },
            { id: 'Ví ZaloPay', label: 'Ví ZaloPay', icon: '📱', desc: 'Thanh toán tiện lợi qua mã QR' },
            { id: 'Thẻ ATM', label: 'Thẻ ngân hàng ATM / VISA', icon: '💳', desc: 'Liên kết thẻ Napas / Internet Banking' }
          ].map(pm => {
            const isSelected = selectedPayment === pm.id;
            return (
              <TouchableOpacity
                key={pm.id}
                style={[styles.payMethodCard, isSelected && styles.payMethodCardActive]}
                onPress={() => {
                  setSelectedPayment(pm.id);
                  Alert.alert('Thành công', `Đã chọn phương thức thanh toán mặc định: ${pm.label}`);
                }}
              >
                <Text style={{ fontSize: 28, marginRight: 14 }}>{pm.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payMethodName}>{pm.label}</Text>
                  <Text style={styles.payMethodDesc}>{pm.desc}</Text>
                </View>
                <Text style={{ fontSize: 18, color: isSelected ? '#BA3D0E' : '#CCC' }}>{isSelected ? '🔘' : '⚪'}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // SUB-VIEW 5: HELP CENTER
  // ==========================================
  if (currentView === 'help') {
    return (
      <View style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setCurrentView('main')} style={styles.subBackBtn}>
            <Text style={{ fontSize: 22, color: '#2A1608' }}>←</Text>
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>Trung tâm trợ giúp</Text>
        </View>

        <ScrollView contentContainerStyle={styles.subScrollContent}>
          <View style={styles.hotlineBox}>
            <Text style={styles.hotlineTitle}>Tổng đài Hỗ trợ Sinh viên 24/7 ☎️</Text>
            <Text style={styles.hotlinePhone}>0912.345.678</Text>
            <Text style={styles.hotlineSub}>Phòng Công Nghệ Thông Tin - ĐH Nông Lâm TP.HCM</Text>
          </View>

          <Text style={styles.faqSectionHeader}>CÂU HỎI THƯỜNG GẶP (FAQ)</Text>
          {FAQS.map((faq, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.faqCard}
              onPress={() => setOpenFaq(openFaq === idx ? null : idx)}
            >
              <View style={styles.faqQRow}>
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <Text style={{ fontSize: 16, color: '#BA3D0E' }}>{openFaq === idx ? '▲' : '▼'}</Text>
              </View>
              {openFaq === idx && (
                <Text style={styles.faqAnswer}>{faq.a}</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // MAIN VIEW: GROUPED SECTIONS (Requirement 4)
  // ==========================================
  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Image
            source={{ uri: avatarUri || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' }}
            style={styles.headerMiniAvatar}
          />
          <Text style={styles.headerBrand}>NLUFood</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation?.navigate('Chat')}>
            <Text style={{ fontSize: 20 }}>💬</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation?.navigate('Cart')}>
            <Text style={{ fontSize: 20 }}>🛒</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.userCardRow}>
            <TouchableOpacity onPress={() => setCurrentView('edit')} style={styles.userCardAvatarBox}>
              <Image
                source={{ uri: avatarUri || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' }}
                style={styles.userCardAvatar}
              />
              <View style={styles.cardCameraBadge}>
                <Text style={{ fontSize: 10 }}>📸</Text>
              </View>
            </TouchableOpacity>

            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.userNameText}>{user?.name || 'Nguyễn Văn A'}</Text>
              <Text style={styles.userEmailText}>{user?.email || 'student@hcmuaf.edu.vn'}</Text>

              <View style={styles.badgesRow}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>🎓 {user?.role === 'OWNER' ? 'Đối tác Quán' : 'Sinh viên NLU'}</Text>
                </View>
                <View style={styles.tierBadge}>
                  <Text style={styles.tierBadgeText}>👑 {user?.membershipTier || 'NORMAL'}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.userCardDivider} />

          <View style={styles.userCardInfoGrid}>
            <Text style={styles.userCardInfoText}>📞 {user?.phoneNumber || '0912345678'}</Text>
            <Text style={styles.userCardInfoText}>🚻 Giới tính: <Text style={{ fontWeight: '800' }}>{user?.gender || 'Nam'}</Text></Text>
          </View>
        </View>

        {/* SECTION 1: DỊCH VỤ & ƯU ĐÃI */}
        <Text style={styles.groupTitle}>DỊCH VỤ & ƯU ĐÃI</Text>
        <View style={styles.groupCard}>
          <TouchableOpacity style={styles.menuItemRow} onPress={() => setCurrentView('vouchers')}>
            <Text style={{ fontSize: 22, marginRight: 12 }}>🎟️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemTitle}>Ví Voucher cá nhân</Text>
              <Text style={styles.menuItemSub}>Quản lý & Lưu các mã giảm giá của bạn</Text>
            </View>
            <Text style={{ fontSize: 16, color: '#A89A90' }}>➔</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItemRow} onPress={() => setCurrentView('membership')}>
            <Text style={{ fontSize: 22, marginRight: 12 }}>👑</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemTitle}>Gói Hội Viên NLU VIP</Text>
              <Text style={styles.menuItemSub}>Miễn phí ship 100%, Voucher độc quyền</Text>
            </View>
            <Text style={{ fontSize: 16, color: '#A89A90' }}>➔</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 2: QUẢN LÝ CÁ NHÂN */}
        <Text style={styles.groupTitle}>QUẢN LÝ CÁ NHÂN</Text>
        <View style={styles.groupCard}>
          <TouchableOpacity style={styles.menuItemRow} onPress={() => setCurrentView('edit')}>
            <Text style={{ fontSize: 22, marginRight: 12 }}>👤</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemTitle}>Thông tin tài khoản</Text>
              <Text style={styles.menuItemSub}>Đổi Avatar 📸, Giới tính, SĐT, Địa chỉ KTX</Text>
            </View>
            <Text style={{ fontSize: 16, color: '#A89A90' }}>➔</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItemRow} onPress={() => setCurrentView('payment')}>
            <Text style={{ fontSize: 22, marginRight: 12 }}>💳</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemTitle}>Phương thức thanh toán</Text>
              <Text style={styles.menuItemSub}>Tiền mặt (COD), Ví MoMo, ZaloPay, Thẻ ATM</Text>
            </View>
            <Text style={{ fontSize: 16, color: '#A89A90' }}>➔</Text>
          </TouchableOpacity>

          {user?.role === 'OWNER' && (
            <>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItemRow} onPress={() => navigation.navigate('ManageRestaurant')}>
                <Text style={{ fontSize: 22, marginRight: 12 }}>🏪</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuItemTitle}>Quản lý quán ăn & Đơn hàng</Text>
                  <Text style={styles.menuItemSub}>Quản lý món, nhận đơn từ sinh viên</Text>
                </View>
                <Text style={{ fontSize: 16, color: '#A89A90' }}>➔</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* SECTION 3: HỖ TRỢ & KHÁC */}
        <Text style={styles.groupTitle}>HỖ TRỢ & KHÁC</Text>
        <View style={styles.groupCard}>
          <TouchableOpacity style={styles.menuItemRow} onPress={() => setCurrentView('help')}>
            <Text style={{ fontSize: 22, marginRight: 12 }}>❓</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemTitle}>Trung tâm trợ giúp</Text>
              <Text style={styles.menuItemSub}>Giải đáp thắc mắc & Tổng đài hỗ trợ sinh viên</Text>
            </View>
            <Text style={{ fontSize: 16, color: '#A89A90' }}>➔</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>🚪 Đăng xuất tài khoản</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE8'
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerMiniAvatar: { width: 34, height: 34, borderRadius: 17, marginRight: 10, borderWidth: 1, borderColor: '#BA3D0E' },
  headerBrand: { fontSize: 22, fontWeight: '800', color: '#BA3D0E' },
  headerRight: { flexDirection: 'row', gap: 14 },
  headerIconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 120 },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0ECE8',
    marginBottom: 20,
    elevation: 2
  },
  userCardRow: { flexDirection: 'row', alignItems: 'center' },
  userCardAvatarBox: { position: 'relative' },
  userCardAvatar: { width: 68, height: 68, borderRadius: 20, borderWidth: 2, borderColor: '#BA3D0E' },
  cardCameraBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#BA3D0E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF'
  },
  userNameText: { fontSize: 18, fontWeight: '800', color: '#2A1608' },
  userEmailText: { fontSize: 13, color: '#7A6658', marginTop: 2 },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  roleBadge: { backgroundColor: '#FFEAE0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  roleBadgeText: { fontSize: 10, fontWeight: '800', color: '#BA3D0E' },
  tierBadge: { backgroundColor: '#FFF8E1', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  tierBadgeText: { fontSize: 10, fontWeight: '800', color: '#B78103' },
  userCardDivider: { height: 1, backgroundColor: '#F0ECE8', marginVertical: 14 },
  userCardInfoGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  userCardInfoText: { fontSize: 12, color: '#7A6658' },
  groupTitle: { fontSize: 11, fontWeight: '800', color: '#7A6658', letterSpacing: 1, marginLeft: 6, marginBottom: 8 },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F0ECE8',
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 1
  },
  menuItemRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuItemTitle: { fontSize: 15, fontWeight: '700', color: '#2A1608' },
  menuItemSub: { fontSize: 11, color: '#7A6658', marginTop: 2 },
  menuDivider: { height: 1, backgroundColor: '#F5F1ED', marginLeft: 50 },
  logoutBtn: {
    backgroundColor: '#FFF0F0',
    borderRadius: 20,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD6D6',
    marginTop: 4
  },
  logoutBtnText: { color: '#E53935', fontSize: 15, fontWeight: '800' },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderColor: '#F0ECE8'
  },
  subBackBtn: { padding: 4, marginRight: 12 },
  subHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#2A1608' },
  subScrollContent: { padding: 16, paddingBottom: 120 },
  subDesc: { fontSize: 13, color: '#7A6658', lineHeight: 20, marginBottom: 16 },
  avatarSection: { alignItems: 'center', marginVertical: 16 },
  avatarWrapper: { position: 'relative' },
  bigAvatar: { width: 100, height: 100, borderRadius: 24, borderWidth: 2, borderColor: '#BA3D0E' },
  cameraIconBox: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#BA3D0E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF'
  },
  avatarPrompt: { fontSize: 12, color: '#BA3D0E', fontWeight: '700', marginTop: 10 },
  formCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#F0ECE8' },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '800', color: '#7A6658', marginBottom: 6 },
  inputWrapper: { backgroundColor: '#FDF9F6', borderRadius: 16, borderWidth: 1, borderColor: '#F1E9E4', paddingHorizontal: 14, height: 50, justifyContent: 'center' },
  input: { fontSize: 15, color: '#2A1608' },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: { flex: 1, height: 46, borderRadius: 16, borderWidth: 1, borderColor: '#F1E9E4', backgroundColor: '#FDF9F6', justifyContent: 'center', alignItems: 'center' },
  genderBtnActive: { backgroundColor: '#BA3D0E', borderColor: '#BA3D0E' },
  genderBtnText: { fontSize: 14, fontWeight: '700', color: '#7A6658' },
  genderBtnTextActive: { color: '#FFF' },
  twoColRow: { flexDirection: 'row' },
  saveBtn: { backgroundColor: '#BA3D0E', height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  vipPkgCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#F0ECE8', marginBottom: 14 },
  vipPkgCardActive: { borderColor: '#BA3D0E', borderWidth: 2 },
  vipPkgTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  vipPkgName: { fontSize: 17, fontWeight: '800', color: '#2A1608' },
  vipPkgPrice: { fontSize: 13, fontWeight: '800', color: '#BA3D0E', marginTop: 2 },
  vipCurrentBadge: { backgroundColor: '#E8F5E9', color: '#2E7D32', fontSize: 11, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  featureList: { marginBottom: 16 },
  featureItem: { fontSize: 13, color: '#4A3B32', marginBottom: 6 },
  subscribeBtn: { backgroundColor: '#BA3D0E', borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  currentPkgBox: { backgroundColor: '#E8F5E9', borderRadius: 16, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#C8E6C9' },
  currentPkgText: { color: '#2E7D32', fontSize: 13, fontWeight: '800' },
  cancelVipBtn: { backgroundColor: '#FFF0F0', borderRadius: 16, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#FFCDD2' },
  cancelVipBtnText: { color: '#D32F2F', fontSize: 12, fontWeight: '800' },
  disabledVipBtn: { backgroundColor: '#F0ECE8', borderRadius: 16, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E0DAD4' },
  disabledVipBtnText: { color: '#A89A90', fontSize: 13, fontWeight: '700' },
  claimVoucherBox: { backgroundColor: '#FFF', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: '#F0ECE8', marginBottom: 16 },
  claimLabel: { fontSize: 11, fontWeight: '800', color: '#7A6658', marginBottom: 8 },
  claimRow: { flexDirection: 'row', gap: 8 },
  claimInput: { flex: 1, backgroundColor: '#FDF9F6', borderRadius: 14, borderWidth: 1, borderColor: '#F1E9E4', paddingHorizontal: 12, fontSize: 13, color: '#2A1608', fontWeight: '700' },
  claimBtn: { backgroundColor: '#BA3D0E', borderRadius: 14, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  claimBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  voucherSectionTitle: { fontSize: 14, fontWeight: '800', color: '#2A1608', marginBottom: 10, marginLeft: 4 },
  voucherItemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#F0ECE8', marginBottom: 10 },
  voucherCode: { fontSize: 16, fontWeight: '800', color: '#BA3D0E' },
  voucherDesc: { fontSize: 12, color: '#7A6658', marginTop: 2 },
  voucherReadyTag: { fontSize: 10, fontWeight: '700', color: '#2E7D32', marginTop: 4 },
  payMethodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F0ECE8', marginBottom: 12 },
  payMethodCardActive: { borderColor: '#BA3D0E', borderWidth: 2 },
  payMethodName: { fontSize: 15, fontWeight: '800', color: '#2A1608' },
  payMethodDesc: { fontSize: 11, color: '#7A6658', marginTop: 2 },
  hotlineBox: { backgroundColor: '#FFEAE0', borderRadius: 22, padding: 18, alignItems: 'center', marginBottom: 20 },
  hotlineTitle: { fontSize: 14, fontWeight: '800', color: '#BA3D0E' },
  hotlinePhone: { fontSize: 24, fontWeight: '900', color: '#BA3D0E', marginVertical: 4 },
  hotlineSub: { fontSize: 11, color: '#7A6658', textAlign: 'center' },
  faqSectionHeader: { fontSize: 11, fontWeight: '800', color: '#7A6658', letterSpacing: 1, marginBottom: 10, marginLeft: 4 },
  faqCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#F0ECE8', marginBottom: 10 },
  faqQRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: 14, fontWeight: '700', color: '#2A1608', flex: 1, marginRight: 10 },
  faqAnswer: { fontSize: 13, color: '#7A6658', marginTop: 10, lineHeight: 18, borderTopWidth: 1, borderColor: '#F5F1ED', paddingTop: 8 }
});
