import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

function Search({ onRestaurantClick, initialQuery = '', onClearQuery }) {
  const [query, setQuery] = useState(initialQuery);
  const [restaurants, setRestaurants] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [filterSort, setFilterSort] = useState('RECOMMENDED'); // RECOMMENDED, RATING, FREE_SHIP, FAST, PROMO
  const [filterCategory, setFilterCategory] = useState('ALL'); // ALL, Cơm, Món nước, Đồ uống, Ăn vặt

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Initial load of all restaurants for discovery filter
  useEffect(() => {
    axios.get(`${API_BASE_URL}/restaurants`)
      .then(res => setAllRestaurants(res.data || []))
      .catch(err => console.error("Lỗi khi tải danh sách quán:", err));
  }, []);

  const handleClear = () => {
    setQuery('');
    if (onClearQuery) onClearQuery();
  };

  useEffect(() => {
    if (query.trim() === '') {
      setRestaurants([]);
      setDishes([]);
      return;
    }
    
    const timeoutId = setTimeout(() => {
      setLoading(true);
      
      const searchRestaurants = axios.get(`${API_BASE_URL}/restaurants/search?q=${query}`);
      const searchDishes = axios.get(`${API_BASE_URL}/menu-items/search?q=${query}`);

      Promise.all([searchRestaurants, searchDishes])
        .then(([resRes, dishRes]) => {
          setRestaurants(resRes.data || []);
          setDishes(dishRes.data || []);
          setLoading(false);
        })
        .catch(err => {
          console.error("Lỗi tìm kiếm:", err);
          setLoading(false);
        });
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Apply filters on list
  const applyFilters = (list) => {
    let result = [...list];

    // Filter by Category if selected
    if (filterCategory !== 'ALL') {
      result = result.filter(r => {
        // match address or name or category keywords
        const str = (r.name + ' ' + (r.address || '')).toLowerCase();
        if (filterCategory === 'Cơm') return str.includes('cơm') || str.includes('rice');
        if (filterCategory === 'Món nước') return str.includes('bún') || str.includes('phở') || str.includes('mì') || str.includes('nước');
        if (filterCategory === 'Đồ uống') return str.includes('trà') || str.includes('cà phê') || str.includes('nước') || str.includes('sữa');
        if (filterCategory === 'Ăn vặt') return str.includes('vặt') || str.includes('bánh') || str.includes('kem');
        return true;
      });
    }

    // Sort criteria
    if (filterSort === 'RATING') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (filterSort === 'FREE_SHIP') {
      // Prioritize freeship
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (filterSort === 'FAST') {
      // Fast delivery sort
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return result;
  };

  const displayedRestaurants = query.trim() !== '' ? applyFilters(restaurants) : applyFilters(allRestaurants);

  return (
    <div className="px-margin pt-sm pb-xl">
      {/* Search Input */}
      <div className="relative w-full mb-md">
        <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-primary">search</span>
        </div>
        <input 
          className="w-full bg-surface-container-low border border-primary/30 rounded-2xl py-4 pl-[52px] pr-md font-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-sm" 
          placeholder="Tìm quán ăn, món ăn, bún, cơm, trà sữa..." 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button onClick={handleClear} className="absolute inset-y-0 right-0 pr-md flex items-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">cancel</span>
          </button>
        )}
      </div>

      {/* FILTER BAR SECTION */}
      <div className="mb-lg space-y-3">
        {/* Sort Filter Chips */}
        <div>
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">tune</span>
            Lọc theo tiêu chí:
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'RECOMMENDED', label: 'Được đề xuất 👍', icon: 'thumb_up' },
              { id: 'RATING', label: 'Đánh giá cao ⭐', icon: 'star' },
              { id: 'FREE_SHIP', label: 'Freeship 🛵', icon: 'local_shipping' },
              { id: 'FAST', label: 'Giao nhanh 15p ⏱️', icon: 'bolt' },
              { id: 'PROMO', label: 'Khuyến mãi 🎁', icon: 'sell' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterSort(f.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${filterSort === f.id ? 'bg-primary text-white shadow-md' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                <span>{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cuisine Category Chips */}
        <div>
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">restaurant</span>
            Ẩm thực / Danh mục:
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'Cơm', label: 'Cơm tấm / Cơm phần 🍚' },
              { id: 'Món nước', label: 'Trà / Cà phê 🍵' },
              { id: 'Đồ uống', label: 'Bún / Phở / Món nước 🍜' },
              { id: 'Ăn vặt', label: 'Ăn vặt / Tráng miệng 🧋' }
            ].map(c => (
              <button
                key={c.id}
                onClick={() => setFilterCategory(c.id)}
                className={`whitespace-nowrap px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 ${filterCategory === c.id ? 'bg-secondary text-white font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SEARCH OR FILTERED RESULTS */}
      {loading ? (
        <div className="flex flex-col items-center py-20">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-on-surface-variant text-sm font-medium">Đang tìm kiếm...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          
          {/* Query search results section */}
          {query.trim() !== '' ? (
            <>
              {displayedRestaurants.length === 0 && dishes.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
                  <span className="material-symbols-outlined text-5xl text-surface-variant mb-2">search_off</span>
                  <p className="text-on-surface-variant text-sm font-bold">Không tìm thấy kết quả phù hợp cho "{query}"</p>
                  <p className="text-xs text-gray-400 mt-1">Hãy thử tìm từ khóa khác hoặc bỏ các bộ lọc</p>
                  <button onClick={handleClear} className="mt-4 text-primary font-bold text-xs underline">Xóa từ khóa tìm kiếm</button>
                </div>
              ) : (
                <>
                  {/* Restaurants Section */}
                  {displayedRestaurants.length > 0 && (
                    <section>
                      <h3 className="font-bold text-on-surface mb-3 flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-primary text-[20px]">storefront</span>
                        Quán ăn ({displayedRestaurants.length})
                      </h3>
                      <div className="flex flex-col gap-3">
                        {displayedRestaurants.map(restaurant => (
                          <article key={restaurant.id} onClick={() => onRestaurantClick(restaurant.id)} className="flex bg-white border border-surface-variant/50 rounded-2xl p-3 gap-3 items-center active:scale-[0.98] transition-transform cursor-pointer shadow-sm hover:border-primary/30">
                            <img className="w-[72px] h-[72px] rounded-xl object-cover bg-surface-container shrink-0" src={restaurant.imageUrl || "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=200"} alt={restaurant.name} />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-on-surface leading-tight mb-1 truncate text-sm">{restaurant.name}</h4>
                              <p className="text-xs text-on-surface-variant mb-1.5 line-clamp-1">{restaurant.address}</p>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-0.5 text-amber-500">
                                  <span className="material-symbols-outlined text-[14px]" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                                  <span className="font-bold text-xs">{restaurant.rating || "4.8"}</span>
                                </div>
                                <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold">Freeship</span>
                                <span className="text-[10px] bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full font-bold">MoMo Off 15%</span>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Dishes Section */}
                  {dishes.length > 0 && (
                    <section>
                      <h3 className="font-bold text-on-surface mb-3 flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-primary text-[20px]">lunch_dining</span>
                        Món ăn ({dishes.length})
                      </h3>
                      <div className="flex flex-col gap-3">
                        {dishes.map(dish => (
                          <article key={dish.id} onClick={() => onRestaurantClick(dish.restaurant.id)} className="flex bg-white border border-surface-variant/50 rounded-2xl p-3 gap-3 items-center active:scale-[0.98] transition-transform cursor-pointer shadow-sm hover:border-primary/30">
                            <img className="w-[72px] h-[72px] rounded-xl object-cover bg-surface-container shrink-0" src={dish.imageUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=200"} alt={dish.name} />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-on-surface leading-tight mb-1 truncate text-sm">{dish.name}</h4>
                              <p className="text-[10px] text-primary font-bold uppercase mb-1">{dish.restaurant?.name}</p>
                              <p className="font-bold text-primary text-sm">{dish.price.toLocaleString()}đ</p>
                            </div>
                            <span className="material-symbols-outlined text-primary">chevron_right</span>
                          </article>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </>
          ) : (
            /* Discovery view when query is empty */
            <div>
              <h3 className="font-bold text-on-surface mb-3 flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">explore</span>
                Khám phá theo bộ lọc ({displayedRestaurants.length} quán ăn)
              </h3>
              <div className="flex flex-col gap-3">
                {displayedRestaurants.map(restaurant => (
                  <article key={restaurant.id} onClick={() => onRestaurantClick(restaurant.id)} className="flex bg-white border border-surface-variant/50 rounded-2xl p-3 gap-3 items-center active:scale-[0.98] transition-transform cursor-pointer shadow-sm hover:border-primary/30">
                    <img className="w-[72px] h-[72px] rounded-xl object-cover bg-surface-container shrink-0" src={restaurant.imageUrl || "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=200"} alt={restaurant.name} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-on-surface leading-tight mb-1 truncate text-sm">{restaurant.name}</h4>
                      <p className="text-xs text-on-surface-variant mb-1.5 line-clamp-1">{restaurant.address}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          <span className="material-symbols-outlined text-[14px]" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                          <span className="font-bold text-xs">{restaurant.rating || "4.8"}</span>
                        </div>
                        <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold">Freeship 15k</span>
                        <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold">MoMo -15%</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default Search;
