import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewProps, Platform } from 'react-native';

interface ShakeViewProps extends ViewProps {
  shake?: boolean;
  intensity?: number;
  duration?: number;
  count?: number;
}

const ShakeView: React.FC<ShakeViewProps> = ({ 
  children, 
  shake = true, 
  intensity = 7,
  duration = 500,
  count = 3,
  style,
  ...props 
}) => {
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shake) {
      // Reset the animation value to avoid additive animation issues
      shakeAnimation.setValue(0);
      
      // Create the animations array for better reuse
      const shakeSequence = [];
      
      // Create count * 2 animations (back and forth for each count)
      for (let i = 0; i < count; i++) {
        shakeSequence.push(
          Animated.timing(shakeAnimation, {
            toValue: intensity,
            duration: duration / (count * 2),
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: -intensity,
            duration: duration / (count * 2),
            useNativeDriver: true,
          })
        );
      }
      
      // Add final animation to return to center
      shakeSequence.push(
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: duration / (count * 2),
          useNativeDriver: true,
        })
      );
      
      // Run the sequence
      Animated.sequence(shakeSequence).start();
    }
  }, [shake, intensity, duration, count]);

  const animatedStyle = {
    transform: [{ translateX: shakeAnimation }],
  };

  return (
    <Animated.View style={[style, animatedStyle]} {...props}>
      {children}
    </Animated.View>
  );
};

export default ShakeView; 