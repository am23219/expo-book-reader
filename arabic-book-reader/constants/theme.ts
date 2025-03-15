import { Platform } from 'react-native';

export const colors = {
  // Primary Colors
  primary: {
    deep: '#2A2D74',   // Deep Blue - for headers, background highlights
    sky: '#72BBE1',    // Sky Blue - for accents and buttons
    white: '#FFFFFF',  // White - for text backgrounds
  },
  
  // Secondary Colors
  secondary: {
    darkNavy: '#292C74',  // Dark Navy - for borders and text emphasis
    lightCyan: '#67B6E1',  // Light Cyan Blue - for soft highlights
    indigo: '#27276E',     // Indigo Blue - for contrast
  },
  
  // Functional Colors
  success: '#4CAF50',  // Green for successful actions/completions
  error: '#F44336',   // Red for errors
  warning: '#FFC107', // Yellow for warnings
  info: '#2196F3',    // Blue for information
  
  // UI Colors
  text: {
    primary: '#2A2D74',    // Primary text color
    secondary: '#67B6E1',  // Secondary text color
    light: '#FFFFFF',      // Light text color for dark backgrounds
    muted: '#9E9E9E',      // Muted text color
  },
  
  background: {
    primary: '#FFFFFF',    // Primary background color
    secondary: '#F5F7FA',  // Secondary background color
    accent: '#E8F4FD',     // Accent background color
  },
  
  border: '#E0E0E0',       // Border color
};

export const fonts = {
  primaryFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  secondaryFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
  boldFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-condensed',
  
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  weight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 100,
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
};

export default {
  colors,
  fonts,
  spacing,
  radius,
  shadows,
}; 