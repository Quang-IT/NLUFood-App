import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

function Orders({ user, onOpenChat }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current'); // 'current', 'history'
  const [selectedDetailOrder, setSelectedDetailOrder] = useState(null);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchOrders = () => {
    if (!user) return;
    axios.get(`${API_BASE_URL}/orders/student/${user.id}`)
      .then(response => {
        const sortedOrders = response.data.sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime));
        setOrders(sortedOrders);
        setLoading(false);
      })
      .catch(error => {
        console.error("Lỗi khi tải đơn hàng:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, [user]);

  const handleCancelOrder = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
      axios.put(`${API_BASE_URL}/orders/${id}/status?status=CANCELLED`)
        .then(() => {
          fetchOrders();
        })
        .catch(err => alert("Lỗi khi hủy đơn hàng."));
    }
  };

  const handleOpenReview = (order) => {
    setSelectedOrder(order);
    setShowReviewForm(true);
  };

  const submitReview = (e) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    
    const payload = {
      rating,
      comment,
      user: { id: user.id },
      restaurant: { id: selectedOrder.restaurant.id },
      reviewTime: new Date()
    };

    axios.post(`${API_BASE_URL}/reviews`, payload)
      .then(() => {
        alert("Cảm ơn bạn đã đánh giá!");
        setShowReviewForm(false);
        setComment('');
        setRating(5);
      })
      .catch(err => alert("Lỗi khi gửi đánh giá."))
      .finally(() => setIsSubmittingReview(false));
  };

  const filteredOrders = orders.filter(order => {
    const isCurrent = order.status !== 'COMPLETED' && order.status !== 'CANCELLED';
    return activeTab === 'current' ? isCurrent : !isCurrent;
  });

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Chờ xác nhận';
      case 'PREPARING': return 'Đang chuẩn bị';
      case 'DELIVERING': return 'Đang giao hàng';
      case 'COMPLETED': return 'Đã hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <div className="px-margin pt-sm pb-24">
      <h2 className="font-h2 text-h2 text-on-surface mb-md">Đơn hàng của bạn</h2>
      
      {/* Tabs */}
      <div className="flex bg-surface-container-low p-1 rounded-2xl mb-lg">
        <button 
          onClick={() => setActiveTab('current')} 
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'current' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`}
        >
          Đang đến ({orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length})
        </button>
        <button 
          onClick={() => setActiveTab('history')} 
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'history' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`}
        >
          Lịch sử
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-20">
             <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
             <p className="text-on-surface-variant text-sm">Đang cập nhật đơn hàng...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-dashed border-surface-variant">
             <span className="material-symbols-outlined text-4xl text-surface-variant mb-2">no_meals</span>
             <p className="text-on-surface-variant text-sm">Bạn chưa có đơn hàng nào.</p>
          </div>
        ) : filteredOrders.map(order => {
          const itemsText = order.orderItems?.map(item => item.menuItem?.name).join(', ') || '';
          
          return (
            <div key={order.id} className="bg-white border border-surface-variant/50 rounded-[32px] p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full uppercase tracking-wider">
                  #{order.id} • {new Date(order.orderTime).toLocaleDateString('vi-VN')}
                </span>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                  order.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' : 
                  order.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200' : 
                  'bg-primary-container/10 text-primary border-primary/20'
                }`}>
                  {getStatusText(order.status)}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-surface-container overflow-hidden flex-shrink-0">
                  {order.restaurant?.imageUrl ? (
                    <img src={order.restaurant.imageUrl} alt={order.restaurant.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                       <span className="material-symbols-outlined text-3xl">restaurant</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-on-surface truncate">{order.restaurant?.name}</h3>
                  <p className="text-xs text-on-surface-variant truncate">{itemsText}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-surface-variant/50">
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold">Tổng cộng</p>
                  <p className="font-display text-xl text-primary">{order.totalPrice?.toLocaleString()}đ</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onOpenChat && onOpenChat(order.restaurant)} 
                    className="bg-primary/10 text-primary border border-primary/20 font-bold text-xs px-3 py-2.5 rounded-2xl active:scale-95 transition-transform flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">forum</span>
                    <span>Tin nhắn</span>
                  </button>
                  {order.status === 'PENDING' && (
                    <button onClick={() => handleCancelOrder(order.id)} className="text-error font-bold text-xs px-4 py-2 hover:bg-red-50 rounded-xl transition-colors">Hủy</button>
                  )}
                  {order.status === 'COMPLETED' && (
                    <button 
                      onClick={() => handleOpenReview(order)}
                      className="bg-primary-container text-on-primary-container font-bold text-xs px-5 py-2.5 rounded-2xl active:scale-95 transition-transform"
                    >
                      Đánh giá
                    </button>
                  )}
                  <button onClick={() => setSelectedDetailOrder(order)} className="bg-surface-container-highest text-on-surface-variant font-bold text-xs px-4 py-2.5 rounded-2xl active:scale-95 transition-transform">Chi tiết</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Modal - Fixed width for mobile */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-[92%] max-w-[440px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border border-outline-variant/30">
            {/* Header with vibrant gradient */}
            <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-white relative">
              <button 
                onClick={() => setShowReviewForm(false)} 
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
              <h3 className="text-xl font-bold">Đánh giá món ăn</h3>
              <p className="text-xs text-white/80 mt-1">{selectedOrder?.restaurant?.name}</p>
            </div>
            
            <form onSubmit={submitReview} className="p-6 space-y-5 overflow-y-auto">
              {/* Interactive Star Rating */}
              <div className="text-center">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Chất lượng món ăn & Dịch vụ</span>
                 <div 
                   className="flex flex-row justify-center gap-3 mb-2"
                   style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '8px' }}
                 >
                   {[1, 2, 3, 4, 5].map(star => (
                     <button 
                       key={star} 
                       type="button"
                       onClick={() => setRating(star)}
                       className="transition-transform active:scale-75 duration-100 hover:scale-110"
                       style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', padding: 0 }}
                     >
                       <span 
                         className="material-symbols-outlined text-4xl select-none"
                         style={{
                           color: star <= rating ? '#FFB800' : '#E0E0E0',
                           fontVariationSettings: star <= rating ? "'FILL' 1" : ""
                         }}
                       >
                         star
                       </span>
                     </button>
                   ))}
                 </div>
                {/* Dynamically displayed star description with micro-emoji */}
                <div className="text-xs font-bold text-primary min-h-[16px]">
                  {rating === 1 && "Tệ quá! 😞"}
                  {rating === 2 && "Tạm ổn thôi 😐"}
                  {rating === 3 && "Khá ngon miệng 🙂"}
                  {rating === 4 && "Tuyệt vời luôn! 😊"}
                  {rating === 5 && "Hoàn hảo cực kỳ! 😍"}
                </div>
              </div>

              {/* Review Comment Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Nhận xét chi tiết</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 material-symbols-outlined text-on-surface-variant text-xl">rate_review</span>
                  <textarea 
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    maxLength={300}
                    placeholder="Món ăn nêm nếm thế nào? Quán đóng gói kỹ không? Giao hàng nhanh không..."
                    className="w-full bg-surface border-2 border-outline-variant/50 rounded-2xl py-3.5 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary focus:bg-white transition-all shadow-sm placeholder:text-gray-400 h-32 resize-none text-sm"
                    required
                  />
                  {/* Character Counter */}
                  <span className="absolute bottom-3 right-4 text-[9px] font-bold text-on-surface-variant/60">
                    {comment.length}/300
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={isSubmittingReview || !comment.trim()}
                className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 mt-4 active:scale-[0.98] transition-all disabled:opacity-50 hover:bg-primary/90"
              >
                {isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá ngay'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedDetailOrder && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-[92%] max-w-[440px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border border-outline-variant/30">
            {/* Header with vibrant gradient */}
            <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-white relative flex-shrink-0">
              <button 
                onClick={() => setSelectedDetailOrder(null)} 
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
              <h4 className="text-xl font-bold">Chi tiết đơn hàng</h4>
              <p className="text-xs text-white/80 mt-1">Mã đơn: #{selectedDetailOrder.id}</p>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto flex-1 pr-1">
              {/* Order Status Progress Tracker */}
              <div className="bg-surface-container/30 p-4 rounded-2xl border border-outline-variant/30">
                <h5 className="font-bold text-xs text-on-surface uppercase tracking-wider mb-3 text-center">Trạng thái đơn hàng</h5>
                <div className="flex items-center justify-between relative px-2">
                  <div className="absolute top-[18px] left-6 right-6 h-1 bg-surface-variant/40 -z-10"></div>
                  {/* PENDING -> PREPARING -> DELIVERING -> COMPLETED or CANCELLED */}
                  {selectedDetailOrder.status === 'CANCELLED' ? (
                    <div className="flex flex-col items-center w-full">
                      <div className="w-9 h-9 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center text-red-500">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </div>
                      <span className="text-[10px] font-bold text-red-500 mt-2">ĐÃ HỦY ĐƠN</span>
                    </div>
                  ) : (
                    ['PENDING', 'PREPARING', 'DELIVERING', 'COMPLETED'].map((step, idx) => {
                      const stepLabels = {
                        PENDING: 'Chờ nhận',
                        PREPARING: 'Chế biến',
                        DELIVERING: 'Đang giao',
                        COMPLETED: 'Hoàn thành'
                      };
                      const stepIcons = {
                        PENDING: 'pending_actions',
                        PREPARING: 'soup_kitchen',
                        DELIVERING: 'local_shipping',
                        COMPLETED: 'check_circle'
                      };
                      
                      const statuses = ['PENDING', 'PREPARING', 'DELIVERING', 'COMPLETED'];
                      const currentIdx = statuses.indexOf(selectedDetailOrder.status);
                      const stepIdx = statuses.indexOf(step);
                      
                      const isCompleted = stepIdx <= currentIdx;
                      const isActive = step === selectedDetailOrder.status;
                      
                      return (
                        <div key={step} className="flex flex-col items-center flex-1 z-10">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                             isCompleted ? 'bg-primary text-white border-2 border-primary' : 'bg-surface-container text-on-surface-variant border-2 border-surface-variant'
                          } ${isActive ? 'scale-110 shadow-lg' : ''}`}>
                            <span className="material-symbols-outlined text-[18px]">
                              {stepIcons[step]}
                            </span>
                          </div>
                          <span className={`text-[9px] font-bold mt-2 text-center leading-tight ${isCompleted ? 'text-primary' : 'text-on-surface-variant'}`}>
                            {stepLabels[step]}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Restaurant Info */}
              <div className="flex gap-3 items-center border-b border-surface-variant/30 pb-4">
                <div className="w-12 h-12 bg-primary/5 rounded-2xl overflow-hidden border border-outline-variant/30 flex-shrink-0 flex items-center justify-center">
                  {selectedDetailOrder.restaurant?.imageUrl ? (
                    <img src={selectedDetailOrder.restaurant.imageUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="material-symbols-outlined text-primary text-2xl">store</span>
                  )}
                </div>
                <div>
                  <h5 className="font-bold text-on-surface text-sm">{selectedDetailOrder.restaurant?.name}</h5>
                  <p className="text-xs text-on-surface-variant mt-0.5">{selectedDetailOrder.restaurant?.address}</p>
                </div>
              </div>

              {/* Dishes list */}
              <div className="space-y-3 border-b border-surface-variant/30 pb-4">
                <h5 className="font-bold text-xs text-on-surface uppercase tracking-wider">Chi tiết món ăn</h5>
                <div className="border border-surface-variant/40 rounded-2xl p-4 bg-surface-container-lowest/50 space-y-3">
                  {selectedDetailOrder.orderItems?.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="flex-1 min-w-0 pr-2">
                        <span className="font-bold text-on-surface">{item.quantity}x</span>{' '}
                        <span className="text-on-surface-variant">{item.menuItem?.name}</span>
                      </div>
                      <span className="font-medium text-on-surface">{(item.price * item.quantity).toLocaleString()}đ</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address Details */}
              <div className="space-y-2 border-b border-surface-variant/30 pb-4">
                <h5 className="font-bold text-xs text-on-surface uppercase tracking-wider">Thông tin giao nhận</h5>
                <div className="bg-surface-container-low border border-surface-variant/30 rounded-2xl p-4 flex gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                  <div>
                    <p className="font-bold text-xs text-on-surface">{selectedDetailOrder.student?.name}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{selectedDetailOrder.student?.address || 'Chưa cập nhật địa chỉ'}</p>
                  </div>
                </div>
              </div>

              {/* Cancellation Reason alert */}
              {selectedDetailOrder.status === 'CANCELLED' && selectedDetailOrder.cancelReason && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 text-red-700">
                  <span className="material-symbols-outlined text-xl flex-shrink-0">warning</span>
                  <div>
                    <p className="font-bold text-xs">Lý do hủy đơn</p>
                    <p className="text-xs mt-0.5 leading-relaxed">{selectedDetailOrder.cancelReason}</p>
                  </div>
                </div>
              )}

              {/* Total calculations */}
              <div className="pt-2 space-y-2">
                <div className="flex justify-between text-xs text-on-surface-variant">
                  <span>Tạm tính</span>
                  <span>{(selectedDetailOrder.totalPrice - 15000).toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-xs text-on-surface-variant">
                  <span>Phí giao hàng</span>
                  <span>15.000đ</span>
                </div>
                <div className="flex justify-between text-xs text-on-surface-variant">
                  <span>Phương thức thanh toán</span>
                  <span className="font-bold text-on-surface">{selectedDetailOrder.paymentMethod || 'Tiền mặt'}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-on-surface pt-2 border-t border-dashed border-surface-variant/50">
                  <span>Tổng thanh toán</span>
                  <span className="text-primary text-xl">{selectedDetailOrder.totalPrice?.toLocaleString()}đ</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 pt-0 flex-shrink-0">
              <button 
                onClick={() => setSelectedDetailOrder(null)}
                className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 hover:bg-primary/90"
              >
                Đóng chi tiết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
