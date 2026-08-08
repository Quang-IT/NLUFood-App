// ĐỊA CHỈ IP LAPTOP CỦA BẠN TRONG MẠNG WI-FI
const LAPTOP_IP = '192.168.116.58';

const isWebBrowserLocal = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && window.location.hostname !== 'capacitor';

// Nếu truy cập từ trình duyệt bằng IP sẽ dùng hostname đó, nếu chạy trong Android App (có hostname = localhost/capacitor) sẽ dùng LAPTOP_IP
const targetHost = isWebBrowserLocal ? window.location.hostname : LAPTOP_IP;

export const API_BASE_URL = `http://${targetHost}:8080/api`;