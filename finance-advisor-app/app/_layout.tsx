/**
 * Root Layout — wraps the entire app.
 * Handles expo-router entry, loads fonts, initializes store.
 */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { loadBaseUrl } from '../services/api';

export default function RootLayout() {
  useEffect(() => {
    loadBaseUrl();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0f1e' },
          animation: 'fade',
        }}
      />
    </SafeAreaProvider>
  );
}
