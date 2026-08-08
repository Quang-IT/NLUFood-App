import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import CartScreen from '../screens/CartScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ManageRestaurantScreen from '../screens/ManageRestaurantScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ user, cart, setCart, onLogout, onUpdateUser }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF6B00',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Search') iconName = 'search';
          else if (route.name === 'Orders') iconName = 'receipt';
          else if (route.name === 'Chat') iconName = 'chatbubbles';
          else if (route.name === 'Profile') iconName = 'person';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" options={{ tabBarLabel: 'Trang chủ' }}>
        {props => <HomeScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Search" options={{ tabBarLabel: 'Tìm kiếm' }}>
        {props => <SearchScreen {...props} />}
      </Tab.Screen>
      <Tab.Screen name="Orders" options={{ tabBarLabel: 'Đơn hàng' }}>
        {props => <OrdersScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Chat" options={{ tabBarLabel: 'Tin nhắn' }}>
        {props => <ChatScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Profile" options={{ tabBarLabel: 'Tài khoản' }}>
        {props => <ProfileScreen {...props} user={user} onLogout={onLogout} onUpdateUser={onUpdateUser} />}
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
              {props => <RestaurantDetailScreen {...props} cart={cart} setCart={setCart} />}
            </Stack.Screen>

            <Stack.Screen name="Cart">
              {props => <CartScreen {...props} cart={cart} setCart={setCart} user={user} />}
            </Stack.Screen>

            <Stack.Screen name="ManageRestaurant">
              {props => <ManageRestaurantScreen {...props} user={user} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
