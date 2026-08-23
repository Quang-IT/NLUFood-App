import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

function NotificationsModal({ user, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/notifications/user/${user.id}`)
      .then(res => {
        setNotifications(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching notifications:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNotifications();
  }, [user.id]);

  const handleMarkAsRead = (id) => {
    axios.put(`${API_BASE_URL}/notifications/${id}/read`)
      .then(() => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      })
      .catch(err => console.error("Error marking read:", err));
  };

  const handleMarkAllAsRead = () => {
    axios.put(`${API_BASE_URL}/notifications/user/${user.id}/read-all`)
      .then(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      })
      .catch(err => console.error("Error marking all read:", err));
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    axios.delete(`${API_BASE_URL}/notifications/${id}`)
      .then(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      })
      .catch(err => console.error("Error deleting notification:", err));
  };

  const getIcon = (title) => {
    if (title.includes("thành công") || title.includes("🛒")) return { name: "shopping_cart", color: "text-green-500 bg-green-50" };
    if (title.includes("chuẩn bị") || title.includes("👨‍🍳")) return { name: "soup_kitchen", color: "text-orange-500 bg-orange-50" };
    if (title.includes("giao") || title.includes("🛵")) return { name: "local_shipping", color: "text-blue-500 bg-blue-50" };
    if (title.includes("hoàn thành") || title.includes("🎉")) return { name: "check_circle", color: "text-primary bg-primary/5" };
    if (title.includes("hủy") || title.includes("😞")) return { name: "cancel", color: "text-red-500 bg-red-50" };
    return { name: "notifications", color: "text-primary bg-primary/5" };
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-[92%] max-w-[440px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border border-outline-variant/30">
        
        {/* Header with vibrant gradient */}
        <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-white relative flex-shrink-0">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
          <h4 className="text-xl font-bold flex items-center gap-2">
            Thông báo của bạn
            <span className="material-symbols-outlined animate-bounce">notifications</span>
          </h4>
          <p className="text-xs text-white/80 mt-1">Cập nhật hành trình giao hàng và trạng thái đơn hàng của bạn.</p>
        </div>

        {/* Action Header */}
        {notifications.length > 0 && (
          <div className="px-6 py-3 bg-surface-container-low border-b border-outline-variant/20 flex justify-between items-center flex-shrink-0">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              {notifications.filter(n => !n.read).length} thông báo chưa đọc
            </span>
            <button 
              onClick={handleMarkAllAsRead}
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[14px]">done_all</span> Đã đọc tất cả
            </button>
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center py-16">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-on-surface-variant text-sm font-medium">Đang tải thông báo...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 px-4">
              <span className="material-symbols-outlined text-6xl text-outline-variant/60 mb-4 animate-pulse">notifications_off</span>
              <h5 className="font-bold text-on-surface mb-1">Chưa có thông báo nào</h5>
              <p className="text-xs text-on-surface-variant leading-relaxed">Khi quán nhận đơn hoặc cập nhật trạng thái đơn hàng, bạn sẽ nhận được thông báo tại đây.</p>
            </div>
          ) : (
            notifications.map(notif => {
              const iconData = getIcon(notif.title);
              return (
                <div 
                  key={notif.id}
                  onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex gap-3.5 ${
                    notif.read 
                      ? 'bg-white border-outline-variant/20 opacity-75' 
                      : 'bg-primary/5 border-primary/20 shadow-sm'
                  }`}
                >
                  {/* Left Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconData.color}`}>
                    <span className="material-symbols-outlined text-xl">{iconData.name}</span>
                  </div>

                  {/* Body Text */}
                  <div className="flex-1 min-w-0 pr-6">
                    <h5 className={`text-sm leading-snug truncate ${notif.read ? 'font-medium text-on-surface' : 'font-bold text-primary'}`}>
                      {notif.title}
                    </h5>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[9px] font-bold text-on-surface-variant/50 mt-2 block">
                      {new Date(notif.createdTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(notif.createdTime).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  {/* Unread circle badge */}
                  {!notif.read && (
                    <span className="absolute top-4 right-8 w-2,5 h-2,5 rounded-full bg-primary animate-ping"></span>
                  )}

                  {/* Action buttons */}
                  <button 
                    onClick={(e) => handleDelete(notif.id, e)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-surface-container-high hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom actions */}
        <div className="p-6 pt-0 flex-shrink-0">
          <button 
            onClick={onClose}
            className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 hover:bg-primary/90"
          >
            Đóng thông báo
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationsModal;
