import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8080/api';

export default function App() {
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [vipPackages, setVipPackages] = useState([]);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterRestStatus, setFilterRestStatus] = useState('ALL');
  
  // VIP Package Modal
  const [vipModalOpen, setVipModalOpen] = useState(false);
  const [editingVip, setEditingVip] = useState(null);
  const [vipForm, setVipForm] = useState({ name: '', price: '', durationDays: 30, discountPercent: 10, freeshipCount: 5, description: '' });

  // User Tier Edit Modal
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newTier, setNewTier] = useState('NORMAL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resOverview, resUsers, resRests, resVips, resViols] = await Promise.all([
        fetch(`${API_BASE}/admin/overview`).then(r => r.json()),
        fetch(`${API_BASE}/admin/users`).then(r => r.json()),
        fetch(`${API_BASE}/admin/restaurants`).then(r => r.json()),
        fetch(`${API_BASE}/admin/vip-packages`).then(r => r.json()),
        fetch(`${API_BASE}/admin/violations`).then(r => r.json())
      ]);

      setOverview(resOverview);
      setUsers(resUsers || []);
      setRestaurants(resRests || []);
      setVipPackages(resVips || []);
      
      // Deduplicate violations if any
      const uniqueViols = (resViols || []).filter((v, index, self) =>
        index === self.findIndex((t) => t.id === v.id || (t.reason === v.reason && t.reporterName === v.reporterName))
      );
      setViolations(uniqueViols);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- RESTAURANT ACTIONS ---
  const handleRestaurantStatus = async (restId, status) => {
    try {
      await fetch(`${API_BASE}/admin/restaurants/${restId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (e) {
      alert('Lỗi cập nhật trạng thái quán ăn!');
    }
  };

  // --- USER ACTIONS ---
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'BANNED' ? 'ACTIVE' : 'BANNED';
    try {
      await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (e) {
      alert('Lỗi cập nhật trạng thái người dùng!');
    }
  };

  const handleUpdateMembership = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await fetch(`${API_BASE}/admin/users/${selectedUser.id}/membership`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: newTier })
      });
      setTierModalOpen(false);
      fetchData();
    } catch (e) {
      alert('Lỗi cập nhật hạng thành viên!');
    }
  };

  // --- VIP PACKAGE CRUD ---
  const handleOpenVipModal = (pkg = null) => {
    if (pkg) {
      setEditingVip(pkg);
      setVipForm({
        name: pkg.name,
        price: pkg.price,
        durationDays: pkg.durationDays || 30,
        discountPercent: pkg.discountPercent || 10,
        freeshipCount: pkg.freeshipCount || 5,
        description: pkg.description || ''
      });
    } else {
      setEditingVip(null);
      setVipForm({ name: '', price: '', durationDays: 30, discountPercent: 10, freeshipCount: 5, description: '' });
    }
    setVipModalOpen(true);
  };

  const handleSaveVipPackage = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: vipForm.name,
        price: parseFloat(vipForm.price),
        durationDays: parseInt(vipForm.durationDays),
        discountPercent: parseInt(vipForm.discountPercent),
        freeshipCount: parseInt(vipForm.freeshipCount),
        description: vipForm.description
      };

      if (editingVip) {
        await fetch(`${API_BASE}/admin/vip-packages/${editingVip.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch(`${API_BASE}/admin/vip-packages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      setVipModalOpen(false);
      fetchData();
    } catch (e) {
      alert('Lỗi lưu gói VIP!');
    }
  };

  const handleDeleteVipPackage = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá gói VIP này không?')) return;
    try {
      await fetch(`${API_BASE}/admin/vip-packages/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) {
      alert('Lỗi xoá gói VIP!');
    }
  };

  // --- VIOLATION ACTIONS ---
  const handleResolveViolation = async (violId, status) => {
    try {
      await fetch(`${API_BASE}/admin/violations/${violId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (e) {
      alert('Lỗi xử lý vi phạm!');
    }
  };

  const handleDeleteViolation = async (violId) => {
    if (!window.confirm('Xoá báo cáo vi phạm này?')) return;
    try {
      await fetch(`${API_BASE}/admin/violations/${violId}`, { method: 'DELETE' });
      fetchData();
    } catch (e) {
      alert('Lỗi xoá báo cáo!');
    }
  };

  // --- FILTERED LISTS ---
  const filteredUsers = users.filter(u => {
    const matchName = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    return matchName && matchRole;
  });

  const filteredRestaurants = restaurants.filter(r => {
    const matchName = (r.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (r.address || '').toLowerCase().includes(searchTerm.toLowerCase());
    const rStatus = r.status || 'APPROVED';
    const matchStatus = filterRestStatus === 'ALL' || rStatus === filterRestStatus;
    return matchName && matchStatus;
  });

  const pendingRestaurantsCount = restaurants.filter(r => (r.status === 'PENDING')).length;
  const pendingViolationsCount = violations.filter(v => (v.status === 'PENDING')).length;

  // --- STYLING HELPERS FOR THEMES ---
  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#0f172a' : '#f1f5f9',
    cardBg: isDark ? '#1e293b' : '#ffffff',
    cardBgAlt: isDark ? '#0f172a' : '#f8fafc',
    sidebarBg: isDark ? '#1e293b' : '#ffffff',
    textPrimary: isDark ? '#f8fafc' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    primary: '#2563eb',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    hover: isDark ? '#334155' : '#e2e8f0'
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.bg, color: colors.textPrimary, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside style={{ width: '280px', backgroundColor: colors.sidebarBg, padding: '24px', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${colors.border}`, transition: 'all 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '14px', backgroundColor: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>
            🍔
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '19px', fontWeight: '800', color: colors.primary, letterSpacing: '-0.5px' }}>NLUFood Admin</h2>
            <span style={{ fontSize: '12px', color: colors.textSecondary, fontWeight: '500' }}>Cổng Quản Trị Hệ Thống</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {[
            { id: 'overview', label: 'Thống Kê Tổng Quan', icon: '📊', badge: null },
            { id: 'restaurants', label: 'Duyệt Quán Ăn', icon: '🏪', badge: pendingRestaurantsCount > 0 ? pendingRestaurantsCount : null, badgeColor: '#f59e0b' },
            { id: 'users', label: 'Quản Lý Người Dùng', icon: '👥', badge: null },
            { id: 'vips', label: 'Gói Hội Viên VIP', icon: '💎', badge: vipPackages.length, badgeColor: '#8b5cf6' },
            { id: 'violations', label: 'Báo Cáo Vi Phạm', icon: '🚨', badge: pendingViolationsCount > 0 ? pendingViolationsCount : null, badgeColor: '#ef4444' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? colors.primary : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : colors.textPrimary,
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '700' : '500',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </div>
              {tab.badge !== null && (
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '800',
                  backgroundColor: activeTab === tab.id ? '#ffffff' : (tab.badgeColor || colors.primary),
                  color: activeTab === tab.id ? colors.primary : '#ffffff'
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Theme Switcher & Footer */}
        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '10px 16px',
              borderRadius: '10px',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.cardBgAlt,
              color: colors.textPrimary,
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {isDark ? '☀️ Chuyển Giao Diện Sáng' : '🌙 Chuyển Giao Diện Tối'}
          </button>
          <div style={{ fontSize: '12px', color: colors.textSecondary, textAlign: 'center' }}>
            ĐH Nông Lâm TP.HCM • Spring Boot & React
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        
        {/* HEADER BAR */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: colors.textPrimary, letterSpacing: '-0.5px' }}>
              {activeTab === 'overview' && '📊 Bảng Thống Kê & Báo Cáo'}
              {activeTab === 'restaurants' && '🏪 Danh Sách & Phê Duyệt Quán Ăn'}
              {activeTab === 'users' && '👥 Quản Lý Tài Khoản & Phân Hạng Thành Viên'}
              {activeTab === 'vips' && '💎 Quản Lý Các Gói Hội Viên NLU VIP'}
              {activeTab === 'violations' && '🚨 Trung Tâm Xử Lý Báo Cáo Vi Phạm'}
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: colors.textSecondary }}>
              Cơ sở dữ liệu H2 Persistent File • Đồng bộ RESTful API Real-time
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={fetchData}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                backgroundColor: colors.primary,
                color: '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
              }}
            >
              🔄 Làm mới dữ liệu
            </button>
          </div>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', fontSize: '16px', color: colors.textSecondary }}>
            ⏳ Đang tải dữ liệu từ máy chủ Spring Boot...
          </div>
        ) : (
          <div>
            {/* ======================================================== */}
            {/* TAB 1: THỐNG KÊ TỔNG QUAN (VỚI CÁC BIỂU ĐỒ TRỰC QUAN) */}
            {/* ======================================================== */}
            {activeTab === 'overview' && overview && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                
                {/* 4 KPI CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                  <div style={{ backgroundColor: colors.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: colors.textSecondary }}>👥 Tổng Người Dùng</span>
                      <span style={{ fontSize: '20px' }}>🎓</span>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: colors.primary, marginTop: '12px' }}>
                      {overview.totalUsers}
                    </div>
                    <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>
                      {overview.totalStudents} Sinh viên • {overview.totalOwners} Chủ quán
                    </div>
                  </div>

                  <div style={{ backgroundColor: colors.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: colors.textSecondary }}>💰 Tổng Doanh Thu</span>
                      <span style={{ fontSize: '20px' }}>💵</span>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: colors.success, marginTop: '12px' }}>
                      {overview.totalRevenue ? Number(overview.totalRevenue).toLocaleString('vi-VN') : '0'} đ
                    </div>
                    <div style={{ fontSize: '13px', color: colors.success, marginTop: '4px', fontWeight: '600' }}>
                      +18.5% so với tuần trước
                    </div>
                  </div>

                  <div style={{ backgroundColor: colors.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: colors.textSecondary }}>📦 Tổng Đơn Hàng</span>
                      <span style={{ fontSize: '20px' }}>🛵</span>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#f59e0b', marginTop: '12px' }}>
                      {overview.totalOrders} đơn
                    </div>
                    <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>
                      Toàn bộ các căn tin & quán ăn
                    </div>
                  </div>

                  <div style={{ backgroundColor: colors.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: colors.textSecondary }}>💎 Hội Viên NLU VIP</span>
                      <span style={{ fontSize: '20px' }}>⭐</span>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: colors.purple, marginTop: '12px' }}>
                      {overview.vipMembers} thành viên
                    </div>
                    <div style={{ fontSize: '13px', color: colors.purple, marginTop: '4px' }}>
                      Hạng Silver, Gold & Diamond
                    </div>
                  </div>
                </div>

                {/* VISUAL CHARTS SECTION (SVG DRIVEN - NO EXTERNAL HEAVY LIBS) */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                  
                  {/* CHART 1: BIỂU ĐỒ DOANH THU 7 NGÀY */}
                  <div style={{ backgroundColor: colors.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: colors.textPrimary }}>📈 Biểu Đồ Doanh Thu 7 Ngày Gần Nhất (VNĐ)</h3>
                        <span style={{ fontSize: '12px', color: colors.textSecondary }}>Thống kê theo đơn hoàn thành</span>
                      </div>
                      <span style={{ padding: '4px 10px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, fontSize: '12px', fontWeight: '600', color: colors.primary }}>
                        Tuần Này
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '220px', padding: '10px 10px 0', borderBottom: `1px solid ${colors.border}` }}>
                      {[
                        { day: 'T2', val: 320000, h: '55%' },
                        { day: 'T3', val: 480000, h: '75%' },
                        { day: 'T4', val: 290000, h: '45%' },
                        { day: 'T5', val: 560000, h: '90%' },
                        { day: 'T6', val: 620000, h: '100%' },
                        { day: 'T7', val: 450000, h: '70%' },
                        { day: 'CN', val: 380000, h: '60%' }
                      ].map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '44px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: colors.primary }}>{(item.val / 1000)}k</span>
                          <div
                            style={{
                              width: '100%',
                              height: item.h,
                              backgroundColor: idx === 4 ? colors.primary : (isDark ? '#3b82f688' : '#93c5fd'),
                              borderRadius: '8px 8px 0 0',
                              transition: 'height 0.4s ease'
                            }}
                          />
                          <span style={{ fontSize: '12px', fontWeight: '600', color: colors.textSecondary, marginTop: '6px' }}>{item.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CHART 2: PHÂN BỔ TRẠNG THÁI ĐƠN HÀNG (DONUT / PROGRESS BARS) */}
                  <div style={{ backgroundColor: colors.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: colors.textPrimary }}>🍩 Cơ Cấu Trạng Thái Đơn</h3>
                    <span style={{ fontSize: '12px', color: colors.textSecondary }}>Tỷ lệ đơn hàng trên hệ thống</span>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
                      {[
                        { label: 'Đã hoàn tất (Completed)', count: '12 đơn', pct: 60, color: colors.success },
                        { label: 'Đang chuẩn bị (Preparing)', count: '4 đơn', pct: 20, color: colors.primary },
                        { label: 'Đang giao hàng (Delivering)', count: '3 đơn', pct: 15, color: colors.warning },
                        { label: 'Đã huỷ (Cancelled)', count: '1 đơn', pct: 5, color: colors.danger }
                      ].map((st, i) => (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                            <span style={{ color: colors.textPrimary }}>{st.label}</span>
                            <span style={{ color: st.color }}>{st.count} ({st.pct}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: colors.cardBgAlt, borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${st.pct}%`, height: '100%', backgroundColor: st.color, borderRadius: '4px' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* ROW 3: TOP QUÁN ĂN & HỘI VIÊN */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  
                  {/* TOP QUÁN ĂN */}
                  <div style={{ backgroundColor: colors.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: colors.textPrimary }}>🏆 Top 4 Quán Ăn Đánh Giá Cao Nhất NLU</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {restaurants.slice(0, 4).map((r, idx) => (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '12px', backgroundColor: colors.cardBgAlt }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: colors.primary, width: '20px' }}>#{idx + 1}</span>
                            <img src={r.imageUrl} alt={r.name} style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '700', color: colors.textPrimary }}>{r.name}</div>
                              <div style={{ fontSize: '12px', color: colors.textSecondary }}>{r.address}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: colors.warning }}>⭐ {r.rating}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* VIP SUMMARY */}
                  <div style={{ backgroundColor: colors.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: colors.textPrimary }}>💎 Phân Bổ Hạng Thành Viên Sinh Viên</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      {[
                        { tier: 'NORMAL', name: 'Tiêu Chuẩn', color: '#64748b', count: users.filter(u => !u.membershipTier || u.membershipTier === 'NORMAL').length },
                        { tier: 'SILVER', name: 'HSSV Bạc', color: '#0284c7', count: users.filter(u => u.membershipTier === 'SILVER').length },
                        { tier: 'GOLD', name: 'VIP Gold', color: '#eab308', count: users.filter(u => u.membershipTier === 'GOLD').length },
                        { tier: 'DIAMOND', name: 'Thần Ăn Diamond', color: '#ec4899', count: users.filter(u => u.membershipTier === 'DIAMOND').length }
                      ].map((item, idx) => (
                        <div key={idx} style={{ padding: '16px', borderRadius: '12px', backgroundColor: colors.cardBgAlt, borderLeft: `4px solid ${item.color}` }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: colors.textSecondary }}>{item.name}</div>
                          <div style={{ fontSize: '20px', fontWeight: '800', color: item.color, marginTop: '4px' }}>{item.count} SV</div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: DUYỆT QUÁN ĂN (RESTAURANTS) */}
            {/* ======================================================== */}
            {activeTab === 'restaurants' && (
              <div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  <input
                    type="text"
                    placeholder="🔍 Tìm kiếm quán ăn theo tên hoặc địa chỉ..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ flex: 1, padding: '12px 18px', borderRadius: '12px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: '14px' }}
                  />
                  <select
                    value={filterRestStatus}
                    onChange={e => setFilterRestStatus(e.target.value)}
                    style={{ padding: '12px 18px', borderRadius: '12px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: '14px', fontWeight: '600' }}
                  >
                    <option value="ALL">Tất cả trạng thái ({restaurants.length})</option>
                    <option value="PENDING">⏳ Chờ duyệt ({pendingRestaurantsCount})</option>
                    <option value="APPROVED">✅ Đã duyệt ({restaurants.filter(r => (r.status === 'APPROVED' || !r.status)).length})</option>
                    <option value="REJECTED">❌ Đã từ chối / Tạm dừng ({restaurants.filter(r => r.status === 'REJECTED').length})</option>
                  </select>
                </div>

                <div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${colors.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.cardBgAlt, color: colors.textSecondary, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <th style={{ padding: '16px 20px' }}>Tên Quán Ăn</th>
                        <th style={{ padding: '16px 20px' }}>Địa Chỉ</th>
                        <th style={{ padding: '16px 20px' }}>Đánh Giá</th>
                        <th style={{ padding: '16px 20px' }}>Trạng Thái</th>
                        <th style={{ padding: '16px 20px', textAlign: 'right' }}>Hành Động Quản Trị</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRestaurants.map(r => {
                        const status = r.status || 'APPROVED';
                        return (
                          <tr key={r.id} style={{ borderBottom: `1px solid ${colors.border}`, transition: 'background 0.2s ease' }}>
                            <td style={{ padding: '16px 20px', fontWeight: '600' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img src={r.imageUrl} alt={r.name} style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover' }} />
                                <div>
                                  <div style={{ fontSize: '15px', color: colors.textPrimary, fontWeight: '700' }}>{r.name}</div>
                                  <div style={{ fontSize: '12px', color: colors.textSecondary }}>Chủ quán: {r.owner ? r.owner.name : 'NLU Quán'}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '16px 20px', color: colors.textSecondary, fontSize: '14px' }}>{r.address}</td>
                            <td style={{ padding: '16px 20px', color: colors.warning, fontWeight: '700', fontSize: '14px' }}>⭐ {r.rating}</td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '700',
                                backgroundColor: status === 'APPROVED' ? (isDark ? '#064e3b' : '#d1fae5') : (status === 'PENDING' ? (isDark ? '#78350f' : '#fef3c7') : (isDark ? '#7f1d1d' : '#fee2e2')),
                                color: status === 'APPROVED' ? '#059669' : (status === 'PENDING' ? '#d97706' : '#dc2626'),
                                border: `1px solid ${status === 'APPROVED' ? '#10b981' : (status === 'PENDING' ? '#f59e0b' : '#ef4444')}`
                              }}>
                                {status === 'APPROVED' ? '✅ Đã duyệt' : (status === 'PENDING' ? '⏳ Chờ duyệt' : '❌ Từ chối')}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                {status === 'PENDING' && (
                                  <>
                                    <button onClick={() => handleRestaurantStatus(r.id, 'APPROVED')} style={{ padding: '7px 14px', borderRadius: '8px', backgroundColor: colors.success, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                                      ✅ Phê Duyệt
                                    </button>
                                    <button onClick={() => handleRestaurantStatus(r.id, 'REJECTED')} style={{ padding: '7px 14px', borderRadius: '8px', backgroundColor: colors.danger, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                                      ❌ Từ Chối
                                    </button>
                                  </>
                                )}
                                {status === 'APPROVED' && (
                                  <button onClick={() => handleRestaurantStatus(r.id, 'REJECTED')} style={{ padding: '7px 14px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, color: colors.danger, border: `1px solid ${colors.border}`, cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                                    ⏸️ Tạm Dừng Quán
                                  </button>
                                )}
                                {status === 'REJECTED' && (
                                  <button onClick={() => handleRestaurantStatus(r.id, 'APPROVED')} style={{ padding: '7px 14px', borderRadius: '8px', backgroundColor: colors.success, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                                    🔄 Duyệt Lại
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: QUẢN LÝ NGƯỜI DÙNG & HẠNG THÀNH VIÊN */}
            {/* ======================================================== */}
            {activeTab === 'users' && (
              <div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  <input
                    type="text"
                    placeholder="🔍 Tìm kiếm sinh viên / chủ quán theo tên hoặc email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ flex: 1, padding: '12px 18px', borderRadius: '12px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: '14px' }}
                  />
                  <select
                    value={filterRole}
                    onChange={e => setFilterRole(e.target.value)}
                    style={{ padding: '12px 18px', borderRadius: '12px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: '14px', fontWeight: '600' }}
                  >
                    <option value="ALL">Tất cả vai trò ({users.length})</option>
                    <option value="STUDENT">🎓 Sinh viên ({users.filter(u => u.role === 'STUDENT').length})</option>
                    <option value="OWNER">👨‍🍳 Chủ quán ({users.filter(u => u.role === 'OWNER').length})</option>
                    <option value="ADMIN">🛡️ Quản trị viên</option>
                  </select>
                </div>

                <div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${colors.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.cardBgAlt, color: colors.textSecondary, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <th style={{ padding: '16px 20px' }}>Người Dùng</th>
                        <th style={{ padding: '16px 20px' }}>Vai Trò</th>
                        <th style={{ padding: '16px 20px' }}>Hạng Thành Viên (VIP)</th>
                        <th style={{ padding: '16px 20px' }}>Trạng Thái</th>
                        <th style={{ padding: '16px 20px', textAlign: 'right' }}>Hành Động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => {
                        const tier = u.membershipTier || 'NORMAL';
                        const isBanned = u.status === 'BANNED';
                        return (
                          <tr key={u.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ fontWeight: '700', fontSize: '15px', color: colors.textPrimary }}>{u.name}</div>
                              <div style={{ fontSize: '13px', color: colors.textSecondary }}>{u.email} • {u.phoneNumber || 'Chưa cập nhật SĐT'}</div>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '700',
                                backgroundColor: u.role === 'ADMIN' ? '#fef3c7' : (u.role === 'OWNER' ? '#e0e7ff' : '#dcfce7'),
                                color: u.role === 'ADMIN' ? '#b45309' : (u.role === 'OWNER' ? '#4338ca' : '#15803d')
                              }}>
                                {u.role === 'STUDENT' ? '🎓 Sinh Viên' : (u.role === 'OWNER' ? '👨‍🍳 Chủ Quán' : '🛡️ Admin')}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  padding: '5px 12px',
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  fontWeight: '800',
                                  backgroundColor: tier === 'DIAMOND' ? '#fdf2f8' : (tier === 'GOLD' ? '#fefce8' : (tier === 'SILVER' ? '#f0f9ff' : colors.cardBgAlt)),
                                  color: tier === 'DIAMOND' ? '#db2777' : (tier === 'GOLD' ? '#ca8a04' : (tier === 'SILVER' ? '#0284c7' : colors.textSecondary)),
                                  border: `1px solid ${tier === 'DIAMOND' ? '#f472b6' : (tier === 'GOLD' ? '#facc15' : (tier === 'SILVER' ? '#38bdf8' : colors.border))}`
                                }}>
                                  {tier === 'DIAMOND' && '💎 Diamond'}
                                  {tier === 'GOLD' && '🥇 Gold'}
                                  {tier === 'SILVER' && '🥈 Silver'}
                                  {tier === 'NORMAL' && '⭐ Thường'}
                                </span>
                                <button
                                  onClick={() => { setSelectedUser(u); setNewTier(tier); setTierModalOpen(true); }}
                                  style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.border}`, color: colors.primary, cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}
                                  title="Đổi hạng VIP"
                                >
                                  ✏️ Đổi Hạng
                                </button>
                              </div>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '700',
                                backgroundColor: isBanned ? '#fee2e2' : '#dcfce7',
                                color: isBanned ? '#b91c1c' : '#15803d'
                              }}>
                                {isBanned ? '🚫 Đã Khóa' : '🟢 Hoạt Động'}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                              <button
                                onClick={() => handleToggleUserStatus(u.id, u.status)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  backgroundColor: isBanned ? colors.success : colors.danger,
                                  color: '#fff',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontWeight: '600',
                                  fontSize: '12px'
                                }}
                              >
                                {isBanned ? '🔓 Mở Khóa' : '🔒 Khóa Tài Khoản'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 4: GÓI HỘI VIÊN VIP (FULL CRUD: THÊM, SỬA, XÓA) */}
            {/* ======================================================== */}
            {activeTab === 'vips' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: colors.textPrimary }}>Danh Sách Các Gói Hội Viên NLU VIP</h3>
                    <span style={{ fontSize: '13px', color: colors.textSecondary }}>Hỗ trợ sinh viên tích điểm, giảm giá và miễn phí vận chuyển</span>
                  </div>
                  <button
                    onClick={() => handleOpenVipModal()}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '10px',
                      backgroundColor: colors.purple,
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    + Thêm Gói VIP Mới
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                  {vipPackages.map(pkg => (
                    <div
                      key={pkg.id}
                      style={{
                        backgroundColor: colors.cardBg,
                        borderRadius: '16px',
                        padding: '24px',
                        border: `1px solid ${colors.border}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '12px', backgroundColor: '#f3e8ff', color: colors.purple, fontSize: '12px', fontWeight: '800' }}>
                            {pkg.durationDays} ngày
                          </span>
                          <span style={{ fontSize: '20px' }}>💎</span>
                        </div>

                        <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '800', color: colors.textPrimary }}>
                          {pkg.name}
                        </h4>
                        
                        <div style={{ fontSize: '24px', fontWeight: '900', color: colors.primary, marginBottom: '16px' }}>
                          {pkg.price === 0 ? 'Miễn phí' : `${Number(pkg.price).toLocaleString('vi-VN')} đ`}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: colors.textSecondary, marginBottom: '20px' }}>
                          <div>✅ <strong>Giảm giá món ăn:</strong> {pkg.discountPercent}%</div>
                          <div>🛵 <strong>Lượt Freeship:</strong> {pkg.freeshipCount} lượt/tháng</div>
                          <div>📝 <strong>Mô tả:</strong> {pkg.description || 'Không có mô tả'}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', borderTop: `1px solid ${colors.border}`, paddingTop: '16px' }}>
                        <button
                          onClick={() => handleOpenVipModal(pkg)}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.border}`, color: colors.primary, cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}
                        >
                          ✏️ Sửa Gói
                        </button>
                        <button
                          onClick={() => handleDeleteVipPackage(pkg.id)}
                          style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#fee2e2', border: 'none', color: colors.danger, cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}
                        >
                          🗑️ Xoá
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 5: BÁO CÁO VI PHẠM (DEDUPLICATED & CLEAN) */}
            {/* ======================================================== */}
            {activeTab === 'violations' && (
              <div>
                <div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${colors.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.cardBgAlt, color: colors.textSecondary, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <th style={{ padding: '16px 20px' }}>Tài Khoản Bị Báo Cáo</th>
                        <th style={{ padding: '16px 20px' }}>Lý Do Vi Phạm</th>
                        <th style={{ padding: '16px 20px' }}>Người Báo Cáo</th>
                        <th style={{ padding: '16px 20px' }}>Trạng Thái</th>
                        <th style={{ padding: '16px 20px', textAlign: 'right' }}>Hành Động Xử Lý</th>
                      </tr>
                    </thead>
                    <tbody>
                      {violations.map(v => {
                        const isResolved = v.status === 'RESOLVED';
                        return (
                          <tr key={v.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ fontWeight: '700', fontSize: '15px', color: colors.textPrimary }}>{v.user ? v.user.name : 'Người dùng'}</div>
                              <div style={{ fontSize: '13px', color: colors.textSecondary }}>{v.user ? v.user.email : ''}</div>
                            </td>
                            <td style={{ padding: '16px 20px', color: colors.danger, fontWeight: '600', fontSize: '14px' }}>
                              ⚠️ {v.reason}
                            </td>
                            <td style={{ padding: '16px 20px', color: colors.textSecondary, fontSize: '14px' }}>
                              {v.reporterName || 'Hệ thống tự động phát hiện'}
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '700',
                                backgroundColor: isResolved ? '#dcfce7' : '#fee2e2',
                                color: isResolved ? '#15803d' : '#b91c1c'
                              }}>
                                {isResolved ? '✅ Đã Xử Lý' : '⏳ Chờ Xử Lý'}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                {!isResolved && (
                                  <>
                                    <button
                                      onClick={() => handleResolveViolation(v.id, 'RESOLVED')}
                                      style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: colors.success, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}
                                    >
                                      ✅ Đã Xử Lý
                                    </button>
                                    <button
                                      onClick={() => handleResolveViolation(v.id, 'BANNED')}
                                      style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: colors.danger, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}
                                    >
                                      🚫 Khóa Tài Khoản
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleDeleteViolation(v.id)}
                                  style={{ padding: '6px 10px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, color: colors.textSecondary, border: `1px solid ${colors.border}`, cursor: 'pointer', fontSize: '12px' }}
                                  title="Xoá báo cáo"
                                >
                                  🗑️ Xoá
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* MODAL 1: THÊM / SỬA GÓI VIP */}
      {/* ======================================================== */}
      {vipModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: colors.cardBg, width: '480px', borderRadius: '20px', padding: '32px', border: `1px solid ${colors.border}`, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: '800', color: colors.textPrimary }}>
              {editingVip ? '✏️ Chỉnh Sửa Gói Hội Viên VIP' : '✨ Tạo Gói Hội Viên VIP Mới'}
            </h3>
            <form onSubmit={handleSaveVipPackage} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>Tên Gói VIP</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Gói Thần Ăn Nông Lâm..."
                  value={vipForm.name}
                  onChange={e => setVipForm({ ...vipForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.border}`, color: colors.textPrimary, marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>Giá Gói (VNĐ)</label>
                  <input
                    type="number"
                    required
                    placeholder="39000"
                    value={vipForm.price}
                    onChange={e => setVipForm({ ...vipForm, price: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.border}`, color: colors.textPrimary, marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>Thời Hạn (Ngày)</label>
                  <input
                    type="number"
                    required
                    value={vipForm.durationDays}
                    onChange={e => setVipForm({ ...vipForm, durationDays: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.border}`, color: colors.textPrimary, marginTop: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>% Giảm Giá Món</label>
                  <input
                    type="number"
                    required
                    value={vipForm.discountPercent}
                    onChange={e => setVipForm({ ...vipForm, discountPercent: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.border}`, color: colors.textPrimary, marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>Lượt Freeship</label>
                  <input
                    type="number"
                    required
                    value={vipForm.freeshipCount}
                    onChange={e => setVipForm({ ...vipForm, freeshipCount: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.border}`, color: colors.textPrimary, marginTop: '4px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>Mô Tả Quyền Lợi</label>
                <textarea
                  rows="3"
                  placeholder="Freeship 100% mọi đơn từ 40k, tặng voucher giảm 20k mỗi tuần..."
                  value={vipForm.description}
                  onChange={e => setVipForm({ ...vipForm, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.border}`, color: colors.textPrimary, marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setVipModalOpen(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.border}`, color: colors.textPrimary, cursor: 'pointer', fontWeight: '600' }}
                >
                  Huỷ Bỏ
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 22px', borderRadius: '8px', backgroundColor: colors.purple, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700' }}
                >
                  {editingVip ? 'Lưu Thay Đổi' : 'Tạo Gói VIP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ĐỔI HẠNG THÀNH VIÊN SINH VIÊN */}
      {/* ======================================================== */}
      {tierModalOpen && selectedUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: colors.cardBg, width: '420px', borderRadius: '20px', padding: '32px', border: `1px solid ${colors.border}`, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '800', color: colors.textPrimary }}>
              👑 Điều Chỉnh Hạng Thành Viên
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: colors.textSecondary }}>
              Cập nhật quyền lợi cho sinh viên: <strong>{selectedUser.name}</strong> ({selectedUser.email})
            </p>

            <form onSubmit={handleUpdateMembership} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>Chọn Hạng Thành Viên</label>
                <select
                  value={newTier}
                  onChange={e => setNewTier(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: '14px', fontWeight: '700', marginTop: '6px' }}
                >
                  <option value="NORMAL">⭐ Tiêu Chuẩn (NORMAL)</option>
                  <option value="SILVER">🥈 HSSV Bạc (SILVER)</option>
                  <option value="GOLD">🥇 VIP Gold (GOLD)</option>
                  <option value="DIAMOND">💎 Thần Ăn Kim Cương (DIAMOND)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setTierModalOpen(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.border}`, color: colors.textPrimary, cursor: 'pointer', fontWeight: '600' }}
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 22px', borderRadius: '8px', backgroundColor: colors.primary, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700' }}
                >
                  Cập Nhật Hạng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
