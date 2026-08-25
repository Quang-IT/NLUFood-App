import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8080/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [vipPackages, setVipPackages] = useState([]);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterRestStatus, setFilterRestStatus] = useState('ALL');
  const [newVipModal, setNewVipModal] = useState(false);
  const [vipForm, setVipForm] = useState({ name: '', price: '', durationDays: 30, discountPercent: 10, freeshipCount: 5, description: '' });

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
      setViolations(resViols || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleRestaurantAction = async (restId, action) => {
    try {
      await fetch(`${API_BASE}/admin/restaurants/${restId}/${action}`, { method: 'POST' });
      fetchData();
    } catch (e) {
      alert('Lỗi xử lý quán ăn!');
    }
  };

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

  const handleSaveVipPackage = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE}/admin/vip-packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...vipForm, price: parseFloat(vipForm.price), durationDays: parseInt(vipForm.durationDays), discountPercent: parseInt(vipForm.discountPercent), freeshipCount: parseInt(vipForm.freeshipCount) })
      });
      setNewVipModal(false);
      setVipForm({ name: '', price: '', durationDays: 30, discountPercent: 10, freeshipCount: 5, description: '' });
      fetchData();
    } catch (e) {
      alert('Lỗi tạo gói VIP!');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchName = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    return matchName && matchRole;
  });

  const filteredRestaurants = restaurants.filter(r => {
    const matchName = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterRestStatus === 'ALL' || r.status === filterRestStatus;
    return matchName && matchStatus;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc' }}>
      {/* Sidebar Navigation */}
      <aside style={{ width: '260px', backgroundColor: '#1e293b', padding: '24px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #334155' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 'bold' }}>
            🛡️
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#38bdf8' }}>NLUFood Admin</h2>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Hệ thống Quản trị Portal</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button onClick={() => setActiveTab('overview')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'overview' ? '#3b82f6' : 'transparent', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left' }}>
            📊 Thống Kê Tổng Quan
          </button>
          <button onClick={() => setActiveTab('restaurants')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'restaurants' ? '#3b82f6' : 'transparent', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left' }}>
            🏪 Duyệt Quán Ăn ({restaurants.filter(r => r.status === 'PENDING').length})
          </button>
          <button onClick={() => setActiveTab('users')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'users' ? '#3b82f6' : 'transparent', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left' }}>
            👥 Quản Lý Người Dùng
          </button>
          <button onClick={() => setActiveTab('vips')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'vips' ? '#3b82f6' : 'transparent', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left' }}>
            💎 Gói Hội Viên VIP
          </button>
          <button onClick={() => setActiveTab('violations')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'violations' ? '#3b82f6' : 'transparent', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left' }}>
            🚨 Báo Cáo Vi Phạm ({violations.filter(v => v.status === 'PENDING').length})
          </button>
        </nav>

        <div style={{ borderTop: '1px solid #334155', paddingTop: '16px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
          ĐH Nông Lâm TP.HCM • v2.0
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
              {activeTab === 'overview' && '📊 Thống kê toàn hệ thống NLUFood'}
              {activeTab === 'restaurants' && '🏪 Danh sách & Duyệt quán ăn'}
              {activeTab === 'users' && '👥 Quản lý Sinh viên & Chủ quán'}
              {activeTab === 'vips' && '💎 Quản lý Gói dịch vụ NLU VIP'}
              {activeTab === 'violations' && '🚨 Xử lý vi phạm tài khoản'}
            </h1>
            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '14px' }}>Cập nhật real-time dữ liệu từ Spring Boot REST API</p>
          </div>
          <button onClick={fetchData} style={{ padding: '10px 18px', borderRadius: '8px', backgroundColor: '#334155', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
            🔄 Tải lại dữ liệu
          </button>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', fontSize: '18px', color: '#94a3b8' }}>Đang kết nối Server Backend...</div>
        ) : (
          <>
            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && overview && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                  <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>💰 Tổng Doanh Thu</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981', marginTop: '8px' }}>{overview.totalRevenue?.toLocaleString('vi-VN')} đ</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>🛍️ Tổng Đơn Hàng</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#3b82f6', marginTop: '8px' }}>{overview.totalOrders} đơn</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>🎓 Sinh Viên Đăng Ký</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#f59e0b', marginTop: '8px' }}>{overview.totalStudents} tài khoản</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>🏪 Quán Ăn Hoạt Động</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#8b5cf6', marginTop: '8px' }}>{overview.totalRestaurants} quán</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                  <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '14px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>💎 Hội Viên VIP</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#ec4899', marginTop: '6px' }}>{overview.vipMembers} sinh viên</div>
                  </div>
                  <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '14px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>⏳ Quán Chờ Duyệt</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444', marginTop: '6px' }}>{overview.pendingRestaurants} yêu cầu</div>
                  </div>
                  <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '14px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>👨‍🍳 Chủ Quán Ăn</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#06b6d4', marginTop: '6px' }}>{overview.totalOwners} người</div>
                  </div>
                  <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '14px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>🚨 Báo Cáo Vi Phạm</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#f43f5e', marginTop: '6px' }}>{overview.totalViolations} ca</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: RESTAURANTS */}
            {activeTab === 'restaurants' && (
              <div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  <input type="text" placeholder="🔍 Tìm kiếm quán ăn..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} />
                  <select value={filterRestStatus} onChange={e => setFilterRestStatus(e.target.value)} style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }}>
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="PENDING">⏳ Đợi duyệt</option>
                    <option value="APPROVED">✅ Đã duyệt</option>
                    <option value="REJECTED">❌ Đã từ chối</option>
                  </select>
                </div>

                <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', overflow: 'hidden', border: '1px solid #334155' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #334155', backgroundColor: '#0f172a', color: '#94a3b8' }}>
                        <th style={{ padding: '16px' }}>Tên Quán Ăn</th>
                        <th style={{ padding: '16px' }}>Địa Chỉ</th>
                        <th style={{ padding: '16px' }}>Đánh Giá</th>
                        <th style={{ padding: '16px' }}>Trạng Thái</th>
                        <th style={{ padding: '16px' }}>Hành Động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRestaurants.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '16px', fontWeight: '600' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img src={r.imageUrl} alt={r.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                              {r.name}
                            </div>
                          </td>
                          <td style={{ padding: '16px', color: '#cbd5e1' }}>{r.address}</td>
                          <td style={{ padding: '16px', color: '#f59e0b', fontWeight: '700' }}>⭐ {r.rating}</td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', backgroundColor: r.status === 'APPROVED' ? '#064e3b' : (r.status === 'PENDING' ? '#78350f' : '#7f1d1d'), color: r.status === 'APPROVED' ? '#34d399' : (r.status === 'PENDING' ? '#fbbf24' : '#f87171') }}>
                              {r.status === 'APPROVED' ? 'Đã duyệt' : (r.status === 'PENDING' ? 'Chờ duyệt' : 'Từ chối')}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            {r.status === 'PENDING' && (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleRestaurantAction(r.id, 'approve')} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600' }}>✅ Duyệt</button>
                                <button onClick={() => handleRestaurantAction(r.id, 'reject')} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600' }}>❌ Từ chối</button>
                              </div>
                            )}
                            {r.status === 'APPROVED' && (
                              <button onClick={() => handleRestaurantAction(r.id, 'reject')} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#334155', color: '#f87171', border: 'none', cursor: 'pointer' }}>Tạm dừng</button>
                            )}
                            {r.status === 'REJECTED' && (
                              <button onClick={() => handleRestaurantAction(r.id, 'approve')} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#10b981', color: '#fff', border: 'none', cursor: 'pointer' }}>Duyệt lại</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: USERS */}
            {activeTab === 'users' && (
              <div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  <input type="text" placeholder="🔍 Tìm tên hoặc email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} />
                  <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }}>
                    <option value="ALL">Tất cả vai trò</option>
                    <option value="STUDENT">🎓 Sinh viên</option>
                    <option value="OWNER">🏪 Chủ quán</option>
                    <option value="ADMIN">🛡️ Admin</option>
                  </select>
                </div>

                <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', overflow: 'hidden', border: '1px solid #334155' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #334155', backgroundColor: '#0f172a', color: '#94a3b8' }}>
                        <th style={{ padding: '16px' }}>Họ và Tên</th>
                        <th style={{ padding: '16px' }}>Email</th>
                        <th style={{ padding: '16px' }}>Vai Trò</th>
                        <th style={{ padding: '16px' }}>Hạng VIP</th>
                        <th style={{ padding: '16px' }}>Trạng Thái</th>
                        <th style={{ padding: '16px' }}>Khóa/Mở</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '16px', fontWeight: '600' }}>{u.name}</td>
                          <td style={{ padding: '16px', color: '#cbd5e1' }}>{u.email}</td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px', backgroundColor: '#334155', color: '#38bdf8' }}>{u.role}</span>
                          </td>
                          <td style={{ padding: '16px', color: '#f59e0b', fontWeight: '700' }}>{u.membershipTier}</td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ color: u.status === 'BANNED' ? '#ef4444' : '#10b981', fontWeight: '700' }}>
                              {u.status === 'BANNED' ? '🔒 Đã khóa' : '🟢 Hoạt động'}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            {u.role !== 'ADMIN' && (
                              <button onClick={() => handleToggleUserStatus(u.id, u.status)} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: u.status === 'BANNED' ? '#10b981' : '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                                {u.status === 'BANNED' ? '🔓 Mở khóa' : '🔒 Khóa TK'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: VIPS */}
            {activeTab === 'vips' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <p style={{ color: '#cbd5e1' }}>Quản lý các gói hội viên NLU VIP Pro dành cho sinh viên</p>
                  <button onClick={() => setNewVipModal(true)} style={{ padding: '10px 18px', borderRadius: '8px', backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}>➕ Thêm Gói VIP Mới</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {vipPackages.map(pkg => (
                    <div key={pkg.id} style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>💎 {pkg.name}</div>
                      <div style={{ fontSize: '26px', fontWeight: '800', margin: '12px 0', color: '#10b981' }}>{pkg.price?.toLocaleString('vi-VN')} đ <span style={{ fontSize: '14px', color: '#94a3b8' }}>/ {pkg.durationDays} ngày</span></div>
                      <p style={{ color: '#cbd5e1', fontSize: '14px' }}>{pkg.description}</p>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', fontSize: '13px', color: '#38bdf8' }}>
                        <span>🛵 Freeship: {pkg.freeshipCount} lượt</span>
                        <span>🏷️ Giảm giá: {pkg.discountPercent}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                {newVipModal && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <form onSubmit={handleSaveVipPackage} style={{ backgroundColor: '#1e293b', padding: '32px', borderRadius: '16px', width: '400px', border: '1px solid #334155' }}>
                      <h3 style={{ margin: '0 0 20px' }}>Tạo Gói VIP Mới</h3>
                      <input type="text" placeholder="Tên gói VIP" required value={vipForm.name} onChange={e => setVipForm({ ...vipForm, name: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
                      <input type="number" placeholder="Giá tiền (VNĐ)" required value={vipForm.price} onChange={e => setVipForm({ ...vipForm, price: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
                      <textarea placeholder="Mô tả quyền lợi..." required value={vipForm.description} onChange={e => setVipForm({ ...vipForm, description: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => setNewVipModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#334155', color: '#fff', border: 'none' }}>Hủy</button>
                        <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#10b981', color: '#fff', border: 'none' }}>Lưu Gói</button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* TAB: VIOLATIONS */}
            {activeTab === 'violations' && (
              <div>
                <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', overflow: 'hidden', border: '1px solid #334155' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #334155', backgroundColor: '#0f172a', color: '#94a3b8' }}>
                        <th style={{ padding: '16px' }}>Tài Khoản Bị Báo Cáo</th>
                        <th style={{ padding: '16px' }}>Lý Do Vi Phạm</th>
                        <th style={{ padding: '16px' }}>Người Báo Cáo</th>
                        <th style={{ padding: '16px' }}>Trạng Thái</th>
                        <th style={{ padding: '16px' }}>Hành Động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {violations.map(v => (
                        <tr key={v.id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '16px', fontWeight: '600' }}>{v.user?.name} ({v.user?.email})</td>
                          <td style={{ padding: '16px', color: '#f87171' }}>{v.reason}</td>
                          <td style={{ padding: '16px', color: '#cbd5e1' }}>{v.reportedBy}</td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px', backgroundColor: v.status === 'RESOLVED' ? '#064e3b' : '#78350f', color: v.status === 'RESOLVED' ? '#34d399' : '#fbbf24' }}>
                              {v.status}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            {v.status === 'PENDING' && (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleResolveViolation(v.id, 'BANNED')} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}>🚫 Khóa TK</button>
                                <button onClick={() => handleResolveViolation(v.id, 'RESOLVED')} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#334155', color: '#fff', border: 'none', cursor: 'pointer' }}>✅ Bỏ qua</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
