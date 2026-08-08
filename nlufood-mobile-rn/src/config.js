import { Platform } from 'react-native';

// ĐỊA CHỈ IP LAPTOP TRONG MẠNG WI-FI ĐỂ ĐIỆN THOẠI KẾT NỐI VÀO BACKEND
const LAPTOP_IP = '192.168.116.58';

// Trên Android Emulator, 10.0.2.2 trỏ về máy tính host. Trên điện thoại thật, dùng LAPTOP_IP.
const HOST = Platform.OS === 'android' && !__DEV__ ? LAPTOP_IP : LAPTOP_IP;

export const API_BASE_URL = `http://${HOST}:8080/api`;
