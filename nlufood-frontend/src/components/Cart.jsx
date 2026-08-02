import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

function Cart({ onBack, cartItems, setCartItems, onClearCart, user }) {
  const [isOrdering, setIsOrdering] = useState(false);
  const [address, setAddress] = useState(user?.address || '');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');

  // Promo Code States
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null); // { code, discountAmount, description }
  const [promoError, setPromoError] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);

  const handleSaveAddress = () => {
    if (!address.trim()) return;
    setSavingAddress(true);
    axios.put(`${API_BASE_URL}/users/${user.id}`, {
      name: user.name,
      imageUrl: user.imageUrl,
      address: address,
      phoneNumber: user.phoneNumber,
      birthYear: user.birthYear
    })
    .then(res => {
      user.address = res.data.address;
      setIsEditingAddress(false);
      setSavingAddress(false);
    })
    .catch(err => {
      console.error("Lỗi khi cập nhật địa chỉ:", err);
      alert("Không thể cập nhật địa chỉ.");
      setSavingAddress(false);
    });
  };

  // Calculate totals
  const itemsTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryFee = 15000;
  const discount = appliedPromo ? appliedPromo.discountAmount : 0;
  const grandTotal = Math.max(0, itemsTotal + deliveryFee - discount);

  // Recheck applied promo code whenever itemsTotal changes
  useEffect(() => {
    if (appliedPromo) {
      axios.get(`${API_BASE_URL}/promocodes/validate`, {
        params: {
          code: appliedPromo.code,
          orderValue: itemsTotal
        }
      })
      .then(res => {
        if (res.data.success) {
          setAppliedPromo(res.data);
          setPromoError('');
        } else {
          // If the subtotal changed and it's no longer eligible, clear it
          setAppliedPromo(null);
          alert(`Mã khuyến mãi ${appliedPromo.code} đã bị gỡ bỏ do giá trị đơn hàng thay đổi: ${res.data.message}`);
        }
      })
      .catch(err => {
        console.error("Lỗi khi re-validate mã khuyến mãi:", err);
      });
    }
  }, [itemsTotal]);

  const handleApplyPromo = () => {
    if (!promoCodeInput.trim()) return;
    setValidatingPromo(true);
    setPromoError('');
    
    axios.get(`${API_BASE_URL}/promocodes/validate`, {
      params: {
        code: promoCodeInput.trim(),
        orderValue: itemsTotal
      }
    })
    .then(res => {
      setValidatingPromo(false);
      if (res.data.success) {
        setAppliedPromo(res.data);
        setPromoCodeInput('');
        setPromoError('');
        alert(`Áp dụng mã khuyến mãi '${res.data.code}' thành công! Giảm ngay ${res.data.discountAmount.toLocaleString()}đ`);
      } else {
        setPromoError(res.data.message);
        setAppliedPromo(null);
      }
    })
    .catch(err => {
      setValidatingPromo(false);
      console.error("Lỗi áp dụng mã khuyến mãi:", err);
      setPromoError("Có lỗi xảy ra khi kiểm tra mã khuyến mãi.");
      setAppliedPromo(null);
    });
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoError('');
  };

  const handleUpdateQuantity = (id, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta;
        return { ...item, quantity: Math.max(0, newQuantity) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) return;
    if (!user.address) {
      alert("Vui lòng thiết lập địa chỉ giao hàng trước khi đặt hàng!");
      setIsEditingAddress(true);
      return;
    }
    
    setIsOrdering(true);
    
    // Construct order payload
    const orderPayload = {
      student: { id: user.id },
      restaurant: { id: cartItems[0].restaurant.id },
      totalPrice: grandTotal,
      paymentMethod: paymentMethod,
      orderItems: cartItems.map(item => ({
        menuItem: { id: item.id },
        quantity: item.quantity,
        price: item.price
      }))
    };

    axios.post(`${API_BASE_URL}/orders`, orderPayload)
      .then(response => {
        // Trigger a notification on the backend for this order
        alert("Đặt hàng thành công!");
        onClearCart();
        onBack();
      })
      .catch(error => {
        console.error("Lỗi đặt hàng:", error);
        alert("Có lỗi xảy ra khi đặt hàng.");
        setIsOrdering(false);
      });
  };

  if (cartItems.length === 0) {
    return (
      <div className="bg-surface min-h-screen pb-32 flex flex-col items-center pt-24">
        <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md flex items-center px-margin py-sm border-b border-surface-variant">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-primary active:scale-95">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-h1 text-h2 text-on-surface flex-1 text-center pr-10">Giỏ hàng</h1>
        </header>
        <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center text-on-surface-variant mb-4">
          <span className="material-symbols-outlined text-4xl">shopping_cart</span>
        </div>
        <h2 className="font-h2 text-h2 text-on-surface mb-2">Giỏ hàng trống</h2>
        <p className="font-body-md text-on-surface-variant mb-6 text-center px-margin">Bạn chưa thêm món ăn nào vào giỏ hàng. Hãy quay lại và chọn món nhé!</p>
        <button onClick={onBack} className="bg-primary text-on-primary px-6 py-3 rounded-full font-label-bold">Quay lại quán ăn</button>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 w-full z-50 bg-surface/90 backdrop-blur-md flex items-center px-margin py-sm border-b border-surface-variant">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-primary active:scale-95">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-h1 text-h2 text-on-surface flex-1 text-center pr-10">Giỏ hàng của bạn</h1>
      </header>

      <div className="px-margin pt-md">
        {/* Order Summary */}
        <h2 className="font-h2 text-h3 text-on-surface mb-sm">Tóm tắt đơn hàng</h2>
        <div className="flex flex-col gap-sm mb-md">
          {cartItems.map(item => (
            <div key={item.id} className="flex border border-surface-variant rounded-xl p-2 gap-3 items-center bg-white shadow-sm">
              {item.imageUrl ? (
                <img className="w-[64px] h-[64px] rounded-lg object-cover bg-surface-container" src={item.imageUrl} alt={item.name} />
              ) : (
                <div className="w-[64px] h-[64px] rounded-lg bg-surface-container flex items-center justify-center text-surface-variant">
                  <span className="material-symbols-outlined text-3xl">restaurant</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-label-bold text-body-sm text-on-surface leading-tight truncate">{item.name}</h3>
                <div className="font-label-bold text-body-sm text-primary mt-1">{item.price.toLocaleString()}đ</div>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-high rounded-full px-2 py-1 shrink-0">
                <button onClick={() => handleUpdateQuantity(item.id, -1)} className="text-on-surface-variant active:scale-75 transition-transform">
                  <span className="material-symbols-outlined text-[16px]">remove</span>
                </button>
                <span className="font-label-bold text-label-xs w-4 text-center">{item.quantity}</span>
                <button onClick={() => handleUpdateQuantity(item.id, 1)} className="text-on-surface-variant active:scale-75 transition-transform">
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <button className="flex items-center gap-1 text-secondary font-label-bold text-body-sm mb-lg active:scale-95 transition-transform" onClick={onBack}>
          <span className="material-symbols-outlined text-[18px]">add_circle</span> Thêm món khác
        </button>

        {/* Delivery Address */}
        <div className="bg-white border border-surface-variant rounded-2xl p-md mb-md shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-h3 text-body-lg text-on-surface">Giao đến</h3>
            {!isEditingAddress ? (
              <button 
                onClick={() => setIsEditingAddress(true)}
                className="text-primary font-label-bold text-label-xs bg-primary-container px-3 py-1 rounded-lg hover:bg-primary-container/80 transition-colors"
              >
                Thay đổi
              </button>
            ) : (
              <button 
                onClick={handleSaveAddress}
                disabled={savingAddress}
                className="text-white font-label-bold text-label-xs bg-primary px-3 py-1 rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
              >
                {savingAddress ? 'Đang lưu...' : 'Lưu'}
              </button>
            )}
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary mt-0.5">location_on</span>
            <div className="flex-1 min-w-0">
              <div className="font-label-bold text-body-md text-on-surface">{user?.name || 'Người nhận'}</div>
              {!isEditingAddress ? (
                <div className="font-body-sm text-on-surface-variant line-clamp-2">
                  {user?.address || 'Chưa thiết lập địa chỉ nhận hàng. Vui lòng thêm địa chỉ.'}
                </div>
              ) : (
                <div className="flex gap-2 mt-2">
                  <input 
                    type="text" 
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Nhập địa chỉ giao hàng của bạn..."
                    className="flex-1 bg-surface border border-surface-variant rounded-xl px-3 py-2 font-body-sm focus:outline-none focus:border-primary"
                  />
                  <button 
                    onClick={() => {
                      setAddress(user?.address || '');
                      setIsEditingAddress(false);
                    }}
                    className="text-on-surface-variant text-xs font-bold px-2"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Promo Code System */}
        <div className="border border-surface-variant rounded-2xl p-4 mb-lg bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-on-surface">
             <span className="material-symbols-outlined text-primary">sell</span>
             <span className="font-bold text-sm">Khuyến mãi sinh viên</span>
          </div>

          {!appliedPromo ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={promoCodeInput}
                  onChange={e => setPromoCodeInput(e.target.value.toUpperCase())}
                  placeholder="Nhập mã giảm giá (e.g. NLUSTUDENT)" 
                  className="flex-1 bg-surface border border-surface-variant rounded-xl px-4 py-2.5 font-body-sm focus:outline-none focus:border-primary" 
                />
                <button 
                  onClick={handleApplyPromo}
                  disabled={validatingPromo || !promoCodeInput.trim()}
                  className="bg-primary text-white font-label-bold px-5 py-2.5 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
                >
                  {validatingPromo ? 'Đang kiểm tra...' : 'Áp dụng'}
                </button>
              </div>
              {promoError && (
                <p className="text-xs text-error font-medium pl-1">{promoError}</p>
              )}
              <div className="pt-2">
                <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider mb-1">Mã khả dụng gợi ý:</p>
                <div className="flex flex-wrap gap-2">
                  {['NLUSTUDENT', 'FOOD50', 'FREESHIP', 'VOUCHER10K'].map(code => (
                    <button 
                      key={code} 
                      onClick={() => {
                        setPromoCodeInput(code);
                        setPromoError('');
                      }} 
                      className="text-[10px] font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 px-2 py-1 rounded-lg"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3.5 animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-green-600 mt-0.5">check_circle</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-green-800">{appliedPromo.code}</span>
                    <span className="text-[9px] font-bold text-white bg-green-600 px-1.5 py-0.5 rounded-md uppercase">Đã áp dụng</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">{appliedPromo.description}</p>
                </div>
              </div>
              <button onClick={handleRemovePromo} className="text-green-800/60 hover:text-error active:scale-90 transition-transform shrink-0">
                <span className="material-symbols-outlined text-[20px]">cancel</span>
              </button>
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="border border-surface-variant rounded-2xl p-4 mb-lg bg-white shadow-sm">
          <h3 className="font-bold text-sm text-on-surface mb-3">Phương thức thanh toán</h3>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="payment" 
                checked={paymentMethod === 'Tiền mặt'} 
                onChange={() => setPaymentMethod('Tiền mặt')}
                className="w-5 h-5 accent-primary" 
              />
              <span className="material-symbols-outlined text-on-surface-variant">payments</span>
              <span className="font-body-sm text-on-surface flex-1">Tiền mặt (Cash)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="payment" 
                checked={paymentMethod === 'Ví MoMo'} 
                onChange={() => setPaymentMethod('Ví MoMo')}
                className="w-5 h-5 accent-primary" 
              />
              <span className="material-symbols-outlined text-[#A50064]">account_balance_wallet</span>
              <div className="flex-1 flex justify-between items-center">
                <span className="font-body-sm text-on-surface">Ví MoMo</span>
                <span className="text-[10px] bg-pink-100 text-pink-700 font-bold px-2 py-0.5 rounded-md">Giảm 15% (Đơn &gt; 50k)</span>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="payment" 
                checked={paymentMethod === 'ZaloPay'} 
                onChange={() => setPaymentMethod('ZaloPay')}
                className="w-5 h-5 accent-primary" 
              />
              <span className="material-symbols-outlined text-[#0068FF]">account_balance_wallet</span>
              <span className="font-body-sm text-on-surface flex-1">Ví ZaloPay</span>
            </label>
          </div>
        </div>

        {/* Totals */}
        <div className="border border-surface-variant rounded-2xl p-4 mb-xl bg-white shadow-sm">
          <div className="flex justify-between font-body-sm text-on-surface-variant mb-2">
            <span>Tạm tính ({cartItems.reduce((a, b) => a + b.quantity, 0)} món)</span>
            <span>{itemsTotal.toLocaleString()}đ</span>
          </div>
          <div className="flex justify-between font-body-sm text-on-surface-variant mb-2">
            <span>Phí giao hàng</span>
            <span>{deliveryFee.toLocaleString()}đ</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between font-body-sm text-primary mb-4 animate-in slide-in-from-bottom duration-200">
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">sell</span> Giảm giá khuyến mãi</span>
              <span>-{discount.toLocaleString()}đ</span>
            </div>
          )}
          <div className="h-[1px] w-full bg-surface-variant mb-4"></div>
          <div className="flex justify-between items-center">
            <span className="font-h3 text-h3 text-on-surface">Tổng cộng</span>
            <span className="font-display text-[24px] text-primary">{grandTotal.toLocaleString()}đ</span>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 w-full bg-surface border-t border-surface-variant p-margin pb-6 z-50 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div>
          <div className="font-body-sm text-on-surface-variant">Tổng thanh toán</div>
          <div className="font-display text-[24px] text-primary leading-tight">{grandTotal.toLocaleString()}đ</div>
        </div>
        <button 
          onClick={handlePlaceOrder}
          disabled={isOrdering}
          className={`bg-primary text-on-primary font-label-bold text-body-md py-3.5 px-8 rounded-xl shadow-md active:scale-95 transition-transform ${isOrdering ? 'opacity-50' : ''}`}
        >
          {isOrdering ? 'Đang đặt...' : 'Đặt hàng ngay'}
        </button>
      </div>
    </div>
  );
}

export default Cart;
