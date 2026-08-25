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
      
      // Deduplicate violations
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

  // --- THEME COLOR PALETTE ---
  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#090d16' : '#f8fafc',
    sidebarBg: isDark ? '#111827' : '#ffffff',
    cardBg: isDark ? '#1f2937' : '#ffffff',
    cardBgAlt: isDark ? '#111827' : '#f1f5f9',
    textPrimary: isDark ? '#f9fafb' : '#0f172a',
    textSecondary: isDark ? '#9ca3af' : '#64748b',
    border: isDark ? '#374151' : '#e2e8f0',
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryLight: isDark ? '#1e3a8a' : '#dbeafe',
    success: '#10b981',
    successLight: isDark ? '#064e3b' : '#d1fae5',
    warning: '#f59e0b',
    warningLight: isDark ? '#78350f' : '#fef3c7',
    danger: '#ef4444',
    dangerLight: isDark ? '#7f1d1d' : '#fee2e2',
    purple: '#8b5cf6',
    purpleLight: isDark ? '#581c87' : '#f3e8ff'
  };

  // --- 7-DAY REVENUE DATA FOR SVG CHARTS ---
  const revenueChartData = [
    { day: 'Thứ 2', date: '19/08', value: 380000, orders: 12 },
    { day: 'Thứ 3', date: '20/08', value: 520000, orders: 18 },
    { day: 'Thứ 4', date: '21/08', value: 410000, orders: 14 },
    { day: 'Thứ 5', date: '22/08', value: 680000, orders: 22 },
    { day: 'Thứ 6', date: '23/08', value: 850000, orders: 28 },
    { day: 'Thứ 7', date: '24/08', value: 590000, orders: 19 },
    { day: 'Chủ Nhật', date: '25/08', value: 460000, orders: 15 }
  ];

  const maxRev = 900000;
  const chartHeight = 180;
  const chartWidth = 520;
  const colWidth = 36;
  const paddingX = 40;
  const stepX = (chartWidth - paddingX * 2) / (revenueChartData.length - 1);

  // Generate SVG Points for Line & Area Chart
  const svgPoints = revenueChartData.map((d, i) => {
    const x = paddingX + i * stepX;
    const y = chartHeight - (d.value / maxRev) * (chartHeight - 30);
    return { x, y, ...d };
  });

  const polylineStr = svgPoints.map(p => `${p.x},${p.y}`).join(' ');
  const areaPathStr = `M ${svgPoints[0].x},${chartHeight} ` + svgPoints.map(p => `L ${p.x},${p.y}`).join(' ') + ` L ${svgPoints[svgPoints.length - 1].x},${chartHeight} Z`;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.bg, color: colors.textPrimary, width: '100vw', overflowX: 'hidden' }}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside style={{ width: '280px', minWidth: '280px', backgroundColor: colors.sidebarBg, padding: '24px 20px', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${colors.border}`, zIndex: 10 }}>
        
        {/* LOGO & TITLE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingLeft: '6px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: '#fff', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)', flexShrink: 0 }}>
            🍱
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: colors.textPrimary, whiteSpace: 'nowrap' }}>NLUFood Admin</h2>
            <span style={{ fontSize: '12px', color: colors.textSecondary, fontWeight: '600', whiteSpace: 'nowrap' }}>Quản Trị Hệ Thống</span>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {[
            { id: 'overview', label: 'Thống Kê Tổng Quan', icon: '📊', badge: null },
            { id: 'restaurants', label: 'Duyệt Quán Ăn', icon: '🏪', badge: pendingRestaurantsCount > 0 ? `${pendingRestaurantsCount} chờ` : null, badgeColor: colors.warning },
            { id: 'users', label: 'Quản Lý Người Dùng', icon: '👥', badge: null },
            { id: 'vips', label: 'Gói Hội Viên VIP', icon: '💎', badge: `${vipPackages.length} gói`, badgeColor: colors.purple },
            { id: 'violations', label: 'Báo Cáo Vi Phạm', icon: '🚨', badge: pendingViolationsCount > 0 ? `${pendingViolationsCount} mới` : null, badgeColor: colors.danger },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: isActive ? colors.primary : 'transparent',
                  color: isActive ? '#ffffff' : colors.textPrimary,
                  fontSize: '14px',
                  fontWeight: isActive ? '700' : '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '17px', flexShrink: 0 }}>{tab.icon}</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{tab.label}</span>
                </div>
                {tab.badge !== null && (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '800',
                    backgroundColor: isActive ? '#ffffff' : (tab.badgeColor || colors.primary),
                    color: isActive ? colors.primary : '#ffffff',
                    whiteSpace: 'nowrap'
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* THEME TOGGLE & FOOTER */}
        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.cardBgAlt,
              color: colors.textPrimary,
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {isDark ? '☀️ Chế Độ Giao Diện Sáng' : '🌙 Chế Độ Giao Diện Tối'}
          </button>
          <div style={{ fontSize: '11px', color: colors.textSecondary, textAlign: 'center', fontWeight: '500' }}>
            ĐH Nông Lâm TP.HCM • Spring Boot & React
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto', minWidth: '0' }}>
        
        {/* HEADER BAR */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'nowrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: colors.textPrimary, letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
              {activeTab === 'overview' && '📊 Thống Kê & Báo Cáo Hoạt Động'}
              {activeTab === 'restaurants' && '🏪 Danh Sách & Phê Duyệt Quán Ăn'}
              {activeTab === 'users' && '👥 Quản Lý Tài Khoản & Phân Hạng Thành Viên'}
              {activeTab === 'vips' && '💎 Quản Lý Các Gói Hội Viên NLU VIP'}
              {activeTab === 'violations' && '🚨 Trung Tâm Xử Lý Báo Cáo Vi Phạm'}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.textSecondary, whiteSpace: 'nowrap' }}>
              Cơ sở dữ liệu H2 Persistent File • Kết nối Spring Boot REST API
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button
              onClick={fetchData}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                backgroundColor: colors.primary,
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                whiteSpace: 'nowrap'
              }}
            >
              🔄 Tải lại dữ liệu
            </button>
          </div>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', fontSize: '15px', color: colors.textSecondary, fontWeight: '600' }}>
            ⏳ Đang tải dữ liệu từ máy chủ Spring Boot...
          </div>
        ) : (
          <div>
            {/* ======================================================== */}
            {/* TAB 1: THỐNG KÊ TỔNG QUAN (VỚI BIỂU ĐỒ CỘT & ĐƯỜNG SVG) */}
            {/* ======================================================== */}
            {activeTab === 'overview' && overview && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* 4 KPI METRIC CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
                  <div style={{ backgroundColor: colors.cardBg, padding: '20px', borderRadius: '14px', border: `1px solid ${colors.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: colors.textSecondary, whiteSpace: 'nowrap' }}>👥 Tổng Người Dùng</span>
                      <span style={{ fontSize: '20px' }}>🎓</span>
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: colors.primary, marginTop: '8px' }}>
                      {overview.totalUsers}
                    </div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px', whiteSpace: 'nowrap' }}>
                      {overview.totalStudents} Sinh viên • {overview.totalOwners} Chủ quán
                    </div>
                  </div>

                  <div style={{ backgroundColor: colors.cardBg, padding: '20px', borderRadius: '14px', border: `1px solid ${colors.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: colors.textSecondary, whiteSpace: 'nowrap' }}>💎 Doanh Thu Gói Hội Viên VIP</span>
                      <span style={{ fontSize: '20px' }}>💰</span>
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: colors.purple, marginTop: '8px', whiteSpace: 'nowrap' }}>
                      3.500.000 đ
                    </div>
                    <div style={{ fontSize: '12px', color: colors.purple, marginTop: '4px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                      89 lượt đăng ký tuần này (+34.5%)
                    </div>
                  </div>

                  <div style={{ backgroundColor: colors.cardBg, padding: '20px', borderRadius: '14px', border: `1px solid ${colors.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: colors.textSecondary, whiteSpace: 'nowrap' }}>📦 Tổng Đơn Hàng</span>
                      <span style={{ fontSize: '20px' }}>🛵</span>
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: colors.warning, marginTop: '8px' }}>
                      {overview.totalOrders} đơn
                    </div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px', whiteSpace: 'nowrap' }}>
                      Giao tới KTX A, KTX B & Giảng đường
                    </div>
                  </div>

                  <div style={{ backgroundColor: colors.cardBg, padding: '20px', borderRadius: '14px', border: `1px solid ${colors.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: colors.textSecondary, whiteSpace: 'nowrap' }}>⭐ Thành Viên Đang Kích Hoạt</span>
                      <span style={{ fontSize: '20px' }}>👑</span>
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: colors.primary, marginTop: '8px' }}>
                      {overview.vipMembers} thành viên
                    </div>
                    <div style={{ fontSize: '12px', color: colors.primary, marginTop: '4px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      Hưởng quyền lợi freeship & giảm giá
                    </div>
                  </div>
                </div>

                {/* 2 MAIN CHARTS ROW */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px' }}>
                  
                  {/* CHART 1: SVG DUAL BAR & LINE CHART DOANH THU GÓI VIP */}
                  <div style={{ backgroundColor: colors.cardBg, padding: '22px', borderRadius: '16px', border: `1px solid ${colors.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: colors.textPrimary }}>📈 Doanh Thu Đăng Ký Gói VIP 7 Ngày Gần Nhất</h3>
                        <span style={{ fontSize: '12px', color: colors.textSecondary }}>Tiền thu được từ việc sinh viên nâng cấp / gia hạn các gói VIP (VNĐ)</span>
                      </div>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: colors.purpleLight, color: colors.purple, fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                        💎 Doanh Thu VIP
                      </span>
                    </div>

                    {/* SVG CHART CONTAINER */}
                    <div style={{ width: '100%', overflowX: 'auto' }}>
                      <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 35}`} style={{ width: '100%', height: '240px' }}>
                        <defs>
                          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.85" />
                            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.3" />
                          </linearGradient>
                          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Y-Axis Grid Lines */}
                        {[0, 200000, 400000, 600000, 800000].map((val, idx) => {
                          const y = chartHeight - (val / maxRev) * (chartHeight - 30);
                          return (
                            <g key={idx}>
                              <line x1="10" y1={y} x2={chartWidth - 10} y2={y} stroke={isDark ? '#374151' : '#e2e8f0'} strokeDasharray="3 3" strokeWidth="1" />
                              <text x="12" y={y - 4} fill={colors.textSecondary} fontSize="10" fontWeight="600">{(val / 1000)}k</text>
                            </g>
                          );
                        })}

                        {/* Area Gradient under line */}
                        <path d={areaPathStr} fill="url(#areaGrad)" />

                        {/* Bars for each day */}
                        {revenueChartData.map((d, i) => {
                          const barH = (d.value / maxRev) * (chartHeight - 30);
                          const x = paddingX + i * stepX - colWidth / 2;
                          const y = chartHeight - barH;
                          return (
                            <g key={i}>
                              <rect
                                x={x}
                                y={y}
                                width={colWidth}
                                height={barH}
                                rx="6"
                                fill="url(#barGrad)"
                                stroke="#8b5cf6"
                                strokeWidth="1"
                              />
                              <text
                                x={x + colWidth / 2}
                                y={y - 6}
                                textAnchor="middle"
                                fill={colors.purple}
                                fontSize="11"
                                fontWeight="800"
                              >
                                {d.value / 1000}k
                              </text>
                              <text
                                x={x + colWidth / 2}
                                y={chartHeight + 16}
                                textAnchor="middle"
                                fill={colors.textPrimary}
                                fontSize="11"
                                fontWeight="700"
                              >
                                {d.day}
                              </text>
                              <text
                                x={x + colWidth / 2}
                                y={chartHeight + 28}
                                textAnchor="middle"
                                fill={colors.textSecondary}
                                fontSize="10"
                                fontWeight="500"
                              >
                                {d.date}
                              </text>
                            </g>
                          );
                        })}

                        {/* Connecting Line Chart */}
                        <polyline
                          fill="none"
                          stroke="#7c3aed"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={polylineStr}
                        />

                        {/* Data Points / Circles */}
                        {svgPoints.map((p, i) => (
                          <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r="5"
                            fill="#ffffff"
                            stroke="#7c3aed"
                            strokeWidth="2.5"
                          />
                        ))}
                      </svg>
                    </div>
                  </div>

                  {/* CHART 2: SVG DONUT CHART CƠ CẤU GÓI VIP ĐƯỢC ĐĂNG KÝ */}
                  <div style={{ backgroundColor: colors.cardBg, padding: '22px', borderRadius: '16px', border: `1px solid ${colors.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: colors.textPrimary }}>🍩 Cơ Cấu Gói VIP Đăng Ký</h3>
                    <span style={{ fontSize: '12px', color: colors.textSecondary }}>Tỷ lệ sinh viên lựa chọn các gói VIP</span>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '16px', position: 'relative' }}>
                      <svg width="150" height="150" viewBox="0 0 150 150">
                        {/* Background track */}
                        <circle cx="75" cy="75" r="55" fill="none" stroke={isDark ? '#374151' : '#e2e8f0'} strokeWidth="18" />
                        
                        {/* VIP Gold slice: 45% (circumference = 345.5) -> dash = 155.5 */}
                        <circle cx="75" cy="75" r="55" fill="none" stroke="#eab308" strokeWidth="18" strokeDasharray="155.5 345.5" strokeDashoffset="0" transform="rotate(-90 75 75)" />
                        
                        {/* HSSV Bạc slice: 30% -> dash = 103.6 */}
                        <circle cx="75" cy="75" r="55" fill="none" stroke="#0284c7" strokeWidth="18" strokeDasharray="103.6 345.5" strokeDashoffset="-155.5" transform="rotate(-90 75 75)" />
                        
                        {/* Kim Cương slice: 15% -> dash = 51.8 */}
                        <circle cx="75" cy="75" r="55" fill="none" stroke="#ec4899" strokeWidth="18" strokeDasharray="51.8 345.5" strokeDashoffset="-259.1" transform="rotate(-90 75 75)" />
                        
                        {/* Dùng Thử slice: 10% -> dash = 34.6 */}
                        <circle cx="75" cy="75" r="55" fill="none" stroke="#8b5cf6" strokeWidth="18" strokeDasharray="34.6 345.5" strokeDashoffset="-310.9" transform="rotate(-90 75 75)" />
                        
                        <text x="75" y="72" textAnchor="middle" fill={colors.textPrimary} fontSize="18" fontWeight="800">89</text>
                        <text x="75" y="86" textAnchor="middle" fill={colors.textSecondary} fontSize="11" fontWeight="600">Lượt Mua</text>
                      </svg>
                    </div>

                    {/* Chart Legends */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                      {[
                        { label: 'Gói VIP Gold (39k/tháng)', count: '40 lượt', pct: '45%', color: '#eab308' },
                        { label: 'Gói HSSV Bạc (19k/tháng)', count: '27 lượt', pct: '30%', color: '#0284c7' },
                        { label: 'Gói Kim Cương (99k/học kỳ)', count: '13 lượt', pct: '15%', color: '#ec4899' },
                        { label: 'Gói VIP Thần Ăn (149k/kỳ)', count: '9 lượt', pct: '10%', color: '#8b5cf6' }
                      ].map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: item.color, flexShrink: 0 }} />
                            <span style={{ color: colors.textPrimary, fontWeight: '600', whiteSpace: 'nowrap' }}>{item.label}</span>
                          </div>
                          <span style={{ fontWeight: '700', color: item.color, whiteSpace: 'nowrap' }}>{item.count} ({item.pct})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* ROW 3: TOP QUÁN ĂN & PHÂN BỔ HỘI VIÊN */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  
                  {/* TOP QUÁN ĂN */}
                  <div style={{ backgroundColor: colors.cardBg, padding: '22px', borderRadius: '16px', border: `1px solid ${colors.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '800', color: colors.textPrimary }}>🏆 Top 4 Quán Ăn Đánh Giá Cao Nhất NLU</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {restaurants.slice(0, 4).map((r, idx) => (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', backgroundColor: colors.cardBgAlt }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: colors.primary, width: '18px' }}>#{idx + 1}</span>
                            <img src={r.imageUrl} alt={r.name} style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover' }} />
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '700', color: colors.textPrimary, whiteSpace: 'nowrap' }}>{r.name}</div>
                              <div style={{ fontSize: '12px', color: colors.textSecondary, whiteSpace: 'nowrap' }}>{r.address}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: colors.warning, whiteSpace: 'nowrap' }}>⭐ {r.rating}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* VIP SUMMARY */}
                  <div style={{ backgroundColor: colors.cardBg, padding: '22px', borderRadius: '16px', border: `1px solid ${colors.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '800', color: colors.textPrimary }}>💎 Phân Bổ Hạng Hội Viên Sinh Viên</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {[
                        { tier: 'NORMAL', name: 'Tiêu Chuẩn', color: '#64748b', count: users.filter(u => !u.membershipTier || u.membershipTier === 'NORMAL').length },
                        { tier: 'SILVER', name: 'HSSV Bạc', color: '#0284c7', count: users.filter(u => u.membershipTier === 'SILVER').length },
                        { tier: 'GOLD', name: 'VIP Gold', color: '#eab308', count: users.filter(u => u.membershipTier === 'GOLD').length },
                        { tier: 'DIAMOND', name: 'Kim Cương', color: '#ec4899', count: users.filter(u => u.membershipTier === 'DIAMOND').length }
                      ].map((item, idx) => (
                        <div key={idx} style={{ padding: '14px 16px', borderRadius: '10px', backgroundColor: colors.cardBgAlt, borderLeft: `4px solid ${item.color}` }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: colors.textSecondary, whiteSpace: 'nowrap' }}>{item.name}</div>
                          <div style={{ fontSize: '20px', fontWeight: '800', color: item.color, marginTop: '4px', whiteSpace: 'nowrap' }}>{item.count} Sinh viên</div>
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
                <div style={{ display: 'flex', gap: '14px', marginBottom: '18px' }}>
                  <input
                    type="text"
                    placeholder="🔍 Tìm kiếm quán ăn theo tên hoặc địa chỉ..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ flex: 1, padding: '11px 16px', borderRadius: '10px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: '14px' }}
                  />
                  <select
                    value={filterRestStatus}
                    onChange={e => setFilterRestStatus(e.target.value)}
                    style={{ padding: '11px 16px', borderRadius: '10px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap', minWidth: '180px' }}
                  >
                    <option value="ALL">Tất cả trạng thái ({restaurants.length})</option>
                    <option value="PENDING">⏳ Chờ duyệt ({pendingRestaurantsCount})</option>
                    <option value="APPROVED">✅ Đã duyệt ({restaurants.filter(r => (r.status === 'APPROVED' || !r.status)).length})</option>
                    <option value="REJECTED">❌ Từ chối / Tạm dừng ({restaurants.filter(r => r.status === 'REJECTED').length})</option>
                  </select>
                </div>

                <div style={{ backgroundColor: colors.cardBg, borderRadius: '14px', overflow: 'hidden', border: `1px solid ${colors.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.cardBgAlt, color: colors.textSecondary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <th style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>Tên Quán Ăn</th>
                        <th style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>Địa Chỉ</th>
                        <th style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>Đánh Giá</th>
                        <th style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>Trạng Thái</th>
                        <th style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>Hành Động Phê Duyệt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRestaurants.map(r => {
                        const status = r.status || 'APPROVED';
                        return (
                          <tr key={r.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                            <td style={{ padding: '14px 18px', fontWeight: '600' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img src={r.imageUrl} alt={r.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                                <div>
                                  <div style={{ fontSize: '14px', color: colors.textPrimary, fontWeight: '700', whiteSpace: 'nowrap' }}>{r.name}</div>
                                  <div style={{ fontSize: '12px', color: colors.textSecondary, whiteSpace: 'nowrap' }}>Chủ quán: {r.owner ? r.owner.name : 'NLU Quán'}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px 18px', color: colors.textSecondary, fontSize: '13px', whiteSpace: 'nowrap' }}>{r.address}</td>
                            <td style={{ padding: '14px 18px', color: colors.warning, fontWeight: '800', fontSize: '14px', whiteSpace: 'nowrap' }}>⭐ {r.rating}</td>
                            <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                              <span style={{
                                padding: '5px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '700',
                                whiteSpace: 'nowrap',
                                display: 'inline-block',
                                backgroundColor: status === 'APPROVED' ? colors.successLight : (status === 'PENDING' ? colors.warningLight : colors.dangerLight),
                                color: status === 'APPROVED' ? '#047857' : (status === 'PENDING' ? '#b45309' : '#b91c1c'),
                                border: `1px solid ${status === 'APPROVED' ? '#10b981' : (status === 'PENDING' ? '#f59e0b' : '#ef4444')}`
                              }}>
                                {status === 'APPROVED' ? '✅ Đã duyệt' : (status === 'PENDING' ? '⏳ Chờ duyệt' : '❌ Từ chối')}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                {status === 'PENDING' && (
                                  <>
                                    <button onClick={() => handleRestaurantStatus(r.id, 'APPROVED')} style={{ padding: '7px 13px', borderRadius: '8px', backgroundColor: colors.success, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                      ✅ Phê Duyệt
                                    </button>
                                    <button onClick={() => handleRestaurantStatus(r.id, 'REJECTED')} style={{ padding: '7px 13px', borderRadius: '8px', backgroundColor: colors.danger, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                      ❌ Từ Chối
                                    </button>
                                  </>
                                )}
                                {status === 'APPROVED' && (
                                  <button onClick={() => handleRestaurantStatus(r.id, 'REJECTED')} style={{ padding: '7px 14px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, color: colors.danger, border: `1px solid ${colors.border}`, cursor: 'pointer', fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                    ⏸️ Tạm Dừng Quán
                                  </button>
                                )}
                                {status === 'REJECTED' && (
                                  <button onClick={() => handleRestaurantStatus(r.id, 'APPROVED')} style={{ padding: '7px 14px', borderRadius: '8px', backgroundColor: colors.success, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap' }}>
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
                <div style={{ display: 'flex', gap: '14px', marginBottom: '18px' }}>
                  <input
                    type="text"
                    placeholder="🔍 Tìm kiếm sinh viên / chủ quán theo tên hoặc email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ flex: 1, padding: '11px 16px', borderRadius: '10px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: '14px' }}
                  />
                  <select
                    value={filterRole}
                    onChange={e => setFilterRole(e.target.value)}
                    style={{ padding: '11px 16px', borderRadius: '10px', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap', minWidth: '180px' }}
                  >
                    <option value="ALL">Tất cả vai trò ({users.length})</option>
                    <option value="STUDENT">🎓 Sinh viên ({users.filter(u => u.role === 'STUDENT').length})</option>
                    <option value="OWNER">👨‍🍳 Chủ quán ({users.filter(u => u.role === 'OWNER').length})</option>
                    <option value="ADMIN">🛡️ Quản trị viên</option>
                  </select>
                </div>

                <div style={{ backgroundColor: colors.cardBg, borderRadius: '14px', overflow: 'hidden', border: `1px solid ${colors.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.cardBgAlt, color: colors.textSecondary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <th style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>Người Dùng</th>
                        <th style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>Vai Trò</th>
                        <th style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>Hạng Thành Viên (VIP)</th>
                        <th style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>Trạng Thái</th>
                        <th style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>Hành Động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => {
                        const tier = u.membershipTier || 'NORMAL';
                        const isBanned = u.status === 'BANNED';
                        return (
                          <tr key={u.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ fontWeight: '700', fontSize: '14px', color: colors.textPrimary, whiteSpace: 'nowrap' }}>{u.name}</div>
                              <div style={{ fontSize: '12px', color: colors.textSecondary, whiteSpace: 'nowrap' }}>{u.email} • {u.phoneNumber || '0988 123 456'}</div>
                            </td>
                            <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '700',
                                whiteSpace: 'nowrap',
                                backgroundColor: u.role === 'ADMIN' ? colors.warningLight : (u.role === 'OWNER' ? colors.primaryLight : colors.successLight),
                                color: u.role === 'ADMIN' ? '#b45309' : (u.role === 'OWNER' ? '#1d4ed8' : '#047857')
                              }}>
                                {u.role === 'STUDENT' ? '🎓 Sinh Viên' : (u.role === 'OWNER' ? '👨‍🍳 Chủ Quán' : '🛡️ Admin')}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  padding: '5px 12px',
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  fontWeight: '800',
                                  whiteSpace: 'nowrap',
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
                                  style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.border}`, color: colors.primary, cursor: 'pointer', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}
                                  title="Đổi hạng VIP"
                                >
                                  ✏️ Đổi Hạng
                                </button>
                              </div>
                            </td>
                            <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '10px',
                                fontSize: '12px',
                                fontWeight: '700',
                                whiteSpace: 'nowrap',
                                backgroundColor: isBanned ? colors.dangerLight : colors.successLight,
                                color: isBanned ? '#b91c1c' : '#047857'
                              }}>
                                {isBanned ? '🚫 Đã Khóa' : '🟢 Hoạt Động'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <button
                                onClick={() => handleToggleUserStatus(u.id, u.status)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  backgroundColor: isBanned ? colors.success : colors.danger,
                                  color: '#fff',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  whiteSpace: 'nowrap'
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: colors.textPrimary, whiteSpace: 'nowrap' }}>Danh Sách Các Gói Hội Viên NLU VIP</h3>
                    <span style={{ fontSize: '13px', color: colors.textSecondary, whiteSpace: 'nowrap' }}>Hỗ trợ sinh viên tích điểm, giảm giá và miễn phí vận chuyển</span>
                  </div>
                  <button
                    onClick={() => handleOpenVipModal()}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      backgroundColor: colors.purple,
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    + Thêm Gói VIP Mới
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  {vipPackages.map(pkg => (
                    <div
                      key={pkg.id}
                      style={{
                        backgroundColor: colors.cardBg,
                        borderRadius: '14px',
                        padding: '22px',
                        border: `1px solid ${colors.border}`,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '10px', backgroundColor: colors.purpleLight, color: colors.purple, fontSize: '12px', fontWeight: '800', whiteSpace: 'nowrap' }}>
                            {pkg.durationDays} ngày
                          </span>
                          <span style={{ fontSize: '20px' }}>💎</span>
                        </div>

                        <h4 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: '800', color: colors.textPrimary, whiteSpace: 'nowrap' }}>
                          {pkg.name}
                        </h4>
                        
                        <div style={{ fontSize: '22px', fontWeight: '900', color: colors.primary, marginBottom: '14px', whiteSpace: 'nowrap' }}>
                          {pkg.price === 0 ? 'Miễn phí' : `${Number(pkg.price).toLocaleString('vi-VN')} đ`}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: colors.textSecondary, marginBottom: '18px' }}>
                          <div>✅ <strong>Giảm giá món ăn:</strong> {pkg.discountPercent}%</div>
                          <div>🛵 <strong>Lượt Freeship:</strong> {pkg.freeshipCount} lượt/tháng</div>
                          <div>📝 <strong>Mô tả:</strong> {pkg.description || 'Không có mô tả'}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', borderTop: `1px solid ${colors.border}`, paddingTop: '14px' }}>
                        <button
                          onClick={() => handleOpenVipModal(pkg)}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.border}`, color: colors.primary, cursor: 'pointer', fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap' }}
                        >
                          ✏️ Sửa Gói
                        </button>
                        <button
                          onClick={() => handleDeleteVipPackage(pkg.id)}
                          style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: colors.dangerLight, border: 'none', color: colors.danger, cursor: 'pointer', fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap' }}
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
                <div style={{ backgroundColor: colors.cardBg, borderRadius: '14px', overflow: 'hidden', border: `1px solid ${colors.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.cardBgAlt, color: colors.textSecondary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <th style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>Tài Khoản Bị Báo Cáo</th>
                        <th style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>Lý Do Vi Phạm</th>
                        <th style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>Người Báo Cáo</th>
                        <th style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>Trạng Thái</th>
                        <th style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>Hành Động Xử Lý</th>
                      </tr>
                    </thead>
                    <tbody>
                      {violations.map(v => {
                        const isResolved = v.status === 'RESOLVED';
                        return (
                          <tr key={v.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ fontWeight: '700', fontSize: '14px', color: colors.textPrimary, whiteSpace: 'nowrap' }}>{v.user ? v.user.name : 'Sinh viên'}</div>
                              <div style={{ fontSize: '12px', color: colors.textSecondary, whiteSpace: 'nowrap' }}>{v.user ? v.user.email : ''}</div>
                            </td>
                            <td style={{ padding: '14px 18px', color: colors.danger, fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}>
                              ⚠️ {v.reason}
                            </td>
                            <td style={{ padding: '14px 18px', color: colors.textSecondary, fontSize: '13px', whiteSpace: 'nowrap' }}>
                              {v.reporterName || 'Hệ thống tự động phát hiện'}
                            </td>
                            <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '10px',
                                fontSize: '12px',
                                fontWeight: '700',
                                whiteSpace: 'nowrap',
                                backgroundColor: isResolved ? colors.successLight : colors.dangerLight,
                                color: isResolved ? '#047857' : '#b91c1c'
                              }}>
                                {isResolved ? '✅ Đã Xử Lý' : '⏳ Chờ Xử Lý'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                {!isResolved && (
                                  <>
                                    <button
                                      onClick={() => handleResolveViolation(v.id, 'RESOLVED')}
                                      style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: colors.success, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap' }}
                                    >
                                      ✅ Đã Xử Lý
                                    </button>
                                    <button
                                      onClick={() => handleResolveViolation(v.id, 'BANNED')}
                                      style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: colors.danger, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap' }}
                                    >
                                      🚫 Khóa Tài Khoản
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleDeleteViolation(v.id)}
                                  style={{ padding: '6px 10px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, color: colors.textSecondary, border: `1px solid ${colors.border}`, cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}
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
          <div style={{ backgroundColor: colors.cardBg, width: '460px', borderRadius: '18px', padding: '28px', border: `1px solid ${colors.border}`, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 18px', fontSize: '19px', fontWeight: '800', color: colors.textPrimary, whiteSpace: 'nowrap' }}>
              {editingVip ? '✏️ Chỉnh Sửa Gói Hội Viên VIP' : '✨ Tạo Gói Hội Viên VIP Mới'}
            </h3>
            <form onSubmit={handleSaveVipPackage} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: colors.textSecondary }}>Tên Gói VIP</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Gói Thần Ăn Nông Lâm..."
                  value={vipForm.name}
                  onChange={e => setVipForm({ ...vipForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.border}`, color: colors.textPrimary, marginTop: '4px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: colors.textSecondary }}>Giá Gói (VNĐ)</label>
                  <input
                    type="number"
                    required
                    placeholder="39000"
                    value={vipForm.price}
                    onChange={e => setVipForm({ ...vipForm, price: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.border}`, color: colors.textPrimary, marginTop: '4px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: colors.textSecondary }}>Thời Hạn (Ngày)</label>
                  <input
                    type="number"
                    required
                    value={vipForm.durationDays}
                    onChange={e => setVipForm({ ...vipForm, durationDays: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.border}`, color: colors.textPrimary, marginTop: '4px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: colors.textSecondary }}>% Giảm Giá Món</label>
                  <input
                    type="number"
                    required
                    value={vipForm.discountPercent}
                    onChange={e => setVipForm({ ...vipForm, discountPercent: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.border}`, color: colors.textPrimary, marginTop: '4px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: colors.textSecondary }}>Lượt Freeship</label>
                  <input
                    type="number"
                    required
                    value={vipForm.freeshipCount}
                    onChange={e => setVipForm({ ...vipForm, freeshipCount: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.border}`, color: colors.textPrimary, marginTop: '4px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: colors.textSecondary }}>Mô Tả Quyền Lợi</label>
                <textarea
                  rows="3"
                  placeholder="Freeship 100% mọi đơn từ 40k, tặng voucher giảm 20k mỗi tuần..."
                  value={vipForm.description}
                  onChange={e => setVipForm({ ...vipForm, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.border}`, color: colors.textPrimary, marginTop: '4px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setVipModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.border}`, color: colors.textPrimary, cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}
                >
                  Huỷ Bỏ
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: '8px', backgroundColor: colors.purple, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}
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
          <div style={{ backgroundColor: colors.cardBg, width: '400px', borderRadius: '18px', padding: '28px', border: `1px solid ${colors.border}`, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: '800', color: colors.textPrimary, whiteSpace: 'nowrap' }}>
              👑 Điều Chỉnh Hạng Thành Viên
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: '13px', color: colors.textSecondary }}>
              Cập nhật quyền lợi cho: <strong>{selectedUser.name}</strong>
            </p>

            <form onSubmit={handleUpdateMembership} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: colors.textSecondary }}>Chọn Hạng Mới</label>
                <select
                  value={newTier}
                  onChange={e => setNewTier(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: '14px', fontWeight: '700', marginTop: '6px' }}
                >
                  <option value="NORMAL">⭐ Tiêu Chuẩn (NORMAL)</option>
                  <option value="SILVER">🥈 HSSV Bạc (SILVER)</option>
                  <option value="GOLD">🥇 VIP Gold (GOLD)</option>
                  <option value="DIAMOND">💎 Thần Ăn Kim Cương (DIAMOND)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setTierModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: '8px', backgroundColor: colors.cardBgAlt, border: `1px solid ${colors.border}`, color: colors.textPrimary, cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: '8px', backgroundColor: colors.primary, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}
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
