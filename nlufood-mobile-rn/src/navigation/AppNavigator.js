import React from 'react';
import { View, Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import CartScreen from '../screens/CartScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ManageRestaurantScreen from '../screens/ManageRestaurantScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ user, cart, setCart, onLogout, onUpdateUser }) {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 34 : 16);
  const tabHeight = 58 + bottomInset;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#BA3D0E',
        tabBarInactiveTintColor: '#7A6658',
        tabBarStyle: {
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 6,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0ECE8',
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 6
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
          marginBottom: 2
        },
        tabBarIcon: ({ focused }) => {
          let iconEmoji = '🏠';
          if (route.name === 'Home') iconEmoji = '🏠';
          else if (route.name === 'Search') iconEmoji = '🔍';
          else if (route.name === 'Orders') iconEmoji = '📦';
          else if (route.name === 'Chat') iconEmoji = '💬';
          else if (route.name === 'Profile') iconEmoji = '👤';

          return (
            <View style={{
              backgroundColor: focused ? '#FFEAE0' : 'transparent',
              paddingHorizontal: 14,
              paddingVertical: 3,
              borderRadius: 14,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Text style={{ fontSize: 20 }}>{iconEmoji}</Text>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" options={{ tabBarLabel: 'Trang chủ' }}>
        {props => <HomeScreen {...props} user={user} cart={cart} setCart={setCart} />}
      </Tab.Screen>
      <Tab.Screen name="Search" options={{ tabBarLabel: 'Tìm kiếm' }}>
        {props => <SearchScreen {...props} cart={cart} setCart={setCart} />}
      </Tab.Screen>
      <Tab.Screen name="Orders" options={{ tabBarLabel: 'Đơn hàng' }}>
        {props => <OrdersScreen {...props} user={user} setCart={setCart} />}
      </Tab.Screen>
      <Tab.Screen name="Chat" options={{ tabBarLabel: 'Tin nhắn' }}>
        {props => <ChatScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Profile" options={{ tabBarLabel: 'Hồ sơ' }}>
        {props => <ProfileScreen {...props} user={user} cart={cart} onLogout={onLogout} onUpdateUser={onUpdateUser} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function AppNavigator({ user, cart, setCart, onLoginSuccess, onLogout, onUpdateUser }) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login">
            {props => <LoginScreen {...props} onLoginSuccess={onLoginSuccess} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="MainTabs">
              {props => (
                <MainTabs
                  {...props}
                  user={user}
                  cart={cart}
                  setCart={setCart}
                  onLogout={onLogout}
                  onUpdateUser={onUpdateUser}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="RestaurantDetail">
              {props => <RestaurantDetailScreen {...props} cart={cart} setCart={setCart} user={user} />}
            </Stack.Screen>

            <Stack.Screen name="Cart">
              {props => <CartScreen {...props} cart={cart} setCart={setCart} user={user} />}
            </Stack.Screen>

            <Stack.Screen name="ManageRestaurant">
              {props => <ManageRestaurantScreen {...props} user={user} />}
            </Stack.Screen>

            <Stack.Screen name="Notifications">
              {props => <NotificationsScreen {...props} user={user} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
