import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

function Home({ onRestaurantClick, onSearchFocus }) {
  const [restaurants, setRestaurants] = useState([]);
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Persistent favorites using localStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem('favorites_student');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Hidden restaurants (hidden for 15 days)
  const [hiddenRestaurants, setHiddenRestaurants] = useState(() => {
    try {
      const stored = localStorage.getItem('hidden_restaurants_15d');
      if (!stored) return {};
      const parsed = JSON.parse(stored);
      const now = Date.now();
      // Clean expired hides (> 15 days)
      const valid = {};
      Object.keys(parsed).forEach(id => {
        if (parsed[id] > now) valid[id] = parsed[id];
      });
      return valid;
    } catch (e) {
      return {};
    }
  });

  const [showHiddenManager, setShowHiddenManager] = useState(false);

  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const updated = prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id];
      localStorage.setItem('favorites_student', JSON.stringify(updated));
      return updated;
    });
  };

  const isFavorite = (id) => favorites.includes(id);

  // Hide restaurant for 15 days
  const hideRestaurant = (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm("Ẩn quán ăn này trong 15 ngày? Bạn có thể mở lại bất cứ lúc nào.")) {
      const hideUntil = Date.now() + 15 * 24 * 60 * 60 * 1000; // 15 days in ms
      const updated = { ...hiddenRestaurants, [id]: hideUntil };
      setHiddenRestaurants(updated);
      localStorage.setItem('hidden_restaurants_15d', JSON.stringify(updated));
    }
  };

  const unhideRestaurant = (id) => {
    const updated = { ...hiddenRestaurants };
    delete updated[id];
    setHiddenRestaurants(updated);
    localStorage.setItem('hidden_restaurants_15d', JSON.stringify(updated));
  };

  useEffect(() => {
    // Fetch restaurants
    axios.get(`${API_BASE_URL}/restaurants`)
      .then(response => {
        setRestaurants(response.data || []);
        setLoading(false);
      })
      .catch(error => {
        console.error("Lỗi khi kéo dữ liệu quán ăn:", error);
        setLoading(false);
      });

    // Fetch flash sales
    axios.get(`${API_BASE_URL}/restaurants/flash-sales`)
      .then(response => {
        setFlashSales(response.data || []);
      })
      .catch(error => {
        console.error("Lỗi khi kéo dữ liệu flash sale:", error);
      });
  }, []);

  // Filter out hidden restaurants
  const visibleRestaurants = restaurants.filter(r => !hiddenRestaurants[r.id]);

  const displayedRestaurants = showOnlyFavorites 
    ? visibleRestaurants.filter(r => isFavorite(r.id))
    : visibleRestaurants;

  // Split into Top Rated / Popular restaurants
  const popularRestaurants = visibleRestaurants.filter(r => (r.rating || 0) >= 4.7);

  const hiddenCount = Object.keys(hiddenRestaurants).length;

  return (
    <>
      {/* Greeting & Search Bar */}
      <section className="px-margin pt-sm">
        <div className="flex justify-between items-center mb-md">
          <div>
            <h2 className="font-h2 text-h2 text-on-surface">Chào bạn! 🍕</h2>
            <p className="text-xs text-on-surface-variant">Hôm nay bạn muốn ăn gì ở ĐH Nông Lâm?</p>
          </div>
          {hiddenCount > 0 && (
            <button 
              onClick={() => setShowHiddenManager(!showHiddenManager)}
              className="text-[11px] font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 rounded-full border flex items-center gap-1 transition-all"
            >
              <span className="material-symbols-outlined text-sm">visibility_off</span>
              <span>Ẩn ({hiddenCount})</span>
            </button>
          )}
        </div>

        {/* Manager modal for hidden restaurants */}
        {showHiddenManager && (
          <div className="mb-md p-4 bg-gray-50 border border-gray-200 rounded-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-700">Các quán đang ẩn (tối đa 15 ngày):</span>
              <button onClick={() => setShowHiddenManager(false)} className="text-xs text-gray-500 font-bold">Đóng</button>
            </div>
            <div className="space-y-2">
              {Object.keys(hiddenRestaurants).map(id => {
                const rest = restaurants.find(r => r.id === parseInt(id));
                return (
                  <div key={id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border text-xs">
                    <span className="font-bold text-gray-800 line-clamp-1">{rest?.name || `Quán #${id}`}</span>
                    <button 
                      onClick={() => unhideRestaurant(id)}
                      className="text-primary font-bold hover:underline shrink-0 ml-2"
                    >
                      Bỏ ẩn
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-on-surface-variant">search</span>
          </div>
          <input 
            onFocus={() => onSearchFocus('')}
            className="w-full bg-surface-container-low border-2 border-outline-variant/30 rounded-2xl py-3.5 pl-[48px] pr-md font-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-all shadow-sm text-sm" 
            placeholder="Tìm quán ăn, món ngon, bún bò, cơm tấm..." 
            type="text"
          />
          <div className="absolute inset-y-0 right-0 pr-md flex items-center">
            <span onClick={() => onSearchFocus('')} className="material-symbols-outlined text-primary bg-primary-container/20 rounded-full p-1 cursor-pointer hover:bg-primary-container/40 transition-colors">tune</span>
          </div>
        </div>
      </section>

      {/* Promos Banner Slider */}
      <section className="px-margin pt-md">
        <div className="w-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-4 text-white shadow-lg relative overflow-hidden flex items-center justify-between">
          <div className="z-10 max-w-[70%]">
            <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1 inline-block">
              Ưu đãi hot hôm nay 🔥
            </span>
            <h3 className="font-bold text-base leading-tight">Giảm 15% khi thanh toán MoMo</h3>
            <p className="text-xs text-white/90 mt-1">Áp dụng cho đơn từ 50.000đ + Giảm 10k Bạn mới!</p>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold z-10 shrink-0">
            💳
          </div>
        </div>
      </section>

      {/* Categories Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto px-margin py-md hide-scrollbar">
        {[
          { id: 'all', name: 'Tất cả', icon: 'lunch_dining', query: '' },
          { id: 'Cơm', name: 'Cơm tấm', icon: 'rice_bowl', query: 'Cơm' },
          { id: 'Món nước', name: 'Món nước', icon: 'ramen_dining', query: 'Món nước' },
          { id: 'Đồ uống', name: 'Trà & Cà phê', icon: 'local_cafe', query: 'Đồ uống' },
          { id: 'Ăn vặt', name: 'Ăn vặt', icon: 'icecream', query: 'Ăn vặt' }
        ].map(cat => (
          <button 
            key={cat.id} 
            className="flex flex-col items-center gap-2 min-w-[70px] active:scale-90 transition-transform shrink-0"
            onClick={() => onSearchFocus(cat.query)}
          >
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary border border-surface-variant/30">
              <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
            </div>
            <span className="text-[11px] font-bold text-on-surface-variant">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* SECTION 1: FLASH SALE */}
      <section className="mt-sm">
        <div className="px-margin flex justify-between items-end mb-sm">
          <div>
            <h2 className="font-h2 text-h2 text-on-surface flex items-center gap-xs text-base sm:text-lg">
              🔥 Flash Sale Giá Sốc
              <span className="material-symbols-outlined text-primary bg-primary-container/20 rounded-full p-1 animate-pulse" style={{fontVariationSettings: "'FILL' 1"}}>local_fire_department</span>
            </h2>
            <p className="text-[11px] text-gray-500">Giảm giá lên đến 50% trong giờ vàng</p>
          </div>
          <button className="font-label-bold text-xs text-primary hover:underline" onClick={() => onSearchFocus('')}>Tất cả</button>
        </div>
        <div className="flex overflow-x-auto gap-md px-margin hide-scrollbar pb-md">
          {flashSales.map(sale => (
            <div key={sale.id} onClick={() => onRestaurantClick(sale.restaurant?.id)} className="relative w-[260px] sm:w-[280px] h-[150px] sm:h-[160px] flex-shrink-0 rounded-2xl overflow-hidden shadow-lg active:scale-[0.98] transition-transform cursor-pointer border border-outline-variant/30">
              <img alt={sale.name} className="absolute inset-0 w-full h-full object-cover" src={sale.imageUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400"}/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              <div className="absolute top-sm left-sm bg-error text-white font-bold text-[10px] px-2 py-1 rounded-lg shadow-lg">
                GIẢM 50%
              </div>
              <div className="absolute bottom-sm left-sm right-sm flex justify-between items-end">
                <div>
                  <h3 className="font-bold text-base text-white leading-tight mb-1 line-clamp-1">{sale.name}</h3>
                  <div className="flex items-center gap-2 mt-xs">
                    <span className="font-bold text-primary-container text-lg sm:text-xl">{sale.price.toLocaleString()}đ</span>
                    {sale.originalPrice && (
                      <span className="text-xs text-gray-300 line-through">{sale.originalPrice.toLocaleString()}đ</span>
                    )}
                  </div>
                </div>
                <button className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary/90">
                  <span className="material-symbols-outlined text-lg">add</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: POPULAR / TOP RATED RESTAURANTS */}
      {popularRestaurants.length > 0 && (
        <section className="mt-md px-margin">
          <div className="flex justify-between items-center mb-sm">
            <div>
              <h2 className="font-h2 text-h2 text-on-surface text-base sm:text-lg">👑 Quán ăn Nổi tiếng & Đánh giá cao</h2>
              <p className="text-[11px] text-gray-500">Được đông đảo sinh viên Nông Lâm yêu thích (Rating ⭐ 4.7+)</p>
            </div>
          </div>
          <div className="flex overflow-x-auto gap-4 hide-scrollbar pb-2">
            {popularRestaurants.map(r => (
              <div 
                key={r.id} 
                onClick={() => onRestaurantClick(r.id)}
                className="w-[200px] bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm flex-shrink-0 cursor-pointer hover:border-primary/40 transition-all"
              >
                <div className="relative h-28 w-full">
                  <img src={r.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"} alt={r.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-600 flex items-center gap-0.5 shadow-sm">
                    ⭐ {r.rating || "4.8"}
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="font-bold text-sm text-gray-900 truncate">{r.name}</h4>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">{r.address}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-[9px] bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded font-bold">MoMo Off 15%</span>
                    <span className="text-[9px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-bold">Freeship</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 3: NEARBY / RECENT RESTAURANTS */}
      <section className="mt-lg px-margin">
        <div className="flex justify-between items-center mb-md">
          <div>
            <h2 className="font-h2 text-h2 text-on-surface text-base sm:text-lg">
              {showOnlyFavorites ? 'Quán yêu thích 💖' : '📍 Quán ngon gần bạn (ĐH Nông Lâm)'}
            </h2>
            <p className="text-[11px] text-gray-500">Giao hàng nhanh 15-20 phút tận KTX & Giảng đường</p>
          </div>

          <button 
            onClick={() => setShowOnlyFavorites(prev => !prev)}
            className={`flex items-center gap-1.5 font-bold text-xs px-3.5 py-2 rounded-xl transition-all active:scale-95 duration-100 ${
              showOnlyFavorites 
                ? 'bg-red-500 text-white shadow-md shadow-red-500/20' 
                : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            <span 
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: showOnlyFavorites ? "'FILL' 1" : "" }}
            >
              favorite
            </span>
            {showOnlyFavorites ? 'Tất cả' : 'Yêu thích'}
          </button>
        </div>

        <div className="flex flex-col gap-6 pb-xl">
          {loading ? (
             <div className="flex flex-col gap-4">
                {[1,2,3].map(i => (
                  <div key={i} className="w-full aspect-[16/9] bg-surface-container animate-pulse rounded-2xl"></div>
                ))}
             </div>
          ) : displayedRestaurants.length === 0 ? (
             <div className="text-center py-16 px-4 bg-surface-container-lowest rounded-[32px] border-2 border-dashed border-outline-variant/50">
                <span className="material-symbols-outlined text-6xl text-red-400 mb-3 animate-pulse">favorite</span>
                <h5 className="font-bold text-on-surface text-base mb-1">Chưa có quán yêu thích nào</h5>
                <p className="text-on-surface-variant text-xs leading-relaxed max-w-[280px] mx-auto">Hãy nhấn vào biểu tượng trái tim trên các quán ăn ngoài trang chủ để thêm vào danh sách yêu thích nhé!</p>
             </div>
          ) : (
            displayedRestaurants.map(restaurant => (
              <article key={restaurant.id} onClick={() => onRestaurantClick(restaurant.id)} className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 hover:shadow-[0_12px_40px_rgba(171,53,0,0.08)] transition-all cursor-pointer group relative">
                <div className="relative w-full aspect-[16/9] overflow-hidden">
                  <img alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={restaurant.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400"}/>
                  
                  {/* Floating Heart Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(restaurant.id);
                    }}
                    className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg active:scale-90 transition-transform duration-100 text-red-500 hover:bg-white z-20"
                    title="Yêu thích"
                  >
                    <span 
                      className="material-symbols-outlined text-[22px] select-none"
                      style={{
                        fontVariationSettings: isFavorite(restaurant.id) ? "'FILL' 1" : ""
                      }}
                    >
                      favorite
                    </span>
                  </button>

                  {/* Hide Restaurant for 15 Days Button */}
                  <button 
                    onClick={(e) => hideRestaurant(restaurant.id, e)}
                    className="absolute top-4 left-16 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg active:scale-90 transition-transform duration-100 text-gray-600 hover:bg-white hover:text-red-600 z-20"
                    title="Ẩn quán này trong 15 ngày"
                  >
                    <span className="material-symbols-outlined text-[20px]">visibility_off</span>
                  </button>

                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl px-3 py-1.5 flex items-center gap-1.5 shadow-lg">
                    <span className="material-symbols-outlined text-[16px] text-yellow-500" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                    <span className="font-bold text-sm text-on-surface">{restaurant.rating || "4.8"}</span>
                  </div>
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    <div className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span> 15-20 min
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-on-surface group-hover:text-primary transition-colors">{restaurant.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-3">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    <span className="line-clamp-1">{restaurant.address}</span>
                  </div>

                  {/* PROMOTIONS BADGES */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 text-xs font-bold">
                    <span className="bg-pink-50 text-pink-700 px-2.5 py-1 rounded-xl flex items-center gap-1 border border-pink-200">
                      💳 Ví MoMo: Giảm 15% đơn từ 50k
                    </span>
                    <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-xl flex items-center gap-1 border border-green-200">
                      🎁 Bạn mới: Giảm ngay 10k
                    </span>
                    <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-xl flex items-center gap-1 border border-amber-200">
                      🌟 VIP Freeship 0đ
                    </span>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </>
  );
}

export default Home;
