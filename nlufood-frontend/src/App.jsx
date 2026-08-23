import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import Home from './components/Home';
import Search from './components/Search';
import RestaurantDetail from './components/RestaurantDetail';
import Cart from './components/Cart';
import Orders from './components/Orders';
import Profile from './components/Profile';
import Login from './components/Login';
import ManageRestaurant from './components/ManageRestaurant';
import NotificationsModal from './components/NotificationsModal';
import ChatModal from './components/ChatModal';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [activeView, setActiveView] = useState('main'); // 'main', 'restaurant', 'cart', 'manage-restaurant'
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatRestaurant, setChatRestaurant] = useState(null);

  const handleOpenChat = (restaurant = null) => {
    setChatRestaurant(restaurant);
    setShowChat(true);
  };

  useEffect(() => {
    if (!user) return;
    const fetchUnread = () => {
      axios.get(`${API_BASE_URL}/notifications/user/${user.id}/unread-count`)
        .then(res => setUnreadCount(res.data))
        .catch(err => console.error("Lỗi lấy số thông báo chưa đọc:", err));
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleAddToCart = (item, restaurant) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, restaurant }];
    });
  };

  const handleClearCart = () => setCartItems([]);

  const handleOpenRestaurant = (id) => {
    setSelectedRestaurantId(id);
    setActiveView('restaurant');
  };

  const handleOpenCart = () => {
    setActiveView('cart');
  };

  const handleOpenManageRestaurant = () => {
    setActiveView('manage-restaurant');
  };

  const handleBackToMain = () => {
    setActiveView('main');
  };

  if (!user) {
    return <Login onLoginSuccess={(userData) => setUser(userData)} />;
  }

  if (activeView === 'restaurant') {
    return (
      <>
        <RestaurantDetail
          restaurantId={selectedRestaurantId}
          onBack={handleBackToMain}
          onOpenCart={handleOpenCart}
          onAddToCart={handleAddToCart}
          cartItems={cartItems}
          user={user}
          onOpenChat={handleOpenChat}
        />
        {showChat && (
          <ChatModal
            isOpen={showChat}
            onClose={() => setShowChat(false)}
            currentUser={user}
            initialRestaurant={chatRestaurant}
          />
        )}
      </>
    );
  }

  if (activeView === 'cart') {
    return (
      <>
        <Cart
          onBack={handleBackToMain}
          cartItems={cartItems}
          setCartItems={setCartItems}
          onClearCart={handleClearCart}
          user={user}
        />
        {showChat && (
          <ChatModal
            isOpen={showChat}
            onClose={() => setShowChat(false)}
            currentUser={user}
            initialRestaurant={chatRestaurant}
          />
        )}
      </>
    );
  }

  if (activeView === 'manage-restaurant') {
    return (
      <>
        <ManageRestaurant
          user={user}
          onBack={handleBackToMain}
          onOpenChat={handleOpenChat}
        />
        {showChat && (
          <ChatModal
            isOpen={showChat}
            onClose={() => setShowChat(false)}
            currentUser={user}
            initialRestaurant={chatRestaurant}
          />
        )}
      </>
    );
  }

  return (
    <div className="pb-[90px] pt-[72px]">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface dark:bg-surface-dim flex justify-between items-center px-margin py-base shadow-xs">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high border-2 border-surface flex-shrink-0 flex items-center justify-center">
          {user.imageUrl ? (
            <img alt="User" className="w-full h-full object-cover" src={user.imageUrl} />
          ) : (
            <span className="material-symbols-outlined text-primary">person</span>
          )}
        </div>
        <h1 className="font-h1 text-h1 text-primary dark:text-primary-container truncate mx-sm flex-1 text-center font-bold">NLUFood</h1>
        <div className="flex gap-1.5 items-center flex-shrink-0">
          <button 
            onClick={() => handleOpenChat(null)} 
            className="w-10 h-10 rounded-full flex items-center justify-center text-primary dark:text-inverse-primary hover:bg-surface-container-low transition-colors active:scale-95 duration-150 relative"
            title="Nhắn tin"
          >
            <span className="material-symbols-outlined">chat</span>
          </button>

          <button onClick={() => setShowNotifications(true)} className="w-10 h-10 rounded-full flex items-center justify-center text-primary dark:text-inverse-primary hover:bg-surface-container-low transition-colors active:scale-95 duration-150 relative">
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 flex justify-center items-center text-[10px] text-white bg-primary rounded-full border-2 border-surface font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
          
          <button onClick={handleOpenCart} className="w-10 h-10 rounded-full flex items-center justify-center text-primary dark:text-inverse-primary hover:bg-surface-container-low transition-colors flex-shrink-0 active:scale-95 duration-150 relative">
            <span className="material-symbols-outlined">shopping_cart</span>
            {cartItems.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 flex justify-center items-center text-[10px] text-white bg-error rounded-full border-2 border-surface font-bold">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      <main>
        {activeTab === 'home' && (
          <Home
            onRestaurantClick={handleOpenRestaurant}
            onSearchFocus={(category) => {
              setSearchQuery(category || '');
              setActiveTab('search');
            }}
          />
        )}
        {activeTab === 'search' && (
          <Search
            onRestaurantClick={handleOpenRestaurant}
            initialQuery={searchQuery}
            onClearQuery={() => setSearchQuery('')}
          />
        )}
        {activeTab === 'orders' && <Orders user={user} onOpenChat={handleOpenChat} />}
        {activeTab === 'profile' && (
          <Profile 
            user={user} 
            onLogout={() => setUser(null)} 
            onUpdateUser={(updatedUser) => setUser(updatedUser)} 
            onManageRestaurant={handleOpenManageRestaurant} 
          />
        )}
      </main>

      {/* Floating Chat Button */}
      <button
        onClick={() => handleOpenChat(null)}
        className="fixed bottom-20 right-4 z-40 bg-primary text-white p-3.5 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border-2 border-white"
        title="Tin nhắn"
      >
        <span className="material-symbols-outlined text-2xl">forum</span>
        <span className="font-bold text-xs pr-1 hidden sm:inline">Tin nhắn</span>
      </button>

      {/* Notifications Modal */}
      {showNotifications && (
        <NotificationsModal
          user={user}
          onClose={() => {
            setShowNotifications(false);
            axios.get(`${API_BASE_URL}/notifications/user/${user.id}/unread-count`)
              .then(res => setUnreadCount(res.data))
              .catch(err => console.error(err));
          }}
        />
      )}

      {/* Chat Modal */}
      {showChat && (
        <ChatModal
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          currentUser={user}
          initialRestaurant={chatRestaurant}
        />
      )}

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 w-full z-50 rounded-t-xl bg-surface dark:bg-inverse-surface shadow-[0_-4px_20px_rgba(171,53,0,0.1)] flex justify-around items-center h-16 px-2">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center rounded-lg px-3 py-1 transition-colors duration-200 ${activeTab === 'home' ? 'bg-primary-container text-on-primary-container px-4 scale-95' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
        >
          <span className="material-symbols-outlined" style={activeTab === 'home' ? { fontVariationSettings: "'FILL' 1" } : {}}>home</span>
          <span className="font-label-xs text-label-xs mt-1">Trang chủ</span>
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex flex-col items-center justify-center rounded-lg px-3 py-1 transition-colors duration-200 ${activeTab === 'search' ? 'bg-primary-container text-on-primary-container px-4 scale-95' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
        >
          <span className="material-symbols-outlined" style={activeTab === 'search' ? { fontVariationSettings: "'FILL' 1" } : {}}>search</span>
          <span className="font-label-xs text-label-xs mt-1">Tìm kiếm</span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center justify-center rounded-lg px-3 py-1 transition-colors duration-200 ${activeTab === 'orders' ? 'bg-primary-container text-on-primary-container px-4 scale-95' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
        >
          <span className="material-symbols-outlined" style={activeTab === 'orders' ? { fontVariationSettings: "'FILL' 1" } : {}}>receipt_long</span>
          <span className="font-label-xs text-label-xs mt-1">Đơn hàng</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center rounded-lg px-3 py-1 transition-colors duration-200 ${activeTab === 'profile' ? 'bg-primary-container text-on-primary-container px-4 scale-95' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
        >
          <span className="material-symbols-outlined" style={activeTab === 'profile' ? { fontVariationSettings: "'FILL' 1" } : {}}>person</span>
          <span className="font-label-xs text-label-xs mt-1">Hồ sơ</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
