import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';

export default function ChatScreen({ route, navigation, user }) {
  const initialRestaurant = route.params?.initialRestaurant || null;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const scrollViewRef = useRef(null);
  const isOwner = user?.role === 'OWNER';

  const activeRestaurantId = selectedConversation?.restaurantId || initialRestaurant?.id;
  const activeRestaurantName = selectedConversation?.restaurantName || initialRestaurant?.name;
  const activeStudentId = isOwner ? (selectedConversation?.studentId) : user?.id;

  useEffect(() => {
    if (initialRestaurant) {
      setSelectedConversation({
        restaurantId: initialRestaurant.id,
        restaurantName: initialRestaurant.name,
        studentId: user?.id
      });
    } else {
      loadConversations();
    }
  }, [initialRestaurant]);

  const loadConversations = async () => {
    if (!user) return;
    const url = isOwner
      ? `${API_BASE_URL}/chat/conversations/owner/${user.id}`
      : `${API_BASE_URL}/chat/conversations/student/${user.id}`;

    try {
      const response = await axios.get(url);
      setConversations(response.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!activeRestaurantId || !activeStudentId) return;

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeRestaurantId, activeStudentId]);

  const fetchMessages = async () => {
    if (!activeRestaurantId || !activeStudentId) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/messages`, {
        params: { restaurantId: activeRestaurantId, studentId: activeStudentId }
      });
      setMessages(response.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const content = textToSend || inputText;
    if (!content.trim() || !activeRestaurantId || !activeStudentId) return;

    const payload = {
      restaurantId: activeRestaurantId,
      studentId: activeStudentId,
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
    }
  };

  const quickChips = isOwner ? [
    "Dạ quán em đang làm món rồi ạ! 👨‍🍳",
    "Đơn của bạn đang được giao rồi nhé! 🛵",
    "Cảm ơn bạn đã ủng hộ quán! ❤️"
  ] : [
    "Quán còn bán món này không ạ? 🍲",
    "Khoảng bao lâu thì giao tới ạ? 🛵",
    "Cho em thêm nước tương/ớt nhé! 🥢"
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        {selectedConversation && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedConversation(null)}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {selectedConversation ? (isOwner ? selectedConversation.studentName : activeRestaurantName) : 'Hộp thư Tin nhắn'}
          </Text>
          <Text style={styles.onlineStatus}>🟢 Trực tuyến</Text>
        </View>
      </View>

      {!selectedConversation ? (
        /* Conversations List */
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.listSectionTitle}>
            {isOwner ? 'Khách hàng gửi tin nhắn' : 'Hội thoại tin nhắn với các quán'}
          </Text>
          {conversations.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="chatbubbles-outline" size={60} color="#CCC" />
              <Text style={styles.emptyTitle}>Chưa có tin nhắn nào</Text>
              <Text style={styles.emptySub}>
                {isOwner ? 'Chưa có sinh viên nào gửi tin nhắn cho quán.' : 'Chọn một quán ăn và bấm "Tin nhắn" để bắt đầu trò chuyện!'}
              </Text>
            </View>
          ) : (
            conversations.map((c, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.convCard}
                onPress={() => setSelectedConversation(c)}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{isOwner ? '👤' : '🏪'}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.convName}>{isOwner ? c.studentName : c.restaurantName}</Text>
                  <Text style={styles.convLastMsg} numberOfLines={1}>{c.lastMessage || 'Bắt đầu tin nhắn...'}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : (
        /* Messages Panel */
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 ? (
              <Text style={styles.noMsgText}>Bắt đầu nhắn tin với {isOwner ? 'khách hàng' : 'quán ăn'}</Text>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderId === user.id;
                return (
                  <View key={idx} style={[styles.msgRow, isMe ? styles.msgRight : styles.msgLeft]}>
                    <Text style={styles.senderName}>{msg.senderName}</Text>
                    <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                      <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{msg.content}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Quick Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipBar}>
            {quickChips.map((chip, idx) => (
              <TouchableOpacity key={idx} style={styles.chipBtn} onPress={() => handleSendMessage(chip)}>
                <Text style={styles.chipBtnText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Nhập tin nhắn..."
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={() => handleSendMessage()} disabled={loading || !inputText.trim()}>
              <Ionicons name="send" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: '#FF6B00' },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  onlineStatus: { fontSize: 11, color: '#FFF', opacity: 0.9 },
  listSectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#666', uppercase: 'uppercase', marginBottom: 12 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#444', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#888', textAlign: 'center', marginHorizontal: 30, marginTop: 4 },
  convCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF0E6', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20 },
  convName: { fontSize: 14, fontWeight: 'bold', color: '#222' },
  convLastMsg: { fontSize: 12, color: '#777', marginTop: 2 },
  noMsgText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 13 },
  msgRow: { marginBottom: 12 },
  msgLeft: { alignSelf: 'flex-start' },
  msgRight: { alignSelf: 'flex-end' },
  senderName: { fontSize: 10, color: '#888', marginBottom: 2, paddingHorizontal: 4 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, maxWidth: '80%' },
  bubbleMe: { backgroundColor: '#FF6B00', borderBottomRightRadius: 2 },
  bubbleOther: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderBottomLeftRadius: 2 },
  msgText: { fontSize: 14, color: '#333' },
  msgTextMe: { color: '#FFF' },
  chipBar: { backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 6, borderTopWidth: 1, borderColor: '#EEE' },
  chipBtn: { backgroundColor: '#FFF0E6', borderWidth: 1, borderColor: '#FF6B00', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  chipBtnText: { fontSize: 11, color: '#FF6B00', fontWeight: 'bold' },
  inputBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 10, borderTopWidth: 1, borderColor: '#EEE' },
  input: { flex: 1, backgroundColor: '#F2F2F2', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#333' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF6B00', justifyContent: 'center', alignItems: 'center', marginLeft: 8 }
});
