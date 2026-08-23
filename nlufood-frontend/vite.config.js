import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Cho phép kết nối từ mọi thiết bị trong mạng LAN (Điện thoại, iPad)
    port: 5173
  }
})
