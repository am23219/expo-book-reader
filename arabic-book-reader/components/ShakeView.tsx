import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewProps } from 'react-native';

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
      Animated.sequence([
        Animated.timing(shakeAnimation, { 
          toValue: 0, 
          duration: 0, 
          useNativeDriver: true 
        }),
        Animated.sequence(
          Array(count)
            .fill(0)
            .flatMap(() => [
              Animated.timing(shakeAnimation, {
                toValue: intensity,
                duration: duration / (count * 2),
                useNativeDriver: true,
              }),
              Animated.timing(shakeAnimation, {
                toValue: -intensity,
                duration: duration / (count * 2),
                useNativeDriver: true,
              }),
            ])
        ),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: duration / (count * 2),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [shake]);

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