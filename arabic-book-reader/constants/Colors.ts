/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const primaryGreen = '#0D8A4E';
const secondaryGreen = '#10A65A';
const lightGreen = '#E8F5EE';
const darkGreen = '#075E35';
const goldAccent = '#D4AF37';

export const Colors = {
  light: {
    text: '#343a40',
    background: '#fff',
    tint: primaryGreen,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryGreen,
    primary: primaryGreen,
    secondary: secondaryGreen,
    light: lightGreen,
    dark: darkGreen,
    gold: goldAccent,
    gray: '#6C757D',
    lightGray: '#e9ecef',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: lightGreen,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: lightGreen,
    primary: secondaryGreen,
    secondary: primaryGreen,
    light: lightGreen,
    dark: darkGreen,
    gold: goldAccent,
    gray: '#9BA1A6',
    lightGray: '#2A2D2E',
  },
};
