import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

function Profile({ user, onLogout, onUpdateUser, onManageRestaurant }) {
  const [currentView, setCurrentView] = useState('main'); // 'main', 'edit', 'payment', 'help', 'notifications', 'membership'

  // Edit profile states
  const [name, setName] = useState(user?.name || '');
  const [address, setAddress] = useState(user?.address || '');
  const [imageUrl, setImageUrl] = useState(user?.imageUrl || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [birthYear, setBirthYear] = useState(user?.birthYear || '');
  const [gender, setGender] = useState(user?.gender || 'Nam');
  const [membershipTier, setMembershipTier] = useState(user?.membershipTier || 'NORMAL');
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  // Notifications states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Payment states
  const [selectedPayment, setSelectedPayment] = useState('Tiền mặt');
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  // FAQ collapsible states
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAddress(user.address || '');
      setImageUrl(user.imageUrl || '');
      setPhoneNumber(user.phoneNumber || '');
      setBirthYear(user.birthYear || '');
      setGender(user.gender || 'Nam');
      setMembershipTier(user.membershipTier || 'NORMAL');
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = () => {
    if (!user) return;
    setLoadingNotifs(true);
    axios.get(`${API_BASE_URL}/notifications/user/${user.id}`)
      .then(res => {
        setNotifications(res.data);
        setUnreadCount(res.data.filter(n => !n.read).length);
        setLoadingNotifs(false);
      })
      .catch(err => {
        console.error("Lỗi khi tải thông báo:", err);
        setLoadingNotifs(false);
      });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    setLoading(true);
    axios.put(`${API_BASE_URL}/users/${user.id}`, {
      name,
      address,
      imageUrl,
      phoneNumber,
      gender,
      birthYear: birthYear ? parseInt(birthYear) : null
    })
      .then(res => {
        setLoading(false);
        setCurrentView('main');
        onUpdateUser(res.data);
        alert('Cập nhật hồ sơ thành công!');
      })
      .catch(err => {
        setLoading(false);
        console.error('Lỗi khi cập nhật hồ sơ:', err);
        alert('Cập nhật thất bại.');
      });
  };

  const handleSubscribeMembership = (tierName) => {
    if (window.confirm(`Bạn muốn đăng ký ${tierName}?`)) {
      axios.put(`${API_BASE_URL}/users/${user.id}/membership?tier=${tierName}`)
        .then(res => {
          setMembershipTier(tierName);
          onUpdateUser(res.data);
          alert(`Chúc mừng! Bạn đã đăng ký thành công gói ${getTierTitle(tierName)} 🎉`);
          setCurrentView('main');
        })
        .catch(err => alert("Lỗi đăng ký gói hội viên."));
    }
  };

  const getTierTitle = (tier) => {
    switch (tier) {
      case 'SILVER': return 'Gói HSSV Tiết Kiệm 🥈';
      case 'GOLD': return 'Gói NLU VIP Pro 🥇';
      case 'DIAMOND': return 'Gói Thần Ăn Nông Lâm 💎';
      default: return 'Thành viên Tiêu chuẩn';
    }
  };

  const getTierBadgeClass = (tier) => {
    switch (tier) {
      case 'SILVER': return 'bg-slate-200 text-slate-800 border-slate-300';
      case 'GOLD': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'DIAMOND': return 'bg-sky-100 text-sky-800 border-sky-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const faqs = [
    {
      q: "Làm sao để đặt đồ ăn tại NLUFood?",
      a: "Bạn chỉ cần chọn quán ăn yêu thích ở trang chủ, bấm thêm món vào giỏ hàng, chọn địa chỉ và thanh toán. Đơn hàng sẽ được chuyển tới quán ăn ngay lập tức!"
    },
    {
      q: "Phí giao hàng được tính như thế nào?",
      a: "NLUFood áp dụng mức phí giao hàng cố định cực kỳ ưu đãi chỉ 15,000đ cho mọi khu vực bên trong khuôn viên Đại học Nông Lâm TP.HCM."
    },
    {
      q: "Quyền lợi của các Gói Hội Viên là gì?",
      a: "Khi đăng ký Gói Hội Viên NLU VIP, bạn sẽ được miễn phí vận chuyển 100%, nhận voucher giảm giá 20k-50k hàng tuần và ưu tiên giao hỏa tốc!"
    }
  ];

  // SUB-VIEW: EDIT PROFILE
  if (currentView === 'edit') {
    return (
      <div className="px-margin pt-sm pb-24 animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-2 mb-lg">
          <button onClick={() => setCurrentView('main')} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
          <h2 className="font-h2 text-h2 text-on-surface">Chỉnh sửa hồ sơ</h2>
        </div>

        <form onSubmit={handleUpdate} className="space-y-5">
          {/* Avatar Upload Clickable Area */}
          <div className="flex flex-col items-center mb-6">
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} 
            />
            <div 
              onClick={handleAvatarClick} 
              className="relative cursor-pointer group"
              title="Nhấp để tải ảnh từ thư viện"
            >
              <div className="w-28 h-28 rounded-3xl overflow-hidden bg-surface-container-high border-4 border-white shadow-lg group-hover:opacity-90 transition-all flex items-center justify-center">
                {imageUrl ? (
                  <img src={imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-5xl text-primary/60">person</span>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              </div>
            </div>
            <p className="text-xs text-primary font-bold mt-3 cursor-pointer" onClick={handleAvatarClick}>
              Nhấp chuột vào ảnh để đổi avatar từ máy 📸
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-2 tracking-widest">Họ và tên</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-outline-variant/30 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary transition-all shadow-sm"
              placeholder="Nhập tên của bạn"
              required
            />
          </div>

          {/* Gender selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-2 tracking-widest">Giới tính</label>
            <div className="flex gap-3">
              {['Nam', 'Nữ', 'Khác'].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`flex-1 py-3 rounded-2xl font-bold text-sm border transition-all ${gender === g ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-2 tracking-widest">Số điện thoại</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-white border border-outline-variant/30 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary transition-all shadow-sm"
                placeholder="09xxx..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-2 tracking-widest">Năm sinh</label>
              <input
                type="number"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="w-full bg-white border border-outline-variant/30 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary transition-all shadow-sm"
                placeholder="200x..."
                min="1950"
                max="2026"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-2 tracking-widest">Địa chỉ giao hàng</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-white border border-outline-variant/30 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary transition-all shadow-sm"
              placeholder="Ký túc xá khu A, ĐH Nông Lâm..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-bold py-4 rounded-3xl mt-4 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    );
  }

  // SUB-VIEW: PAYMENT METHODS
  if (currentView === 'payment') {
    return (
      <div className="px-margin pt-sm pb-24 animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-2 mb-lg">
          <button onClick={() => setCurrentView('main')} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
          <h2 className="font-h2 text-h2 text-on-surface">Phương thức thanh toán</h2>
        </div>

        {/* Payment Methods List */}
        <div className="space-y-3 mb-6">
          {[
            { id: 'Tiền mặt', title: 'Tiền mặt khi nhận hàng (COD)', desc: 'Thanh toán trực tiếp cho tài xế giao món', icon: 'payments', color: 'bg-green-50 text-green-600' },
            { id: 'Ví MoMo', title: 'Ví điện tử MoMo', desc: 'Nhận ngay giảm 10% - 15% khi thanh toán qua MoMo', icon: 'account_balance_wallet', color: 'bg-pink-50 text-pink-600' },
            { id: 'ZaloPay', title: 'Ví điện tử ZaloPay', desc: 'Thanh toán quét mã QR nhanh chóng', icon: 'qr_code_scanner', color: 'bg-blue-50 text-blue-600' },
            { id: 'Thẻ ATM / VISA', title: 'Thẻ ATM / VISA / MasterCard', desc: 'Liên kết ngân hàng nội địa và quốc tế', icon: 'credit_card', color: 'bg-amber-50 text-amber-600' }
          ].map(item => (
            <div 
              key={item.id}
              onClick={() => setSelectedPayment(item.id)}
              className={`p-4 bg-white border-2 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${selectedPayment === item.id ? 'border-primary shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{item.title}</h4>
                  <p className="text-[11px] text-gray-500">{item.desc}</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPayment === item.id ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>
                {selectedPayment === item.id && <span className="material-symbols-outlined text-[14px]">check</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // SUB-VIEW: MEMBERSHIP TIERS
  if (currentView === 'membership') {
    const packages = [
      {
        id: 'NORMAL',
        name: 'Gói Tiêu chuẩn',
        price: 'Miễn phí',
        icon: 'card_membership',
        color: 'from-gray-500 to-slate-700',
        features: ['Đặt đồ ăn tiêu chuẩn', 'Áp dụng khuyến mãi chung', 'Hỗ trợ sinh viên NLU']
      },
      {
        id: 'SILVER',
        name: 'Gói HSSV Tiết Kiệm 🥈',
        price: '19.000đ / tháng',
        icon: 'workspace_premium',
        color: 'from-slate-400 to-gray-600',
        features: ['Freeship 5 đơn hàng/tháng', 'Giảm 10% các quán NLU đối tác', 'Huy hiệu Bạc sinh viên']
      },
      {
        id: 'GOLD',
        name: 'Gói NLU VIP Pro 🥇',
        price: '39.000đ / tháng',
        icon: 'stars',
        color: 'from-amber-400 to-orange-500',
        features: ['Freeship 100% mọi đơn từ 40k', 'Tặng Voucher 20k mỗi tuần', 'Huy hiệu Vàng VIP 🌟', 'Ưu tiên làm món nhanh']
      },
      {
        id: 'DIAMOND',
        name: 'Gói Thần Ăn Nông Lâm 💎',
        price: '69.000đ / tháng',
        icon: 'diamond',
        color: 'from-blue-500 to-indigo-600',
        features: ['Freeship KHÔNG GIỚI HẠN', 'Giao hỏa tốc 15 phút', 'Voucher 50k mỗi tuần', 'Huy hiệu Kim Cương 💎', 'Tổng đài VIP 24/7']
      }
    ];

    return (
      <div className="px-margin pt-sm pb-24 animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-2 mb-md">
          <button onClick={() => setCurrentView('main')} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
          <h2 className="font-h2 text-h2 text-on-surface">Gói Hội Viên NLU VIP</h2>
        </div>

        <p className="text-xs text-on-surface-variant mb-lg">
          Nâng cấp gói hội viên để nhận ưu đãi Freeship không giới hạn và hàng loạt Voucher độc quyền dành riêng cho sinh viên Nông Lâm!
        </p>

        <div className="space-y-4">
          {packages.map(pkg => {
            const isCurrent = membershipTier === pkg.id;
            return (
              <div 
                key={pkg.id} 
                className={`bg-white border-2 rounded-3xl p-5 shadow-md flex flex-col justify-between transition-all relative overflow-hidden ${isCurrent ? 'border-primary shadow-primary/10' : 'border-gray-200'}`}
              >
                <div className={`absolute top-0 right-0 px-4 py-1 bg-gradient-to-r ${pkg.color} text-white text-[10px] font-bold rounded-bl-2xl uppercase tracking-wider`}>
                  {pkg.price}
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${pkg.color} text-white flex items-center justify-center shadow-sm`}>
                    <span className="material-symbols-outlined text-2xl">{pkg.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-900">{pkg.name}</h3>
                    {isCurrent && (
                      <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                        ✓ Đang sử dụng
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-1.5 mb-4 text-xs text-gray-600">
                  {pkg.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-500 text-base">check_circle</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {!isCurrent ? (
                  <button
                    onClick={() => handleSubscribeMembership(pkg.id)}
                    className="w-full bg-primary text-white font-bold py-3 rounded-2xl shadow-md hover:bg-primary/90 active:scale-95 transition-all text-xs"
                  >
                    Đăng ký gói ngay
                  </button>
                ) : (
                  <div className="w-full text-center py-2 bg-gray-100 text-gray-500 text-xs font-bold rounded-2xl">
                    Gói hiện tại của bạn
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // SUB-VIEW: HELP
  if (currentView === 'help') {
    return (
      <div className="px-margin pt-sm pb-24 animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-2 mb-lg">
          <button onClick={() => setCurrentView('main')} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
          <h2 className="font-h2 text-h2 text-on-surface">Trung tâm trợ giúp</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-lg">
          <a href="tel:19006789" className="bg-white border border-outline-variant/30 rounded-3xl p-5 flex flex-col items-center justify-center text-center shadow-sm hover:border-primary active:scale-95 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined">call</span>
            </div>
            <span className="font-bold text-sm text-on-surface">Gọi hỗ trợ</span>
            <span className="text-[10px] text-on-surface-variant mt-1">1900 6789 (24/7)</span>
          </a>

          <a href="mailto:support@nlufood.com" className="bg-white border border-outline-variant/30 rounded-3xl p-5 flex flex-col items-center justify-center text-center shadow-sm hover:border-primary active:scale-95 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined">mail</span>
            </div>
            <span className="font-bold text-sm text-on-surface">Gửi Email</span>
            <span className="text-[10px] text-on-surface-variant mt-1">support@nlufood.com</span>
          </a>
        </div>

        <h3 className="font-bold text-base text-on-surface mb-4 ml-1">Câu hỏi thường gặp (FAQs)</h3>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-sm text-on-surface active:bg-surface-container-low transition-colors"
              >
                <span>{faq.q}</span>
                <span className="material-symbols-outlined text-on-surface-variant transition-transform duration-200" style={{ transform: openFaqIndex === index ? 'rotate(180deg)' : 'rotate(0)' }}>
                  keyboard_arrow_down
                </span>
              </button>
              {openFaqIndex === index && (
                <div className="px-5 pb-5 pt-1 text-xs text-on-surface-variant leading-relaxed border-t border-dashed border-outline-variant/20 animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // MAIN PROFILE SCREEN VIEW
  return (
    <div className="px-margin pt-sm pb-24">
      <h2 className="font-h2 text-h2 text-on-surface mb-lg">Tài khoản</h2>

      {/* Premium Profile Header Card */}
      <div className="relative overflow-hidden bg-white border border-outline-variant/30 rounded-[32px] p-6 mb-lg shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="flex items-center gap-5 relative z-10">
          
          {/* Clickable Avatar */}
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange} 
          />
          <div 
            onClick={handleAvatarClick} 
            className="w-20 h-20 rounded-[28px] overflow-hidden bg-primary/10 flex items-center justify-center text-primary border-4 border-white shadow-md shrink-0 cursor-pointer relative group"
            title="Nhấp chuột để đổi ảnh đại diện từ thư viện máy"
          >
            {imageUrl ? (
              <img src={imageUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-4xl">person</span>
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xl text-on-surface truncate">{user.name}</h3>
            <p className="text-sm text-on-surface-variant truncate">{user.email}</p>
            
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase">
                <span className="material-symbols-outlined text-[12px]">verified</span>
                {user.role === 'STUDENT' ? 'Sinh viên NLU' : 'Đối tác Cửa hàng'}
              </span>

              <span className={`inline-flex items-center gap-1 border px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getTierBadgeClass(membershipTier)}`}>
                {getTierTitle(membershipTier)}
              </span>
            </div>
          </div>
        </div>

        {/* Additional Details Showcased */}
        <div className="mt-5 pt-4 border-t border-dashed border-outline-variant/40 grid grid-cols-2 gap-3 text-xs text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">call</span>
            <span className="font-semibold">{user.phoneNumber || 'Chưa cập nhật SĐT'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">wc</span>
            <span>Giới tính: <strong className="font-semibold">{user.gender || 'Nam'}</strong></span>
          </div>
        </div>
      </div>

      {/* Menu Options Grouped */}
      <div className="space-y-6">
        <section>
          <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[2px] ml-1 mb-3">Dịch vụ & Ưu đãi</h4>
          <div className="bg-white border border-outline-variant/30 rounded-[28px] overflow-hidden shadow-sm divide-y divide-gray-100">
            <button 
              onClick={() => setCurrentView('membership')} 
              className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low active:bg-surface-container transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <span className="material-symbols-outlined">workspace_premium</span>
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-on-surface">Gói Hội Viên NLU VIP</p>
                  <p className="text-[10px] text-on-surface-variant">Miễn phí ship 100%, Voucher 50k hàng tuần</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
            </button>
          </div>
        </section>

        <section>
          <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[2px] ml-1 mb-3">Quản lý cá nhân</h4>
          <div className="bg-white border border-outline-variant/30 rounded-[28px] overflow-hidden shadow-sm divide-y divide-gray-100">
            <button onClick={() => setCurrentView('edit')} className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low active:bg-surface-container transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <span className="material-symbols-outlined">person_edit</span>
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-on-surface">Thông tin tài khoản</p>
                  <p className="text-[10px] text-on-surface-variant">Đổi Avatar, Giới tính, SĐT, Địa chỉ</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
            </button>

            <button onClick={() => setCurrentView('payment')} className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low active:bg-surface-container transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                  <span className="material-symbols-outlined">credit_card</span>
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-on-surface">Phương thức thanh toán</p>
                  <p className="text-[10px] text-on-surface-variant">Tiền mặt, MoMo, ZaloPay, Thẻ ngân hàng</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
            </button>

            {user.role === 'OWNER' && (
              <button onClick={onManageRestaurant} className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low active:bg-surface-container transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined">storefront</span>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-on-surface">Quản lý quán ăn & Đơn hàng</p>
                    <p className="text-[10px] text-on-surface-variant">Quản lý món, nhận đơn từ sinh viên</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
              </button>
            )}
          </div>
        </section>

        <section>
          <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[2px] ml-1 mb-3">Hỗ trợ & Khác</h4>
          <div className="bg-white border border-outline-variant/30 rounded-[28px] overflow-hidden shadow-sm divide-y divide-gray-100">
            <button onClick={() => setCurrentView('help')} className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low active:bg-surface-container transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <span className="material-symbols-outlined">help</span>
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-on-surface">Trung tâm trợ giúp</p>
                  <p className="text-[10px] text-on-surface-variant">Giải đáp thắc mắc & Tổng đài 24/7</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
            </button>
          </div>
        </section>

        <button 
          onClick={onLogout} 
          className="w-full bg-red-50 text-error font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Đăng xuất tài khoản</span>
        </button>
      </div>
    </div>
  );
}

export default Profile;
