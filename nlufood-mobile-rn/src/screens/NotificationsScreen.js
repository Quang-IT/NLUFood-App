import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function NotificationsScreen({ navigation, user }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'UNREAD'

  const fetchNotifications = async (showLoading = true) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/notifications/user/${user.id}`);
      setNotifications(res.data || []);
    } catch (e) {
      console.error('Lỗi khi tải thông báo:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications(false);
    }, [user?.id])
  );

  useEffect(() => {
    fetchNotifications(true);
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(false);
  };

  const handleMarkAsRead = async (item) => {
    if (item.read || item.isRead) return;
    try {
      await axios.put(`${API_BASE_URL}/notifications/${item.id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === item.id ? { ...n, isRead: true, read: true } : n))
      );
    } catch (e) {
      console.error('Lỗi đánh dấu đã đọc:', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await axios.put(`${API_BASE_URL}/notifications/user/${user.id}/read-all`);
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, read: true }))
      );
      Alert.alert('Thành công', 'Đã đánh dấu tất cả thông báo là đã đọc!');
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể đánh dấu tất cả đã đọc.');
    }
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Xóa thông báo',
      'Bạn có chắc chắn muốn xóa thông báo này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/notifications/${item.id}`);
              setNotifications(prev => prev.filter(n => n.id !== item.id));
            } catch (e) {
              Alert.alert('Lỗi', 'Không thể xóa thông báo.');
            }
          }
        }
      ]
    );
  };

  const getIconInfo = (title = '', message = '') => {
    const text = (title + ' ' + message).toLowerCase();
    if (text.includes('giao') || text.includes('vận chuyển') || text.includes('shipper') || text.includes('🛵')) {
      return { icon: '🛵', bg: '#E3F2FD', color: '#1976D2', label: 'Giao hàng' };
    }
    if (text.includes('ưu đãi') || text.includes('khuyến mãi') || text.includes('voucher') || text.includes('giảm') || text.includes('🎉') || text.includes('🎁')) {
      return { icon: '🎁', bg: '#FFF3E0', color: '#E65100', label: 'Khuyến mãi' };
    }
    if (text.includes('hoàn thành') || text.includes('thành công') || text.includes('nhận món') || text.includes('✅')) {
      return { icon: '✅', bg: '#E8F5E9', color: '#2E7D32', label: 'Hoàn thành' };
    }
    if (text.includes('hủy') || text.includes('từ chối') || text.includes('❌')) {
      return { icon: '❌', bg: '#FFEBEE', color: '#C62828', label: 'Đã hủy' };
    }
    if (text.includes('chat') || text.includes('tin nhắn') || text.includes('💬')) {
      return { icon: '💬', bg: '#EDE7F6', color: '#512DA8', label: 'Tin nhắn' };
    }
    if (text.includes('vip') || text.includes('hội viên') || text.includes('👑') || text.includes('💎')) {
      return { icon: '👑', bg: '#FFF8E1', color: '#B78103', label: 'Hội viên VIP' };
    }
    return { icon: '🔔', bg: '#FFEAE0', color: '#BA3D0E', label: 'Thông báo' };
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return String(timeStr);
      const hours = date.getHours().toString().padStart(2, '0');
      const mins = date.getMinutes().toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${hours}:${mins}, ${day}/${month}`;
    } catch {
      return '';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead && !n.read).length;
  const filteredList = filterType === 'UNREAD'
    ? notifications.filter(n => !n.isRead && !n.read)
    : notifications;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 22, color: '#2A1608' }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Thông báo của bạn 🔔</Text>
          <Text style={styles.headerSub}>
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Bạn đã xem hết thông báo'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.readAllBtn} onPress={handleMarkAllAsRead}>
            <Text style={styles.readAllText}>Đọc tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'ALL' && styles.filterChipActive]}
          onPress={() => setFilterType('ALL')}
        >
          <Text style={[styles.filterChipText, filterType === 'ALL' && styles.filterChipTextActive]}>
            Tất cả ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'UNREAD' && styles.filterChipActive]}
          onPress={() => setFilterType('UNREAD')}
        >
          <Text style={[styles.filterChipText, filterType === 'UNREAD' && styles.filterChipTextActive]}>
            Chưa đọc ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#BA3D0E" />
          <Text style={styles.loadingText}>Đang tải thông báo...</Text>
        </View>
      ) : filteredList.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={{ fontSize: 56, marginBottom: 12 }}>🔔</Text>
          <Text style={styles.emptyTitle}>
            {filterType === 'UNREAD' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
          </Text>
          <Text style={styles.emptySub}>
            Khi quán ăn cập nhật trạng thái đơn hàng hoặc có ưu đãi mới dành riêng cho sinh viên KTX, bạn sẽ nhận được thông báo tại đây.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#BA3D0E']} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isUnread = !item.isRead && !item.read;
            const iconInfo = getIconInfo(item.title, item.message);
            return (
              <TouchableOpacity
                style={[styles.notifCard, isUnread && styles.notifCardUnread]}
                onPress={() => handleMarkAsRead(item)}
                activeOpacity={0.85}
              >
                <View style={[styles.iconBox, { backgroundColor: iconInfo.bg }]}>
                  <Text style={{ fontSize: 24 }}>{iconInfo.icon}</Text>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.notifHeaderRow}>
                    <Text style={[styles.notifTitle, isUnread && styles.notifTitleUnread]} numberOfLines={2}>
                      {item.title || 'Thông báo mới'}
                    </Text>
                    {isUnread && <View style={styles.unreadDot} />}
                  </View>

                  <Text style={styles.notifMessage} numberOfLines={3}>
                    {item.message || ''}
                  </Text>

                  <View style={styles.notifFooter}>
                    <Text style={styles.notifCategory}>{iconInfo.label}</Text>
                    {item.createdTime && (
                      <Text style={styles.notifTime}>{formatTime(item.createdTime)}</Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={{ fontSize: 14, color: '#A89A90' }}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F5'
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE8',
    elevation: 2
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5EFEB',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2A1608'
  },
  headerSub: {
    fontSize: 12,
    color: '#7A6658',
    marginTop: 2
  },
  readAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFEAE0'
  },
  readAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#BA3D0E'
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE8'
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5EFEB'
  },
  filterChipActive: {
    backgroundColor: '#BA3D0E'
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7A6658'
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  listContent: {
    padding: 16,
    paddingBottom: 40
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0ECE8',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  notifCardUnread: {
    backgroundColor: '#FFFDFB',
    borderColor: '#FFD4C2',
    borderLeftWidth: 4,
    borderLeftColor: '#BA3D0E'
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 18
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A3B32',
    flex: 1
  },
  notifTitleUnread: {
    fontWeight: '800',
    color: '#2A1608'
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#BA3D0E',
    marginLeft: 6
  },
  notifMessage: {
    fontSize: 13,
    color: '#7A6658',
    lineHeight: 18,
    marginTop: 4
  },
  notifFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingRight: 18
  },
  notifCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BA3D0E',
    backgroundColor: '#FFEAE0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  notifTime: {
    fontSize: 11,
    color: '#A89A90'
  },
  deleteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30
  },
  loadingText: {
    fontSize: 14,
    color: '#7A6658',
    marginTop: 12,
    fontWeight: '600'
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2A1608',
    textAlign: 'center'
  },
  emptySub: {
    fontSize: 13,
    color: '#7A6658',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6
  }
});
