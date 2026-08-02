// Tự động nhận diện hostname (localhost hoặc IP máy tính khi truy cập từ điện thoại)
const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
export const API_BASE_URL = `http://${hostname}:8080/api`;