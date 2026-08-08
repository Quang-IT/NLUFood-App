import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

export default function LoginScreen({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot'

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [newPassword, setNewPassword] = useState('');
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
      if (response.data.success) {
        await AsyncStorage.setItem('user_session', JSON.stringify(response.data.user));
        onLoginSuccess(response.data.user);
      } else {
        Alert.alert('Lỗi đăng nhập', response.data.message || 'Đăng nhập thất bại.');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Lỗi kết nối', 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra IP và Wi-Fi!');
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !phoneNumber.trim()) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ Tên, Email, Mật khẩu và SĐT!');
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
      if (response.data.success) {
        Alert.alert('Thành công', 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
        setMode('login');
      } else {
        Alert.alert('Lỗi đăng ký', response.data.message || 'Email này đã được sử dụng.');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Lỗi kết nối', 'Đăng ký thất bại.');
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
      if (response.data.success) {
        Alert.alert('Thành công', 'Đặt lại mật khẩu mới thành công!');
        setMode('login');
      } else {
        Alert.alert('Lỗi', response.data.message);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Lỗi kết nối', 'Không thể đặt lại mật khẩu.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerBox}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>🍕</Text>
          </View>
          <Text style={styles.titleText}>NLUFood Mobile</Text>
          <Text style={styles.subTitleText}>Đặt đồ ăn nội khu ĐH Nông Lâm TP.HCM</Text>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, mode === 'login' && styles.tabActive]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Đăng nhập</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, mode === 'register' && styles.tabActive]}
            onPress={() => setMode('register')}
          >
            <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Đăng ký</Text>
          </TouchableOpacity>
        </View>

        {/* FORMS */}
        {mode === 'login' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email sinh viên / Quán</Text>
            <TextInput
              style={styles.input}
              placeholder="student@hcmuaf.edu.vn"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Mật khẩu</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.forgotBtn} onPress={() => setMode('forgot')}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Đăng nhập</Text>}
            </TouchableOpacity>
          </View>
        )}

        {mode === 'register' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput
              style={styles.input}
              placeholder="Nguyễn Văn A"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              placeholder="0912345678"
              placeholderTextColor="#999"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="student@hcmuaf.edu.vn"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Mật khẩu</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Text style={styles.label}>Vai trò tài khoản</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'STUDENT' && styles.roleBtnActive]}
                onPress={() => setRole('STUDENT')}
              >
                <Text style={[styles.roleText, role === 'STUDENT' && styles.roleTextActive]}>Sinh viên</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'OWNER' && styles.roleBtnActive]}
                onPress={() => setRole('OWNER')}
              >
                <Text style={[styles.roleText, role === 'OWNER' && styles.roleTextActive]}>Chủ quán ăn</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Tạo tài khoản mới</Text>}
            </TouchableOpacity>
          </View>
        )}

        {mode === 'forgot' && (
          <View style={styles.formGroup}>
            <Text style={styles.titleSmall}>Đặt lại mật khẩu mới</Text>
            <Text style={styles.descSmall}>Nhập Email đã đăng ký để tạo lại mật khẩu mới.</Text>

            <Text style={styles.label}>Email tài khoản</Text>
            <TextInput
              style={styles.input}
              placeholder="student@hcmuaf.edu.vn"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Mật khẩu mới</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập mật khẩu mới..."
              placeholderTextColor="#999"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleForgotPassword} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Lưu mật khẩu mới</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backBtn} onPress={() => setMode('login')}>
              <Text style={styles.backBtnText}> Quay lại Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
    justifyContent: 'center',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 40,
  },
  titleText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  subTitleText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#FF6B00',
    fontWeight: 'bold',
  },
  formGroup: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: 'bold',
  },
  primaryBtn: {
    backgroundColor: '#FF6B00',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  roleBtnActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  roleTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  titleSmall: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  descSmall: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
  },
  backBtn: {
    alignItems: 'center',
    marginTop: 16,
  },
  backBtnText: {
    fontSize: 13,
    color: '#666',
    fontWeight: 'bold',
  }
});
