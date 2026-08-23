import React, { useState } from 'react';
import axios from 'axios';

import { API_BASE_URL } from '../config';

function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        setLoading(false);
        return;
      }

      axios.post(`${API_BASE_URL}/users/register`, {
        name,
        email,
        phoneNumber,
        password,
        role: 'STUDENT'
      })
      .then(res => {
        setLoading(false);
        setSuccess('Đăng ký tài khoản thành công! Hãy đăng nhập.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      })
      .catch(err => {
        setLoading(false);
        setError(err.response?.data?.message || 'Đăng ký thất bại. Email có thể đã tồn tại.');
      });
    } else if (mode === 'forgot') {
      if (!newPassword || newPassword.trim().length < 3) {
        setError('Vui lòng nhập mật khẩu mới tối thiểu 3 ký tự');
        setLoading(false);
        return;
      }

      axios.post(`${API_BASE_URL}/users/forgot-password`, {
        email,
        newPassword
      })
      .then(res => {
        setLoading(false);
        setSuccess(res.data?.message || 'Đặt lại mật khẩu thành công! Hãy đăng nhập lại.');
        setMode('login');
        setPassword('');
        setNewPassword('');
      })
      .catch(err => {
        setLoading(false);
        setError(err.response?.data?.message || 'Không thể đặt lại mật khẩu.');
      });
    } else {
      // Mode login
      axios.post(`${API_BASE_URL}/users/login`, {
        email,
        password
      })
      .then(res => {
        setLoading(false);
        localStorage.setItem('user', JSON.stringify(res.data));
        onLoginSuccess(res.data);
      })
      .catch(err => {
        setLoading(false);
        const errorMsg = err.response?.data?.message || (err.message === 'Network Error' ? 'Lỗi kết nối mạng Server' : err.message);
        setError(`Đăng nhập thất bại. ${errorMsg}`);
      });
    }
  };

  return (
    <div className="w-full min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-[92%] max-w-[440px] bg-white rounded-[32px] shadow-2xl p-6 sm:p-8 border border-outline-variant/30 flex flex-col">
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-primary-container rounded-3xl flex items-center justify-center text-primary mb-4 shadow-inner rotate-3">
            <span className="material-symbols-outlined text-4xl">fastfood</span>
          </div>
          <h1 className="text-3xl font-bold text-primary mb-1">NLUFood</h1>
          <p className="text-on-surface-variant text-center text-sm">
            {mode === 'register' && 'Tạo tài khoản mới để bắt đầu đặt hàng'}
            {mode === 'login' && 'Đăng nhập để đặt món ăn yêu thích của bạn'}
            {mode === 'forgot' && 'Khôi phục mật khẩu tài khoản'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-error text-error text-sm rounded-r-lg flex items-center gap-3">
            <span className="material-symbols-outlined text-xl">error</span>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded-r-lg flex items-center gap-3">
            <span className="material-symbols-outlined text-xl">check_circle</span>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Họ và tên</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-xl">person</span>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full bg-surface border-2 border-outline-variant/50 rounded-2xl py-3.5 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary transition-all shadow-sm placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Email</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-xl">mail</span>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@hcmuaf.edu.vn"
                className="w-full bg-surface border-2 border-outline-variant/50 rounded-2xl py-3.5 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary transition-all shadow-sm placeholder:text-gray-400"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Số điện thoại</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-xl">call</span>
                <input 
                  type="tel" 
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0912345678"
                  className="w-full bg-surface border-2 border-outline-variant/50 rounded-2xl py-3.5 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary transition-all shadow-sm placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          {mode !== 'forgot' && (
            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Mật khẩu</label>
                {mode === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-xl">lock</span>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface border-2 border-outline-variant/50 rounded-2xl py-3.5 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary transition-all shadow-sm placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Xác nhận mật khẩu</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-xl">verified_user</span>
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface border-2 border-outline-variant/50 rounded-2xl py-3.5 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary transition-all shadow-sm placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Mật khẩu mới</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-xl">lock_reset</span>
                <input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full bg-surface border-2 border-outline-variant/50 rounded-2xl py-3.5 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary transition-all shadow-sm placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white font-bold py-4 rounded-2xl mt-4 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 hover:bg-primary/90"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Đang xử lý...</span>
              </div>
            ) : (
              mode === 'register' ? 'Tạo tài khoản' : mode === 'forgot' ? 'Xác nhận đặt lại mật khẩu' : 'Đăng nhập ngay'
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-outline-variant/30 flex flex-col items-center gap-2">
          {mode === 'login' && (
            <>
              <p className="text-on-surface-variant text-sm">Chưa có tài khoản?</p>
              <button 
                onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                className="text-primary font-bold hover:underline"
              >
                Đăng ký tài khoản mới
              </button>
            </>
          )}

          {mode === 'register' && (
            <>
              <p className="text-on-surface-variant text-sm">Đã có tài khoản?</p>
              <button 
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className="text-primary font-bold hover:underline"
              >
                Đăng nhập tại đây
              </button>
            </>
          )}

          {mode === 'forgot' && (
            <button 
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className="text-primary font-bold hover:underline text-sm flex items-center gap-1 mt-1"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Quay lại Đăng nhập
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
