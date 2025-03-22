import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { activateKeepAwakeAsync } from 'expo-keep-awake';
import BookPage from './pages/BookPage';
import { colors } from './constants/theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { storageService } from './utils/storageService';
import { Section, SECTIONS } from './models/Section';

// Prevent auto-hiding splash screen
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore error */
});

// Configure splash screen animation options
SplashScreen.setOptions({
  duration: 500, // Animation duration in ms
  fade: true,    // Use fade animation
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [initialSection, setInitialSection] = useState<Section | null>(null);
  const [initialPage, setInitialPage] = useState<number>(1);

  // Activate keep awake to prevent screen dimming
  useEffect(() => {
    const enableKeepAwake = async () => {
      try {
        await activateKeepAwakeAsync();
      } catch (error) {
        console.warn('Failed to activate keep awake:', error);
      }
    };
    enableKeepAwake();
  }, []);

  // Load resources (fonts, etc.)
  const loadResources = useCallback(async () => {
    try {
      console.log('Loading resources...');
      try {
        await Font.loadAsync({
          'SpaceMono-Regular': require('./assets/fonts/SpaceMono-Regular.ttf'),
        });
        console.log('Font loaded successfully');
      } catch (fontError) {
        console.warn('Error loading fonts:', fontError);
      }
      // Small delay to simulate resource loading
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log('Resources loaded successfully');
    } catch (e) {
      console.warn('Error loading resources:', e);
    } finally {
      setAppIsReady(true);
    }
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  // Once app is ready, initialize navigation by retrieving last viewed section and page
  useEffect(() => {
    if (appIsReady) {
      const initNavigation = async () => {
        try {
          const currentSectionId = await storageService.getCurrentSectionId();
          const sections = await storageService.loadSections();
          // Use the stored section ID if available; otherwise, fall back to the first section
          const currentSection = sections.find(s => s.id === currentSectionId) || sections[0];
          const lastPage = await storageService.getLastViewedPage(currentSection);
          setInitialSection(currentSection);
          setInitialPage(lastPage);
        } catch (error) {
          console.error('Error initializing navigation:', error);
          // Fallback: use first section and its startPage if something goes wrong
          setInitialSection(SECTIONS[0]);
          setInitialPage(SECTIONS[0].startPage);
        }
      };
      initNavigation();
    }
  }, [appIsReady]);

  // Hide splash screen when layout is ready and app is prepared
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

  // Only render the main UI if app is ready and navigation has been initialized
  if (!appIsReady || !initialSection) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={styles.container} onLayout={onLayoutRootView}>
          <StatusBar style="auto" />
          <BookPage initialSection={initialSection} initialPage={initialPage} />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});
