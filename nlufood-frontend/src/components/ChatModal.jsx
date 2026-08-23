import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

function ChatModal({ isOpen, onClose, currentUser, initialRestaurant, initialStudentId }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const messagesEndRef = useRef(null);

  const isOwner = currentUser?.role === 'OWNER';

  // Active messaging targets
  const activeRestaurantId = selectedConversation?.restaurantId || initialRestaurant?.id;
  const activeRestaurantName = selectedConversation?.restaurantName || initialRestaurant?.name;
  const activeStudentId = isOwner ? (selectedConversation?.studentId || initialStudentId) : currentUser?.id;
  const activeStudentName = selectedConversation?.studentName || (isOwner ? `Khách hàng #${activeStudentId}` : currentUser?.name);

  // Initialize selected conversation or load list
  useEffect(() => {
    if (!isOpen) return;

    if (initialRestaurant) {
      setSelectedConversation({
        restaurantId: initialRestaurant.id,
        restaurantName: initialRestaurant.name,
        restaurantImage: initialRestaurant.imageUrl,
        studentId: currentUser?.id
      });
    } else {
      setSelectedConversation(null);
      loadConversations();
    }
  }, [isOpen, initialRestaurant]);

  // Load conversations list
  const loadConversations = () => {
    if (!currentUser) return;
    const url = isOwner
      ? `${API_BASE_URL}/chat/conversations/owner/${currentUser.id}`
      : `${API_BASE_URL}/chat/conversations/student/${currentUser.id}`;

    axios.get(url)
      .then(res => {
        setConversations(res.data || []);
      })
      .catch(err => console.error("Lỗi khi tải danh sách tin nhắn:", err));
  };

  // Poll messages every 3s when conversation is active
  useEffect(() => {
    if (!isOpen || !activeRestaurantId || !activeStudentId) return;

    fetchMessages();
    markAsRead();

    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, activeRestaurantId, activeStudentId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = () => {
    if (!activeRestaurantId || !activeStudentId) return;
    axios.get(`${API_BASE_URL}/chat/messages`, {
      params: { restaurantId: activeRestaurantId, studentId: activeStudentId }
    })
    .then(res => {
      setMessages(res.data || []);
    })
    .catch(err => console.error("Lỗi khi lấy tin nhắn:", err));
  };

  const markAsRead = () => {
    if (!activeRestaurantId || !activeStudentId) return;
    axios.put(`${API_BASE_URL}/chat/read`, null, {
      params: {
        restaurantId: activeRestaurantId,
        studentId: activeStudentId,
        readerRole: isOwner ? 'OWNER' : 'STUDENT'
      }
    }).catch(err => console.error("Lỗi đánh dấu đã đọc:", err));
  };

  const handleSendMessage = (textToSend) => {
    const content = textToSend || inputText;
    if (!content.trim() || !activeRestaurantId || !activeStudentId) return;

    const payload = {
      restaurantId: activeRestaurantId,
      studentId: activeStudentId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: isOwner ? 'OWNER' : 'STUDENT',
      content: content.trim()
    };

    setLoading(true);
    axios.post(`${API_BASE_URL}/chat/messages`, payload)
      .then(res => {
        setInputText('');
        setMessages(prev => [...prev, res.data]);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi gửi tin nhắn:", err);
        setLoading(false);
      });
  };

  if (!isOpen) return null;

  const quickChips = isOwner ? [
    "Dạ quán em đang làm ạ! 👨‍🍳",
    "Đơn của bạn đang được giao rồi nhé! 🛵",
    "Dạ món này hết rồi ạ! 🙏",
    "Cảm ơn bạn đã ủng hộ quán! ❤️"
  ] : [
    "Quán còn bán món này không ạ? 🍲",
    "Khoảng bao lâu thì giao tới ạ? 🛵",
    "Cho em thêm nước tương/ớt nhé! 🥢",
    "Giao đến Cổng KTX giúp em nhé! 📍"
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-[650px] h-[100dvh] sm:h-[88vh] sm:max-h-[700px] rounded-none sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden border-0 sm:border border-outline-variant/30">
        
        {/* Header */}
        <div className="bg-primary text-white p-3.5 sm:p-4 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {selectedConversation && (
              <button 
                onClick={() => setSelectedConversation(null)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-all text-white shrink-0"
                title="Danh sách tin nhắn"
              >
                <span className="material-symbols-outlined text-xl">arrow_back</span>
              </button>
            )}
            
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-base sm:text-lg shadow-inner shrink-0">
              {isOwner ? '👤' : '🏪'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm sm:text-base truncate">
                {selectedConversation
                  ? (isOwner ? activeStudentName : activeRestaurantName)
                  : "Hộp thư Tin nhắn"}
              </h3>
              <p className="text-[11px] sm:text-xs text-white/80 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Đang trực tuyến
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-all text-white shrink-0 ml-2"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* If no active conversation selected */}
          {!selectedConversation ? (
            <div className="w-full h-full flex flex-col bg-slate-50 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3">
                    <span className="material-symbols-outlined text-4xl">forum</span>
                  </div>
                  <h4 className="font-bold text-base text-gray-700 mb-1">Chưa có tin nhắn nào</h4>
                  <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                    {isOwner
                      ? "Chưa có khách hàng nào gửi tin nhắn cho quán. Tin nhắn từ sinh viên sẽ xuất hiện tại đây!"
                      : "Bạn chưa trò chuyện với quán ăn nào. Hãy mở trang một quán ăn bất kỳ và bấm 'Tin nhắn' để bắt đầu trò chuyện nhé!"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 bg-white">
                  <div className="p-3 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    {isOwner ? "Khách hàng gửi tin nhắn" : "Hội thoại tin nhắn với các quán"}
                  </div>
                  {conversations.map((c, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedConversation(c)}
                      className="w-full p-3.5 sm:p-4 hover:bg-primary-container/20 flex items-center justify-between transition-all text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center font-bold text-gray-600 shrink-0">
                          {c.restaurantImage ? (
                            <img src={c.restaurantImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (isOwner ? c.studentName?.[0] : c.restaurantName?.[0]) || '💬'
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm text-gray-900 truncate">
                            {isOwner ? c.studentName : c.restaurantName}
                          </div>
                          <div className="text-xs text-gray-500 truncate mt-0.5">
                            {c.lastMessage || "Mở tin nhắn..."}
                          </div>
                        </div>
                      </div>

                      {c.unreadCount > 0 && (
                        <span className="bg-primary text-white text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0">
                          {c.unreadCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Active Chat Messages Panel */
            <div className="flex-1 flex flex-col h-full bg-slate-50 w-full">
              
              {/* Messages Scroll Area */}
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                    <span className="material-symbols-outlined text-5xl mb-2 text-primary/40">chat_bubble_outline</span>
                    <p className="font-medium text-gray-600 text-sm">Bắt đầu gửi tin nhắn</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                      Gửi tin nhắn đầu tiên để liên lạc giữa {isOwner ? 'quán ăn' : 'bạn'} và {isOwner ? 'khách hàng' : 'quán ăn'} nhé!
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMyMessage = msg.senderId === currentUser?.id;
                    const formatTime = (ts) => {
                      if (!ts) return '';
                      try {
                        const d = new Date(ts);
                        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      } catch (e) {
                        return '';
                      }
                    };

                    return (
                      <div
                        key={msg.id || index}
                        className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}
                      >
                        <div className="text-[10px] text-gray-400 mb-1 px-1">
                          {msg.senderName} • {formatTime(msg.timestamp)}
                        </div>
                        <div
                          className={`max-w-[85%] sm:max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm shadow-xs break-words overflow-wrap-anywhere ${
                            isMyMessage
                              ? 'bg-primary text-white rounded-tr-none'
                              : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Chips */}
              <div className="px-2.5 py-2 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                {quickChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip)}
                    className="whitespace-nowrap text-[11px] bg-primary-container/40 text-primary hover:bg-primary-container border border-primary/20 px-2.5 py-1 rounded-full transition-all shrink-0"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Input Footer */}
              <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="p-2.5 sm:p-3 bg-white border-t border-gray-200 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-gray-100 border border-gray-200 rounded-full px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-primary transition-all"
                />
                <button
                  type="submit"
                  disabled={loading || !inputText.trim()}
                  className="w-9 h-9 sm:w-10 sm:h-10 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-all shadow-md active:scale-95 shrink-0"
                >
                  <span className="material-symbols-outlined text-lg sm:text-xl">send</span>
                </button>
              </form>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default ChatModal;
