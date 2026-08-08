import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    loadUserSession();
  }, []);

  const loadUserSession = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user_session');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user_session');
    setUser(null);
    setCart([]);
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator
        user={user}
        cart={cart}
        setCart={setCart}
        onLoginSuccess={(u) => setUser(u)}
        onLogout={handleLogout}
        onUpdateUser={(u) => setUser(u)}
      />
    </SafeAreaProvider>
  );
}
