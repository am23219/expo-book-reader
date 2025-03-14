import React, { useEffect, useRef } from 'react';
import { Animated, ViewProps } from 'react-native';

interface ShakeViewProps extends ViewProps {
  shake: boolean;
  intensity?: number;
  duration?: number;
  count?: number;
  style?: any;
}

const ShakeView: React.FC<ShakeViewProps> = ({
  shake,
  intensity = 7,
  duration = 500,
  count = 3,
  style,
  children,
  ...props
}) => {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shake) {
      // Create an array of animations for the shake effect
      const animations = [];
      const shakeTimes = count * 2;
      
      for (let i = 0; i < shakeTimes; i++) {
        // Alternate between positive and negative values
        const toValue = i % 2 === 0 ? intensity : -intensity;
        
        animations.push(
          Animated.timing(translateX, {
            toValue,
            duration: duration / shakeTimes,
            useNativeDriver: true,
          })
        );
      }
      
      // Add a final animation to return to center
      animations.push(
        Animated.timing(translateX, {
          toValue: 0,
          duration: duration / shakeTimes,
          useNativeDriver: true,
        })
      );
      
      // Run the sequence of animations
      Animated.sequence(animations).start();
    }
  }, [shake, intensity, duration, count, translateX]);

  return (
    <Animated.View
      style={[style, { transform: [{ translateX }] }]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

export default ShakeView; 