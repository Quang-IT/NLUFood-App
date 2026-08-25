import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';

export default function LoginScreen({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot'

  const [email, setEmail] = useState('student@hcmuaf.edu.vn');
  const [password, setPassword] = useState('123');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ Email và Mật khẩu!');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/users/login`, {
        email: email.trim(),
        password: password.trim()
      });
      setLoading(false);
      const userData = response.data?.user || response.data;
      if (userData && (userData.id || userData.email)) {
        await AsyncStorage.setItem('user_session', JSON.stringify(userData));
        onLoginSuccess(userData);
      } else {
        Alert.alert('Lỗi đăng nhập', response.data?.message || 'Đăng nhập thất bại.');
      }
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || 'Email hoặc mật khẩu không chính xác!';
      Alert.alert('Đăng nhập thất bại', msg);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !phoneNumber.trim()) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ Họ và tên, Email, Số điện thoại và Mật khẩu!');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Thông báo', 'Mật khẩu xác nhận không khớp!');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/users/register`, {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        phoneNumber: phoneNumber.trim(),
        role
      });
      setLoading(false);
      const userData = response.data?.user || response.data;
      if (userData && (userData.id || response.data?.success)) {
        Alert.alert('Thành công', 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
        setMode('login');
      } else {
        Alert.alert('Lỗi đăng ký', response.data?.message || 'Đăng ký không thành công.');
      }
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || 'Email này đã được sử dụng hoặc đăng ký thất bại.';
      Alert.alert('Lỗi đăng ký', msg);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim() || !newPassword.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập Email và Mật khẩu mới!');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/users/forgot-password`, {
        email: email.trim(),
        newPassword: newPassword.trim()
      });
      setLoading(false);
      if (response.data?.success || response.status === 200) {
        Alert.alert('Thành công', 'Đặt lại mật khẩu mới thành công!');
        setMode('login');
      } else {
        Alert.alert('Lỗi', response.data?.message || 'Không thể đặt lại mật khẩu.');
      }
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || 'Không thể đặt lại mật khẩu.';
      Alert.alert('Lỗi', msg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Logo */}
          <View style={styles.logoBox}>
            <MaterialCommunityIcons name="food" size={32} color="#BA3D0E" />
          </View>

          {/* Title */}
          <Text style={styles.title}>NLUFood</Text>
          <Text style={styles.subtitle}>
            {mode === 'login'
              ? 'Đăng nhập để đặt món ăn yêu thích của bạn'
              : mode === 'register'
              ? 'Tạo tài khoản mới để bắt đầu đặt hàng'
              : 'Khôi phục mật khẩu tài khoản'}
          </Text>

          {/* Form Fields */}
          {mode === 'register' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>HỌ VÀ TÊN</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#7A6658" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nguyễn Văn A"
                  placeholderTextColor="#A89A90"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#7A6658" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="student@hcmuaf.edu.vn"
                placeholderTextColor="#A89A90"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          {mode === 'register' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>SỐ ĐIỆN THOẠI</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#7A6658" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="0912345678"
                  placeholderTextColor="#A89A90"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          )}

          {mode === 'login' && (
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>MẬT KHẨU</Text>
                <TouchableOpacity onPress={() => setMode('forgot')}>
                  <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#7A6658" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#A89A90"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>
          )}

          {mode === 'register' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>MẬT KHẨU</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#7A6658" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#A89A90"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>XÁC NHẬN MẬT KHẨU</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#7A6658" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#A89A90"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>
              </View>
            </>
          )}

          {mode === 'forgot' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>MẬT KHẨU MỚI</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="refresh-outline" size={20} color="#7A6658" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu mới..."
                  placeholderTextColor="#A89A90"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>
            </View>
          )}

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgotPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {mode === 'login' ? 'Đăng nhập ngay' : mode === 'register' ? 'Tạo tài khoản' : 'Xác nhận đặt lại mật khẩu'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Mode Switchers */}
          {mode === 'login' && (
            <View style={styles.footerBox}>
              <Text style={styles.footerPrompt}>Chưa có tài khoản?</Text>
              <TouchableOpacity onPress={() => setMode('register')}>
                <Text style={styles.footerLink}>Đăng ký tài khoản mới</Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'register' && (
            <View style={styles.footerBox}>
              <Text style={styles.footerPrompt}>Đã có tài khoản?</Text>
              <TouchableOpacity onPress={() => setMode('login')}>
                <Text style={styles.footerLink}>Đăng nhập tại đây</Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'forgot' && (
            <TouchableOpacity style={styles.backToLoginBtn} onPress={() => setMode('login')}>
              <Ionicons name="arrow-back" size={16} color="#BA3D0E" style={{ marginRight: 6 }} />
              <Text style={styles.backToLoginText}>Quay lại Đăng nhập</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3EDE8'
  },
  logoBox: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#FFEAE0',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#BA3D0E',
    textAlign: 'center',
    marginBottom: 6
  },
  subtitle: {
    fontSize: 14,
    color: '#7A6658',
    textAlign: 'center',
    marginBottom: 26,
    lineHeight: 20,
    paddingHorizontal: 10
  },
  inputGroup: {
    marginBottom: 16
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A3B32',
    letterSpacing: 0.5,
    marginBottom: 6
  },
  forgotText: {
    fontSize: 12,
    color: '#BA3D0E',
    fontWeight: '600'
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF9F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1E9E4',
    paddingHorizontal: 14,
    height: 52
  },
  inputIcon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#2A1608'
  },
  primaryBtn: {
    backgroundColor: '#BA3D0E',
    borderRadius: 18,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#BA3D0E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  },
  footerBox: {
    alignItems: 'center',
    marginTop: 22
  },
  footerPrompt: {
    fontSize: 13,
    color: '#7A6658',
    marginBottom: 6
  },
  footerLink: {
    fontSize: 14,
    color: '#BA3D0E',
    fontWeight: '700'
  },
  backToLoginBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22
  },
  backToLoginText: {
    fontSize: 14,
    color: '#BA3D0E',
    fontWeight: '700'
  }
});
