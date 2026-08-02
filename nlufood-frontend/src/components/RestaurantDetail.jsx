import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { API_BASE_URL } from '../config';

function RestaurantDetail({ restaurantId, onBack, onOpenCart, onAddToCart, cartItems, user, onOpenChat }) {
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(['Tất cả', 'Đánh giá']);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  const fetchReviews = () => {
    axios.get(`${API_BASE_URL}/reviews/restaurant/${restaurantId}`)
      .then(res => setReviews(res.data))
      .catch(err => console.error("Lỗi khi tải đánh giá:", err));
  };

  useEffect(() => {
    if (!restaurantId) return;

    setLoading(true);
    // Fetch restaurant details
    const fetchRestaurant = axios.get(`${API_BASE_URL}/restaurants/${restaurantId}`);
    // Fetch menu
    const fetchMenu = axios.get(`${API_BASE_URL}/restaurants/${restaurantId}/menu`);
    // Fetch reviews
    fetchReviews();

    Promise.all([fetchRestaurant, fetchMenu])
      .then(([resRes, menuRes]) => {
        setRestaurant(resRes.data);
        setMenuItems(menuRes.data);

        // Extract unique categories
        const cats = new Set(menuRes.data.map(item => item.category || 'Món chính'));
        setCategories(['Tất cả', ...Array.from(cats), 'Đánh giá']);
        setLoading(false);
      })
      .catch(error => {
        console.error("Lỗi khi tải chi tiết quán ăn:", error);
        setLoading(false);
      });
  }, [restaurantId]);

  const handleAddReview = () => {
    const userId = user?.id || JSON.parse(localStorage.getItem('user'))?.id || 1;
    
    axios.post(`${API_BASE_URL}/reviews`, {
      comment: newComment,
      rating: newRating,
      user: { id: userId },
      restaurant: { id: restaurantId }
    })
    .then(() => {
      setShowReviewForm(false);
      setNewComment('');
      setNewRating(5);
      fetchReviews();
      alert('Cảm ơn bạn đã đánh giá!');
    })
    .catch(err => alert('Lỗi khi gửi đánh giá.'));
  };

  if (loading) {
    return <div className="min-h-screen bg-surface flex items-center justify-center">Đang tải dữ liệu...</div>;
  }

  if (!restaurant) {
    return <div className="min-h-screen bg-surface flex items-center justify-center">Không tìm thấy quán ăn.</div>;
  }

  const displayedMenu = activeTab === 'Tất cả'
    ? menuItems
    : menuItems.filter(item => (item.category || 'Món chính') === activeTab);

  return (
    <div className="bg-surface min-h-screen pb-24">
      {/* Header Image */}
      <div className="relative h-64 w-full bg-surface-variant">
        <img
          src={restaurant.imageUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuD0QxTPjjw87DPKIggsqqSTbIdbA5Ho3gI_idcTE1zHAA5jMqSJ6LxjEItOj-zxfsTRvwp2j46ZEf9nDtt9dPF98m5rYNxQHDhxg1NI52VNtXtpD3QC3XJxWeEbblw1mZtU-jgEASWuyuwYnTjNA09AksQo8SrNF9DWyLBe4531VYC2Wnyq8EvjjNLtCm22Q-GpjMlyH9ZWOxADouZ-8zdp6w0g2Kfnvh882f27alY0auLt3SAeoGenBsYZmx8w_-9N8Xq99tGh7Ts"}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        {/* Top bar with back and heart */}
        <div className="absolute top-0 w-full p-4 flex justify-between items-center z-10 pt-[48px]">
          <button onClick={onBack} className="w-10 h-10 bg-surface/80 backdrop-blur-md rounded-full flex items-center justify-center text-on-surface">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex gap-2">
            <button className="w-10 h-10 bg-surface/80 backdrop-blur-md rounded-full flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined">search</span>
            </button>
            <button className="w-10 h-10 bg-surface/80 backdrop-blur-md rounded-full flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined">favorite_border</span>
            </button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-surface rounded-t-3xl -mt-6 relative z-20 pt-lg px-margin pb-sm">
        <h1 className="font-display text-[32px] text-on-surface leading-tight mb-3">{restaurant.name}</h1>
        <div className="flex flex-wrap gap-2 text-on-surface-variant mb-md">
          <div className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-full">
            <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="font-label-bold text-label-xs"><span className="text-on-surface">{restaurant.rating || "4.5"}</span> (1.2k)</span>
          </div>
          <div className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-full">
            <span className="material-symbols-outlined text-[16px] text-error">schedule</span>
            <span className="font-label-bold text-label-xs text-on-surface">15 mins</span>
          </div>
          <div className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-full">
            <span className="material-symbols-outlined text-[16px] text-secondary">location_on</span>
            <span className="font-label-bold text-label-xs text-on-surface line-clamp-1 max-w-[150px]">{restaurant.address}</span>
          </div>
          <button 
            onClick={() => onOpenChat && onOpenChat(restaurant)}
            className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full hover:bg-primary/20 transition-all font-bold text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">forum</span>
            <span>Tin nhắn với quán</span>
          </button>
        </div>

        {/* Menu Tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {categories.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-label-bold text-label-xs transition-colors ${activeTab === tab ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="h-2 w-full bg-surface-container-low"></div>

      {/* Menu List */}
      <div className="px-margin pt-md">
        <div className="flex justify-between items-center mb-md">
          <h2 className="font-h2 text-h2 text-on-surface">{activeTab === 'Tất cả' ? 'Thực đơn' : activeTab === 'Đánh giá' ? 'Đánh giá' : activeTab}</h2>
          {activeTab === 'Đánh giá' && (
            <button 
              onClick={() => setShowReviewForm(true)}
              className="bg-primary text-white font-label-bold text-label-xs px-4 py-2 rounded-xl shadow-md active:scale-95 transition-transform"
            >
              Viết đánh giá
            </button>
          )}
        </div>

        {activeTab === 'Đánh giá' ? (
          <div className="flex flex-col gap-4 pb-12">
            {reviews.length === 0 ? (
              <div className="text-center py-8 bg-surface-container rounded-2xl border border-outline-variant/30">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">rate_review</span>
                <p className="text-on-surface-variant">Chưa có đánh giá nào cho quán ăn này.</p>
              </div>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="bg-white border border-surface-variant rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-primary font-bold text-xs overflow-hidden">
                        {review.user?.imageUrl ? <img src={review.user.imageUrl} className="w-full h-full object-cover" alt="" /> : review.user?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-sm">{review.user?.name || 'Khách hàng'}</p>
                        <p className="text-[10px] text-on-surface-variant">{new Date(review.reviewTime).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                    <div className="flex text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-[14px]" style={{fontVariationSettings: i < review.rating ? "'FILL' 1" : ""}}>star</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-on-surface text-sm leading-relaxed">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-sm">
            {displayedMenu.length === 0 ? (
              <p className="text-on-surface-variant my-4">Chưa có món ăn trong danh mục này.</p>
            ) : (
              displayedMenu.map(item => (
                <div key={item.id} className="flex border border-surface-variant rounded-xl p-2 gap-3 items-center relative">
                  {item.isFlashSale && (
                    <div className="absolute top-0 left-0 bg-error text-on-error font-label-bold text-[10px] px-2 py-1 rounded-tl-xl rounded-br-lg z-10 shadow-sm">
                      SALE
                    </div>
                  )}
                  {item.imageUrl ? (
                    <img className="w-[88px] h-[88px] rounded-lg object-cover bg-surface-container" src={item.imageUrl} alt={item.name} />
                  ) : (
                    <div className="w-[88px] h-[88px] rounded-lg bg-surface-container flex items-center justify-center text-surface-variant">
                      <span className="material-symbols-outlined text-4xl">restaurant</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-h3 text-body-lg text-on-surface leading-tight mb-1">{item.name}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex flex-col">
                        <span className="font-label-bold text-body-md text-primary">{item.price.toLocaleString()}đ</span>
                        {item.originalPrice && (
                          <span className="font-label-xs text-label-xs text-surface-variant line-through">{item.originalPrice.toLocaleString()}đ</span>
                        )}
                      </div>
                      <button onClick={() => onAddToCart(item, restaurant)} className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center">
                        <span className="material-symbols-outlined">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Review Form Overlay */}
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
              <h3 className="text-xl font-bold">Viết đánh giá</h3>
              <p className="text-xs text-white/80 mt-1">Đóng góp của bạn giúp cộng đồng sinh viên tìm được món ăn ngon hơn!</p>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Interactive Star Rating */}
              <div className="text-center">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Chất lượng món ăn & Dịch vụ</span>
                <div className="flex flex-row justify-center gap-3 mb-2">
                  {[1,2,3,4,5].map(star => (
                    <button 
                      key={star} 
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="transition-transform active:scale-75 duration-100 hover:scale-110"
                    >
                      <span 
                        className="material-symbols-outlined text-4xl select-none"
                        style={{
                          color: star <= newRating ? '#FFB800' : '#E0E0E0',
                          fontVariationSettings: star <= newRating ? "'FILL' 1" : ""
                        }}
                      >
                        star
                      </span>
                    </button>
                  ))}
                </div>
                {/* Dynamically displayed star description with micro-emoji */}
                <div className="text-xs font-bold text-primary min-h-[16px]">
                  {newRating === 1 && "Tệ quá! 😞"}
                  {newRating === 2 && "Tạm ổn thôi 😐"}
                  {newRating === 3 && "Khá ngon miệng 🙂"}
                  {newRating === 4 && "Tuyệt vời luôn! 😊"}
                  {newRating === 5 && "Hoàn hảo cực kỳ! 😍"}
                </div>
              </div>

              {/* Review Comment Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Nhận xét chi tiết</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 material-symbols-outlined text-on-surface-variant text-xl">rate_review</span>
                  <textarea 
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    maxLength={300}
                    placeholder="Món ăn nêm nếm thế nào? Quán đóng gói kỹ không? Giao hàng nhanh không..."
                    className="w-full bg-surface border-2 border-outline-variant/50 rounded-2xl py-3.5 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary focus:bg-white transition-all shadow-sm placeholder:text-gray-400 h-32 resize-none text-sm"
                  />
                  {/* Character Counter */}
                  <span className="absolute bottom-3 right-4 text-[9px] font-bold text-on-surface-variant/60">
                    {newComment.length}/300
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                onClick={handleAddReview}
                disabled={!newComment.trim() || newRating === 0}
                className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 mt-4 active:scale-[0.98] transition-all disabled:opacity-50 hover:bg-primary/90"
              >
                Gửi đánh giá ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Button */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 left-margin right-margin z-50">
          <button onClick={onOpenCart} className="w-full bg-primary text-on-primary rounded-2xl py-3 px-4 flex justify-between items-center shadow-lg active:scale-95 transition-transform">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-on-primary/20 flex items-center justify-center font-label-bold text-label-xs">
                {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
              </div>
              <span className="font-label-bold text-body-md">Xem giỏ hàng</span>
            </div>
            <span className="font-h2 text-body-lg">
              {cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString()}đ
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export default RestaurantDetail;
