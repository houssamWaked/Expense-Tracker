import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { initializeDatabase } from '@/lib/store';
import { AppPreferencesProvider, useAppPreferences } from '@/providers/AppPreferencesProvider';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      void Notifications.setNotificationChannelAsync('money-nudges', {
        name: 'Money reminders',
        description: 'Daily budget check-ins and bill reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 180, 100, 180],
        lightColor: '#D8F36A',
      });
    }
  }, []);

  return (
    <SQLiteProvider databaseName="pocketwise.db" onInit={initializeDatabase}>
      <AppPreferencesProvider><RootNavigator /></AppPreferencesProvider>
    </SQLiteProvider>
  );
}

function RootNavigator() {
  const { resolvedTheme } = useAppPreferences();
  const darkStatusBar = resolvedTheme === 'dark' || resolvedTheme === 'midnight' || resolvedTheme === 'ocean';
  return <><StatusBar style={darkStatusBar ? 'light' : 'dark'} /><Stack screenOptions={{ headerShown: false, animation: 'fade' }} /></>;
}
