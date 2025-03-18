import { Platform } from 'react-native';

export const colors = {
  // Primary Colors
  primary: {
    deep: '#2A2D74',   // Deep Blue - for headers, background highlights
    deepGradient: ['#2A2D74', '#292C74', '#27276E'],  // Gradient for backgrounds
    sky: '#72BBE1',    // Sky Blue - for accents and buttons
    white: '#FFFFFF',  // White - for text backgrounds
  },
  
  // Secondary Colors
  secondary: {
    darkNavy: '#292C74',  // Dark Navy - for borders and text emphasis
    lightCyan: '#67B6E1',  // Light Cyan Blue - for soft highlights
    indigo: '#27276E',    // Indigo Blue - for contrast
  },
  
  // Functional Colors
  success: '#69DB7C',  // Green for successful actions/completions
  successGradient: ['#4EC07A', '#55D085', '#69DB7C'], // Success gradient
  error: '#F95E74',    // Red for errors
  warning: '#FFC978',  // Yellow for warnings
  info: '#7BBFFF',     // Blue for information
  
  // UI Colors
  text: {
    primary: '#2A2D74',    // Primary text color
    secondary: '#72BBE1',  // Secondary text color
    light: '#FFFFFF',      // Light text color for dark backgrounds
    muted: '#A8A8C0',      // Muted text color
  },
  
  background: {
    primary: '#FFFFFF',    // Primary background color
    secondary: '#F8F8FD',  // Secondary background color (slight blue tint)
    accent: '#EAF4FA',     // Accent background color (light blue tint)
  },
  
  border: '#D0D8EE',       // Border color with slight blue tint
  
  // Additional colors for effects
  effects: {
    glow: 'rgba(114, 187, 225, 0.6)',   // Sky blue glow
    overlay: 'rgba(42, 45, 116, 0.7)',    // Dark overlay
    cardBg: 'rgba(255, 255, 255, 0.08)', // Semi-transparent card background
    completedBg: 'rgba(105, 219, 124, 0.1)', // Very subtle green background
  }
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#3B2159',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  large: {
    shadowColor: '#3B2159',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 5,
  },
  glow: {
    shadowColor: '#8A7CDD',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  success: {
    shadowColor: '#4EC07A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  }
};

export default {
  colors,
  fonts,
  spacing,
  radius,
  shadows,
}; 