/**
 * Custom hook for theme management
 */
import { useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '../utils';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../constants';
import { UserPreferences } from '../types';

type ThemeType = 'light' | 'dark' | 'system';

export const useTheme = () => {
  const deviceTheme = useColorScheme() as 'light' | 'dark';
  const [theme, setTheme] = useState<ThemeType>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Get the actual theme based on system or user preference
  const activeTheme = theme === 'system' ? deviceTheme : theme;

  // Load theme from storage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const preferences = await storage.loadUserPreferences();
        if (preferences?.theme) {
          setTheme(preferences.theme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Save theme to storage
  const setThemeAndSave = useCallback(async (newTheme: ThemeType) => {
    setTheme(newTheme);
    try {
      const preferences = await storage.loadUserPreferences() || DEFAULT_SETTINGS;
      await storage.saveUserPreferences({
        ...preferences,
        theme: newTheme,
      });
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, []);

  return {
    theme,
    activeTheme,
    setTheme: setThemeAndSave,
    isLoading,
  };
}; 