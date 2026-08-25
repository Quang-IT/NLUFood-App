import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const QUICK_CHIPS = [
  'Quán còn bán món này không ạ? 🍲',
  'Khoảng bao lâu thì giao tới KTX ạ? ⏱️',
  'Cho mình xin thêm tương ớt/nước mắm nhé! 🌶️',
  'Cảm ơn quán nhiều ạ! ❤️'
];

const AI_QUICK_PROMPTS = [
  'Hôm nay ăn gì ngon ở ĐH Nông Lâm? 🍱',
  'Quán nào đang có Flash Sale 50%? 🔥',
  'Làm sao để được Freeship 0đ? 🛵',
  'Thời gian giao hàng đến KTX bao lâu? ⏱️'
];

export default function ChatScreen({ route, navigation, user }) {
  const initialRestaurant = route.params?.initialRestaurant || null;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isAiMode, setIsAiMode] = useState(false);

  const scrollViewRef = useRef(null);
  const isOwner = user?.role === 'OWNER';

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  useEffect(() => {
    if (initialRestaurant) {
      setSelectedConversation({
        restaurantId: initialRestaurant.id,
        restaurantName: initialRestaurant.name,
        restaurantImage: initialRestaurant.imageUrl,
        studentId: user?.id
      });
      setIsAiMode(false);
    }
  }, [initialRestaurant]);

  const fetchInitialData = async () => {
    if (!user) return;
    try {
      // 1. Fetch Conversations
      const url = isOwner
        ? `${API_BASE_URL}/chat/conversations/owner/${user.id}`
        : `${API_BASE_URL}/chat/conversations/student/${user.id}`;
      
      const convRes = await axios.get(url).catch(() => ({ data: [] }));
      setConversations(convRes.data || []);

      // 2. Fetch All Restaurants for student to start a chat easily
      if (!isOwner) {
        const resList = await axios.get(`${API_BASE_URL}/restaurants`).catch(() => ({ data: [] }));
        setAllRestaurants(resList.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!selectedConversation) return;

    if (selectedConversation.isAi) {
      setIsAiMode(true);
      if (messages.length === 0) {
        setMessages([
          {
            id: 'ai_welcome',
            senderRole: 'AI',
            senderName: 'Trợ lý Ảo NLU Food 🤖',
            content: `Xin chào ${user?.name || 'bạn'}! Mình là Trợ lý Ảo NLU Food 🤖.\n\nMình có thể giúp bạn tìm món ngon gần KTX Nông Lâm, thông tin khuyến mãi Flash Sale 50%, hoặc hỗ trợ kiểm tra gói VIP Freeship. Bạn cần hỗ trợ gì nè?`
          }
        ]);
      }
      return;
    }

    setIsAiMode(false);
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedConversation]);

  const fetchMessages = async () => {
    if (!selectedConversation || selectedConversation.isAi) return;
    const rId = selectedConversation.restaurantId;
    const sId = isOwner ? selectedConversation.studentId : user?.id;
    if (!rId || !sId) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/chat/messages`, {
        params: { restaurantId: rId, studentId: sId }
      });
      setMessages(response.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAiChat = () => {
    setSelectedConversation({
      isAi: true,
      name: 'Trợ lý AI NLU FoodBot 🤖'
    });
  };

  const handleOpenRestaurantChat = (restaurant) => {
    setSelectedConversation({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      restaurantImage: restaurant.imageUrl,
      studentId: user?.id
    });
  };

  const handleSendMessage = async (textToSend) => {
    const content = textToSend || inputText;
    if (!content.trim()) return;

    if (isAiMode) {
      // AI CHATBOT LOGIC
      const userMsg = {
        id: Date.now().toString(),
        senderId: user?.id,
        senderName: user?.name || 'Bạn',
        senderRole: 'STUDENT',
        content: content.trim()
      };
      setMessages(prev => [...prev, userMsg]);
      setInputText('');
      setLoading(true);

      setTimeout(() => {
        let aiReply = 'Cảm ơn bạn đã nhắn tin! Đội ngũ hỗ trợ NLUFood luôn sẵn sàng giúp bạn. Chúc bạn có bữa ăn thật ngon miệng nhé! 😋';
        const lower = content.toLowerCase();

        if (lower.includes('ăn gì') || lower.includes('món ngon') || lower.includes('gợi ý') || lower.includes('cơm') || lower.includes('bún')) {
          aiReply = 'Gợi ý món hot hôm nay cho bạn tại ĐH Nông Lâm:\n1. 🍚 Cơm sườn bì chả đặc biệt (Cơm Tấm Cô Ba)\n2. 🍜 Bún Bò Huế Nông Lâm\n3. 🧋 Trà sữa trân châu đường đen (Gong Cha NLU)\n\nHiện tại các quán đang có Flash Sale giảm 50% cực hấp dẫn đó bạn! 🔥';
        } else if (lower.includes('freeship') || lower.includes('vip') || lower.includes('gói')) {
          aiReply = 'Bạn chỉ cần vào mục "Hồ sơ cá nhân" ➔ "Gói Hội Viên NLU VIP" để kích hoạt gói VIP. Khi đó toàn bộ đơn hàng giao đến KTX hoặc Giảng đường ĐH Nông Lâm đều được FREESHIP 0đ không giới hạn! 👑';
        } else if (lower.includes('giao') || lower.includes('thời gian') || lower.includes('bao lâu') || lower.includes('ktx')) {
          aiReply = 'Thời gian giao đồ ăn trong khuôn viên ĐH Nông Lâm & KTX trung bình chỉ từ 15 đến 25 phút. Bạn có thể theo dõi vị trí Shipper trực tiếp trong mục "Đơn hàng" nhé! 🛵';
        } else if (lower.includes('khuyến mãi') || lower.includes('voucher') || lower.includes('mã')) {
          aiReply = 'Bạn có thể nhập mã "NLUSTUDENT" hoặc "FREESHIP50" trong giỏ hàng để được giảm ngay 15.000đ - 50.000đ cho đơn hàng nhé! 🎁';
        }

        const aiMsg = {
          id: (Date.now() + 1).toString(),
          senderRole: 'AI',
          senderName: 'Trợ lý Ảo NLU Food 🤖',
          content: aiReply
        };
        setMessages(prev => [...prev, aiMsg]);
        setLoading(false);
      }, 600);
      return;
    }

    // RESTAURANT DIRECT CHAT LOGIC
    const rId = selectedConversation?.restaurantId;
    const sId = isOwner ? selectedConversation?.studentId : user?.id;
    if (!rId || !sId) return;

    const payload = {
      restaurantId: rId,
      studentId: sId,
      senderId: user.id,
      senderName: user.name,
      senderRole: isOwner ? 'OWNER' : 'STUDENT',
      content: content.trim()
    };

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/chat/messages`, payload);
      setInputText('');
      setMessages(prev => [...prev, response.data]);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        {selectedConversation && (
          <TouchableOpacity style={styles.backBtn} onPress={() => { setSelectedConversation(null); fetchInitialData(); }}>
            <Text style={{ fontSize: 22, color: '#FFF' }}>←</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {selectedConversation
              ? (selectedConversation.isAi
                  ? 'Trợ lý AI NLU FoodBot 🤖'
                  : (isOwner ? selectedConversation.studentName : selectedConversation.restaurantName))
              : 'Tin nhắn & Trò chuyện'}
          </Text>
          <Text style={styles.onlineStatus}>🟢 Trực tuyến 24/7</Text>
        </View>
      </View>

      {!selectedConversation ? (
        /* CONVERSATION & RESTAURANT DIRECTORY LIST */
        <ScrollView contentContainerStyle={styles.directoryScroll} showsVerticalScrollIndicator={false}>
          {/* AI ASSISTANT BANNER CARD */}
          {!isOwner && (
            <TouchableOpacity style={styles.aiBotCard} onPress={handleOpenAiChat} activeOpacity={0.85}>
              <View style={styles.aiIconCircle}>
                <Text style={{ fontSize: 26 }}>🤖</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.aiBotTitle}>Trợ lý Ảo NLU FoodBot</Text>
                  <View style={styles.aiOfficialTag}>
                    <Text style={styles.aiOfficialTagText}>AI 24/7</Text>
                  </View>
                </View>
                <Text style={styles.aiBotSub} numberOfLines={2}>
                  Tư vấn món ngon Nông Lâm, hướng dẫn freeship, kiểm tra voucher...
                </Text>
              </View>
              <Text style={{ fontSize: 20, color: '#BA3D0E' }}>➔</Text>
            </TouchableOpacity>
          )}

          {/* ACTIVE CONVERSATIONS SECTION */}
          {conversations.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.listSectionTitle}>
                {isOwner ? 'Khách hàng vừa nhắn tin' : 'Hội thoại gần đây'}
              </Text>
              {conversations.map((c, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.convCard}
                  onPress={() => setSelectedConversation(c)}
                >
                  <View style={styles.avatarCircle}>
                    <Text style={{ fontSize: 22 }}>{isOwner ? '👤' : '🏪'}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.convName}>{isOwner ? c.studentName : c.restaurantName}</Text>
                    <Text style={styles.convLastMsg} numberOfLines={1}>
                      {c.lastMessage || 'Bấm để tiếp tục trò chuyện...'}
                    </Text>
                  </View>
                  {c.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{c.unreadCount}</Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 16, color: '#A89A90', marginLeft: 8 }}>➔</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* RESTAURANTS DIRECTORY TO CHAT WITH (For Students) */}
          {!isOwner && (
            <View>
              <Text style={styles.listSectionTitle}>Nhắn tin với các Quán ăn Nông Lâm</Text>
              {allRestaurants.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.restaurantRowCard}
                  onPress={() => handleOpenRestaurantChat(r)}
                >
                  <Image
                    source={{ uri: r.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4' }}
                    style={styles.restaurantRowImg}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.restaurantRowName}>{r.name}</Text>
                    <Text style={styles.restaurantRowAddr} numberOfLines={1}>📍 {r.address}</Text>
                  </View>
                  <View style={styles.chatActionBtn}>
                    <Text style={styles.chatActionBtnText}>💬 Nhắn tin</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {isOwner && conversations.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>💬</Text>
              <Text style={styles.emptyTitle}>Chưa có tin nhắn nào từ khách hàng</Text>
              <Text style={styles.emptySub}>
                Khi sinh viên đặt món hoặc gửi thắc mắc, tin nhắn sẽ hiển thị tại đây để bạn phản hồi ngay lập tức!
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        /* MESSAGES PANEL */
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.welcomeChatBox}>
                <Text style={{ fontSize: 40, marginBottom: 8 }}>👋</Text>
                <Text style={styles.welcomeChatTitle}>
                  Bắt đầu trò chuyện với {selectedConversation.restaurantName || 'Quán ăn'}
                </Text>
                <Text style={styles.welcomeChatSub}>
                  Bạn có thể gửi câu hỏi về món ăn, yêu cầu thêm gia vị hoặc ghi chú giao hàng.
                </Text>
              </View>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderRole === 'STUDENT' && !msg.id?.toString().startsWith('ai_');
                const isAi = msg.senderRole === 'AI';
                return (
                  <View key={idx} style={[styles.msgRow, isMe ? styles.msgRight : styles.msgLeft]}>
                    <Text style={styles.senderName}>{isAi ? '🤖 Trợ lý AI NLU' : (msg.senderName || (isMe ? 'Bạn' : 'Quán ăn'))}</Text>
                    <View style={[styles.bubble, isMe ? styles.bubbleMe : isAi ? styles.bubbleAi : styles.bubbleOther]}>
                      <Text style={[styles.msgText, isMe && styles.msgTextMe, isAi && styles.msgTextAi]}>{msg.content}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Quick Suggestion Chips */}
          <View style={styles.chipBarWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
              {(isAiMode ? AI_QUICK_PROMPTS : QUICK_CHIPS).map((chip, idx) => (
                <TouchableOpacity key={idx} style={styles.chipBtn} onPress={() => handleSendMessage(chip)}>
                  <Text style={styles.chipBtnText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder={isAiMode ? "Hỏi Trợ lý AI NLU FoodBot..." : "Nhập tin nhắn cho quán..."}
              placeholderTextColor="#A89A90"
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() && !loading) && styles.sendBtnDisabled]}
              onPress={() => handleSendMessage()}
              disabled={loading || !inputText.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.sendBtnText}>Gửi ➤</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#BA3D0E'
  },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  onlineStatus: { fontSize: 11, color: '#FFF', opacity: 0.9, marginTop: 2 },
  directoryScroll: { padding: 16, paddingBottom: 120 },
  aiBotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#BA3D0E',
    elevation: 3,
    shadowColor: '#BA3D0E',
    shadowOpacity: 0.15,
    shadowRadius: 8
  },
  aiIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFEAE0', justifyContent: 'center', alignItems: 'center' },
  aiBotTitle: { fontSize: 16, fontWeight: '800', color: '#2A1608' },
  aiOfficialTag: { backgroundColor: '#BA3D0E', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  aiOfficialTagText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  aiBotSub: { fontSize: 12, color: '#7A6658', marginTop: 4, lineHeight: 16 },
  listSectionTitle: { fontSize: 12, fontWeight: '800', color: '#7A6658', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0ECE8',
    elevation: 1
  },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFEAE0', justifyContent: 'center', alignItems: 'center' },
  convName: { fontSize: 15, fontWeight: '800', color: '#2A1608' },
  convLastMsg: { fontSize: 12, color: '#7A6658', marginTop: 2 },
  unreadBadge: { backgroundColor: '#BA3D0E', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  unreadBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  restaurantRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0ECE8',
    elevation: 1
  },
  restaurantRowImg: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#DDD' },
  restaurantRowName: { fontSize: 14, fontWeight: '800', color: '#2A1608' },
  restaurantRowAddr: { fontSize: 11, color: '#7A6658', marginTop: 2 },
  chatActionBtn: { backgroundColor: '#FFEAE0', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
  chatActionBtnText: { color: '#BA3D0E', fontSize: 12, fontWeight: '800' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#2A1608', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#7A6658', textAlign: 'center', marginHorizontal: 30, marginTop: 4 },
  welcomeChatBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  welcomeChatTitle: { fontSize: 16, fontWeight: '800', color: '#2A1608', textAlign: 'center' },
  welcomeChatSub: { fontSize: 12, color: '#7A6658', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  msgRow: { marginBottom: 12, maxWidth: '82%' },
  msgLeft: { alignSelf: 'flex-start' },
  msgRight: { alignSelf: 'flex-end' },
  senderName: { fontSize: 11, fontWeight: '700', color: '#A89A90', marginBottom: 4, marginLeft: 4 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMe: { backgroundColor: '#BA3D0E', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F0ECE8', borderBottomLeftRadius: 4 },
  bubbleAi: { backgroundColor: '#FFF5F0', borderWidth: 1, borderColor: '#FFD6C6', borderBottomLeftRadius: 4 },
  msgText: { fontSize: 14, color: '#2A1608', lineHeight: 20 },
  msgTextMe: { color: '#FFF' },
  msgTextAi: { color: '#8A2B06', fontWeight: '500' },
  chipBarWrapper: { maxHeight: 48, backgroundColor: '#FAF8F5', borderTopWidth: 1, borderColor: '#F0ECE8', paddingVertical: 8 },
  chipBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, marginRight: 8, borderWidth: 1, borderColor: '#F0ECE8' },
  chipBtnText: { fontSize: 12, color: '#4A3B32', fontWeight: '600' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#F0ECE8'
  },
  input: { flex: 1, backgroundColor: '#FDF9F6', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#2A1608', borderWidth: 1, borderColor: '#F1E9E4' },
  sendBtn: { backgroundColor: '#BA3D0E', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, marginLeft: 10 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' }
});
