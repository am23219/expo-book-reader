import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

export const usePulseAnimation = (condition: boolean, min = 1, max = 1.05, duration = 800) => {
  const pulseAnim = useRef(new Animated.Value(min)).current;
  
  useEffect(() => {
    if (condition) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: max,
            duration,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: min,
            duration,
            useNativeDriver: true
          })
        ])
      ).start();
    }
    
    return () => {
      pulseAnim.stopAnimation();
    };
  }, [condition, min, max, duration, pulseAnim]);
  
  return pulseAnim;
};

export const useButtonPressAnimation = (count: number) => {
  const animatedValues = useRef(Array(count).fill(0).map(() => new Animated.Value(1))).current;
  
  const animatePress = (index: number) => {
    Animated.sequence([
      Animated.timing(animatedValues[index], {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true
      }),
      Animated.timing(animatedValues[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  };
  
  return { animatedValues, animatePress };
}; 