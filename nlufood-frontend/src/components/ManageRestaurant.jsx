import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

function ManageRestaurant({ user, onBack, onOpenChat }) {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'orders'
  
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state for menu item
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('Món nước');
  const [itemImageUrl, setItemImageUrl] = useState('');

  // Restaurant registration state
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newResName, setNewResName] = useState('');
  const [newResAddress, setNewResAddress] = useState('');
  const [newResImageUrl, setNewResImageUrl] = useState('');
  const [registering, setRegistering] = useState(false);

  // Order cancellation state
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelReasonText, setCancelReasonText] = useState('');

  const handleRegisterRestaurant = (e) => {
    e.preventDefault();
    if (!newResName.trim() || !newResAddress.trim()) return;
    setRegistering(true);

    const payload = {
      name: newResName,
      address: newResAddress,
      imageUrl: newResImageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400",
      owner: { id: user.id }
    };

    axios.post(`${API_BASE_URL}/restaurants`, payload)
      .then(res => {
        setRestaurants([...restaurants, res.data]);
        setSelectedRestaurant(res.data);
        setShowRegisterForm(false);
        setRegistering(false);
        // Clear inputs
        setNewResName('');
        setNewResAddress('');
        setNewResImageUrl('');
        alert("Đăng ký quán ăn thành công!");
      })
      .catch(err => {
        console.error("Lỗi đăng ký quán:", err);
        alert("Lỗi khi đăng ký quán ăn.");
        setRegistering(false);
      });
  };

  useEffect(() => {
    if (!user) return;
    axios.get(`${API_BASE_URL}/restaurants/owner/${user.id}`)
      .then(res => {
        setRestaurants(res.data);
        if (res.data.length > 0) {
          setSelectedRestaurant(res.data[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Lỗi khi tải danh sách quán ăn:', err);
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (selectedRestaurant) {
      if (activeTab === 'menu') {
        axios.get(`${API_BASE_URL}/restaurants/${selectedRestaurant.id}/menu`)
          .then(res => setMenuItems(res.data))
          .catch(err => console.error('Lỗi khi tải menu:', err));
      } else {
        axios.get(`${API_BASE_URL}/orders/restaurant/${selectedRestaurant.id}`)
          .then(res => setOrders(res.data.reverse())) // Show newest first
          .catch(err => console.error('Lỗi khi tải đơn hàng:', err));
      }
    }
  }, [selectedRestaurant, activeTab]);

  const handleUpdateStatus = (orderId, newStatus, reason = '') => {
    let url = `${API_BASE_URL}/orders/${orderId}/status?status=${newStatus}`;
    if (newStatus === 'CANCELLED' && reason) {
      url += `&cancelReason=${encodeURIComponent(reason)}`;
    }
    axios.put(url)
      .then(res => {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus, cancelReason: reason } : o));
        setCancellingOrderId(null);
        setCancelReasonText('');
      })
      .catch(err => alert('Lỗi khi cập nhật trạng thái.'));
  };

  const handleDeleteItem = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa món này?')) {
      axios.delete(`${API_BASE_URL}/menu-items/${id}`)
        .then(() => {
          setMenuItems(menuItems.filter(item => item.id !== id));
        })
        .catch(err => alert('Lỗi khi xóa món.'));
    }
  };

  const handleSubmitItem = (e) => {
    e.preventDefault();
    const payload = {
      name: itemName,
      price: parseFloat(itemPrice),
      category: itemCategory,
      imageUrl: itemImageUrl,
      restaurant: { id: selectedRestaurant.id }
    };

    if (editingItem) {
      axios.put(`${API_BASE_URL}/menu-items/${editingItem.id}`, payload)
        .then(res => {
          setMenuItems(menuItems.map(i => i.id === res.data.id ? res.data : i));
          resetForm();
        })
        .catch(err => alert('Lỗi khi cập nhật.'));
    } else {
      axios.post(`${API_BASE_URL}/menu-items`, payload)
        .then(res => {
          setMenuItems([...menuItems, res.data]);
          resetForm();
        })
        .catch(err => alert('Lỗi khi thêm món.'));
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setShowAddForm(false);
    setItemName('');
    setItemPrice('');
    setItemCategory('Món nước');
    setItemImageUrl('');
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(item.price.toString());
    setItemCategory(item.category || 'Món nước');
    setItemImageUrl(item.imageUrl || '');
    setShowAddForm(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'PREPARING': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DELIVERING': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) return <div className="p-margin text-center pt-20">Đang tải...</div>;

  if (restaurants.length === 0) {
    return (
      <div className="px-margin pt-sm pb-24">
        <button onClick={onBack} className="material-symbols-outlined text-primary mb-4">arrow_back</button>
        <div className="text-center py-12 bg-surface-container rounded-3xl">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">storefront</span>
          <p className="text-on-surface-variant">Bạn chưa có quán ăn nào được đăng ký.</p>
          <button onClick={() => setShowRegisterForm(true)} className="mt-4 bg-primary text-white px-6 py-2 rounded-xl font-bold active:scale-95 transition-transform shadow-md">Đăng ký ngay</button>
        </div>

        {/* Register Restaurant Modal */}
        {showRegisterForm && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-[92%] max-w-[440px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col border border-outline-variant/30">
              {/* Header with vibrant gradient */}
              <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-white relative">
                <button 
                  onClick={() => setShowRegisterForm(false)} 
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
                <h4 className="text-xl font-bold">Đăng ký quán ăn mới</h4>
                <p className="text-xs text-white/80 mt-1">Trở thành đối tác kinh doanh cùng NLUFood ngay hôm nay!</p>
              </div>

              <form onSubmit={handleRegisterRestaurant} className="p-6 space-y-5">
                {/* Tên quán ăn */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Tên quán ăn</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-xl">store</span>
                    <input 
                      type="text" 
                      required
                      value={newResName} 
                      onChange={e => setNewResName(e.target.value)}
                      placeholder="Ví dụ: Cơm tấm sinh viên" 
                      className="w-full bg-surface border-2 border-outline-variant/50 rounded-2xl py-3.5 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary transition-all shadow-sm placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Địa chỉ quán */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Địa chỉ quán</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-xl">location_on</span>
                    <input 
                      type="text" 
                      required
                      value={newResAddress} 
                      onChange={e => setNewResAddress(e.target.value)}
                      placeholder="Ví dụ: Khu B KTX ĐHQG" 
                      className="w-full bg-surface border-2 border-outline-variant/50 rounded-2xl py-3.5 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary transition-all shadow-sm placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Link ảnh biểu trưng */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Link ảnh biểu trưng (tùy chọn)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-xl">image</span>
                    <input 
                      type="text" 
                      value={newResImageUrl} 
                      onChange={e => setNewResImageUrl(e.target.value)}
                      placeholder="https://..." 
                      className="w-full bg-surface border-2 border-outline-variant/50 rounded-2xl py-3.5 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary transition-all shadow-sm placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={registering} 
                  className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 mt-4 active:scale-[0.98] transition-all disabled:opacity-50 hover:bg-primary/90"
                >
                  {registering ? 'Đang xử lý đăng ký...' : 'Đăng ký cửa hàng ngay'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-margin pt-sm pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 mb-md">
        <button onClick={onBack} className="material-symbols-outlined text-primary p-2 active:scale-90 transition-transform">arrow_back</button>
        <h2 className="font-h2 text-h2 text-on-surface">Quản lý quán ăn</h2>
      </div>

      {/* Restaurant Info Card */}
      <div className="bg-primary-container/10 p-4 rounded-3xl border border-primary/10 mb-lg shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white">
            <span className="material-symbols-outlined">store</span>
          </div>
          <div>
            <h3 className="font-bold text-primary text-lg leading-tight">{selectedRestaurant?.name}</h3>
            <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              {selectedRestaurant?.address}
            </p>
          </div>
        </div>

        <button 
          onClick={() => onOpenChat && onOpenChat(selectedRestaurant)}
          className="bg-primary text-white text-xs font-bold px-3 py-2 rounded-2xl shadow-md flex items-center gap-1 hover:bg-primary/90 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">chat</span>
          <span>Tin nhắn</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-container-low p-1 rounded-2xl mb-lg">
        <button 
          onClick={() => setActiveTab('menu')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'menu' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`}
        >
          Thực đơn
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'orders' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`}
        >
          Đơn hàng {orders.filter(o => o.status === 'PENDING').length > 0 && <span className="ml-1 bg-error text-white px-1.5 py-0.5 rounded-full text-[10px]">{orders.filter(o => o.status === 'PENDING').length}</span>}
        </button>
      </div>

      {/* Menu View */}
      {activeTab === 'menu' && (
        <>
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-h3 text-h3 text-on-surface">Món đang bán</h3>
            <button 
              onClick={() => setShowAddForm(true)}
              className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {menuItems.map(item => (
              <div key={item.id} className="flex bg-white border border-surface-variant/50 rounded-2xl p-3 gap-3 items-center shadow-sm hover:border-primary/30 transition-colors">
                <img 
                  src={item.imageUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400"} 
                  alt={item.name} 
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-on-surface text-sm">{item.name}</h4>
                  <p className="text-primary font-bold">{item.price.toLocaleString()}đ</p>
                  <span className="text-[10px] bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant">{item.category}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEditItem(item)} className="p-2 text-on-surface-variant hover:text-primary active:scale-90 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-on-surface-variant hover:text-error active:scale-90 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Orders View */}
      {activeTab === 'orders' && (
        <div className="flex flex-col gap-4">
          {orders.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-4xl text-surface-variant mb-2">inbox</span>
              <p className="text-on-surface-variant text-sm">Chưa có đơn hàng nào.</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-white border border-surface-variant/50 rounded-3xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-on-surface">Đơn #{order.id}</h4>
                    <p className="text-xs text-on-surface-variant">{new Date(order.orderTime).toLocaleString()}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4 border-y border-dashed border-surface-variant/50 py-3">
                  {order.orderItems?.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">
                        <span className="font-bold text-on-surface">{item.quantity}x</span> {item.menuItem?.name}
                      </span>
                      <span className="font-medium text-on-surface">{(item.price * item.quantity).toLocaleString()}đ</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium">Khách hàng: <span className="font-bold">{order.student?.name}</span></span>
                  <span className="text-lg font-bold text-primary">{order.totalPrice?.toLocaleString()}đ</span>
                </div>

                {/* Status Controls */}
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                  {order.status === 'PENDING' && (
                    <button 
                      onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                      className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap active:scale-95 transition-transform"
                    >
                      Nhận đơn & Chế biến
                    </button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button 
                      onClick={() => handleUpdateStatus(order.id, 'DELIVERING')}
                      className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap active:scale-95 transition-transform"
                    >
                      Giao cho Shipper
                    </button>
                  )}
                  {order.status === 'DELIVERING' && (
                    <button 
                      onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                      className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap active:scale-95 transition-transform"
                    >
                      Xác nhận Hoàn thành
                    </button>
                  )}
                  {order.status === 'PENDING' && (
                    <button 
                      onClick={() => setCancellingOrderId(order.id)}
                      className="bg-surface-container-highest text-on-surface-variant px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap active:scale-95 transition-transform"
                    >
                      Hủy đơn
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add/Edit Modal - Fixed width for mobile */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-[92%] max-w-[440px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border border-outline-variant/30">
            {/* Header with vibrant gradient */}
            <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-white relative flex-shrink-0">
              <button 
                onClick={resetForm} 
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
              <h4 className="text-xl font-bold">{editingItem ? 'Cập nhật món ăn' : 'Thêm món ăn mới'}</h4>
              <p className="text-xs text-white/80 mt-1">Cung cấp đầy đủ thông tin để thu hút nhiều sinh viên đặt món hơn!</p>
            </div>

            <form onSubmit={handleSubmitItem} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Dynamic Image Preview Box */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/50 rounded-2xl p-4 bg-surface-container/20">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-3">Hình ảnh xem trước</span>
                {itemImageUrl ? (
                  <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-md border border-outline-variant/50 relative group">
                    <img 
                      src={itemImageUrl} 
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400"
                      }}
                      className="w-full h-full object-cover" 
                      alt="Preview" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-[10px] font-bold">Hình ảnh món</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-surface-container border border-outline-variant/20 flex flex-col items-center justify-center text-surface-variant">
                    <span className="material-symbols-outlined text-3xl mb-1 text-primary/40">fastfood</span>
                    <span className="text-[9px] font-bold text-on-surface-variant/60">Chưa có ảnh</span>
                  </div>
                )}
              </div>

              {/* Tên món ăn */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Tên món ăn</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-xl">restaurant</span>
                  <input 
                    type="text" 
                    required
                    value={itemName} 
                    onChange={e => setItemName(e.target.value)}
                    placeholder="Ví dụ: Bún bò đặc biệt, Cơm tấm sườn..." 
                    className="w-full bg-surface border-2 border-outline-variant/50 rounded-2xl py-3.5 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary transition-all shadow-sm placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Giá bán */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Giá bán (VNĐ)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-xl">payments</span>
                  <input 
                    type="number" 
                    required
                    value={itemPrice} 
                    onChange={e => setItemPrice(e.target.value)}
                    placeholder="45000" 
                    className="w-full bg-surface border-2 border-outline-variant/50 rounded-2xl py-3.5 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary transition-all shadow-sm placeholder:text-gray-400 font-bold text-primary"
                  />
                </div>
                {itemPrice && (
                  <div className="text-[10px] font-bold text-primary-container bg-primary/10 px-3 py-1.5 rounded-lg inline-block ml-1 mt-1">
                    Giá hiển thị: {Number(itemPrice).toLocaleString()}đ
                  </div>
                )}
              </div>

              {/* Danh mục */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Danh mục món ăn</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-xl">sell</span>
                  <select 
                    value={itemCategory} 
                    onChange={e => setItemCategory(e.target.value)}
                    className="w-full bg-surface border-2 border-outline-variant/50 rounded-2xl py-3.5 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary transition-all shadow-sm cursor-pointer appearance-none"
                  >
                    <option value="Món nước">🍜 Món nước (Món bún, phở, mì...)</option>
                    <option value="Cơm">🍚 Cơm (Cơm tấm, cơm rang...)</option>
                    <option value="Ăn vặt">🍟 Ăn vặt (Ăn vặt, tráng miệng...)</option>
                    <option value="Đồ uống">🥤 Đồ uống (Nước ngọt, trà sữa, cafe...)</option>
                  </select>
                </div>
              </div>

              {/* Đường dẫn ảnh */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Đường dẫn ảnh món ăn (tùy chọn)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-xl">image</span>
                  <input 
                    type="text" 
                    value={itemImageUrl} 
                    onChange={e => setItemImageUrl(e.target.value)}
                    placeholder="Dán link ảnh https://..." 
                    className="w-full bg-surface border-2 border-outline-variant/50 rounded-2xl py-3.5 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary transition-all shadow-sm placeholder:text-gray-400"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 mt-6 active:scale-[0.98] transition-all disabled:opacity-50 hover:bg-primary/90"
              >
                {editingItem ? 'Cập nhật món ăn ngay' : 'Thêm vào thực đơn ngay'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellingOrderId && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-[92%] max-w-[440px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border border-outline-variant/30">
            {/* Header with vibrant error gradient */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white relative flex-shrink-0">
              <button 
                onClick={() => {
                  setCancellingOrderId(null);
                  setCancelReasonText('');
                }} 
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
              <h4 className="text-xl font-bold">Xác nhận hủy đơn</h4>
              <p className="text-xs text-white/80 mt-1">Vui lòng nhập lý do hủy đơn để thông báo cho khách hàng.</p>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Quick suggestions */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block ml-1">Gợi ý lý do</span>
                <div className="flex flex-wrap gap-2">
                  {['Quán hết món này rồi', 'Quán đang quá tải đơn', 'Quán chuẩn bị đóng cửa', 'Giao hàng gặp sự cố'].map(reason => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setCancelReasonText(reason)}
                      className="bg-surface-container-high text-on-surface-variant font-bold text-[11px] px-3.5 py-2 rounded-xl active:scale-95 transition-transform hover:bg-surface-container-highest"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Lý do chi tiết</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 material-symbols-outlined text-on-surface-variant text-xl">warning</span>
                  <textarea 
                    value={cancelReasonText}
                    onChange={e => setCancelReasonText(e.target.value)}
                    maxLength={150}
                    placeholder="Vui lòng cho biết lý do hủy cụ thể..."
                    className="w-full bg-surface border-2 border-outline-variant/50 rounded-2xl py-3.5 pl-12 pr-4 text-on-surface focus:outline-none focus:border-red-500 focus:bg-white transition-all shadow-sm placeholder:text-gray-400 h-28 resize-none text-sm"
                    required
                  />
                  <span className="absolute bottom-3 right-4 text-[9px] font-bold text-on-surface-variant/60">
                    {cancelReasonText.length}/150
                  </span>
                </div>
              </div>

              {/* Action button */}
              <button 
                onClick={() => handleUpdateStatus(cancellingOrderId, 'CANCELLED', cancelReasonText)}
                disabled={!cancelReasonText.trim()}
                className="w-full bg-red-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-600/20 active:scale-[0.98] transition-all disabled:opacity-50 hover:bg-red-700"
              >
                Xác nhận Hủy Đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageRestaurant;
