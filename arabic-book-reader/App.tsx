import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import BookPage from './pages/BookPage';
import { colors } from './constants/theme';
// Commenting out notification imports for now
// import { 
//   setNotificationHandler, 
//   cancelAllNotifications, 
//   getReminderSettings, 
//   scheduleReminderNotifications 
// } from './utils/notifications';

// Keep the splash screen visible until we're ready
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore error */
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  // Load resources function
  const loadResources = useCallback(async () => {
    try {
      console.log('Loading resources...');
      
      // Only load SpaceMono font which we know exists
      try {
        await Font.loadAsync({
          'SpaceMono-Regular': require('./assets/fonts/SpaceMono-Regular.ttf'),
        });
        console.log('Font loaded successfully');
      } catch (fontError) {
        console.warn('Error loading fonts:', fontError);
      }
      
      console.log('Resources loaded successfully');
    } catch (e) {
      console.warn('Error loading resources:', e);
    } finally {
      setAppIsReady(true);
    }
  }, []);

  // Load resources on mount
  useEffect(() => {
    loadResources();
  }, [loadResources]);

  // Hide splash screen when ready
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      try {
        console.log('Hiding splash screen...');
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('Error hiding splash screen:', e);
      }
    }
  }, [appIsReady]);

  // Commenting out notification setup for now
  // useEffect(() => {
  //   // Set up notification handlers
  //   const subscriptions = setNotificationHandler();
  //   
  //   // Cancel all existing notifications and reschedule based on settings
  //   const resetNotifications = async () => {
  //     try {
  //       // Cancel all existing notifications (including test notifications)
  //       await cancelAllNotifications();
  //       
  //       // We're not automatically rescheduling notifications when the app opens
  //       // This prevents notifications from appearing when launching the app
  //       
  //       // The following code is commented out to prevent auto-scheduling
  //       // const settings = await getReminderSettings();
  //       // await scheduleReminderNotifications(settings);
  //     } catch (error) {
  //       console.error('Error resetting notifications:', error);
  //     }
  //   };
  //   
  //   resetNotifications();
  //   
  //   // Clean up on unmount
  //   return () => {
  //     // ... existing cleanup code ...
  //   };
  // }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <StatusBar style="light" />
      <BookPage />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});
