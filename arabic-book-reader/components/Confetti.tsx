import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';

interface ConfettiProps {
  count?: number;
  duration?: number;
  colors?: string[];
  size?: { min: number; max: number };
}

const { width, height } = Dimensions.get('window');

const Confetti: React.FC<ConfettiProps> = ({ 
  count = 100, 
  duration = 5000,
  colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'],
  size = { min: 5, max: 15 }
}) => {
  const confettiRefs = useRef<Animated.Value[]>([]);
  const animations = useRef<Animated.CompositeAnimation[]>([]);
  
  // Initialize confetti pieces
  useEffect(() => {
    confettiRefs.current = Array(count).fill(0).map(() => new Animated.Value(0));
    
    // Start animations immediately
    startConfettiAnimation();
    
    // Cleanup animations when component unmounts
    return () => {
      animations.current.forEach(anim => anim.stop());
    };
  }, [count]);
  
  const startConfettiAnimation = () => {
    // Stop any running animations
    animations.current.forEach(anim => anim.stop());
    
    // Reset all confetti pieces
    confettiRefs.current.forEach(ref => ref.setValue(0));
    
    // Create and start new animations
    animations.current = confettiRefs.current.map(confetti => {
      return Animated.timing(confetti, {
        toValue: 1,
        duration: duration + (Math.random() * 3000), // Varied duration for more natural effect
        easing: Easing.linear,
        useNativeDriver: true,
      });
    });
    
    // Start all animations
    animations.current.forEach(anim => anim.start());
  };
  
  return (
    <View style={styles.container} pointerEvents="none">
      {confettiRefs.current.map((confetti, index) => {
        // Random values for each piece of confetti
        const confettiSize = Math.random() * (size.max - size.min) + size.min;
        const startX = Math.random() * width;
        const endX = startX + (Math.random() * 400 - 200); // Wider spread
        const rotations = Math.floor(Math.random() * 10) + 3;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const delay = Math.random() * 1000; // Random delay for more natural effect
        const shape = Math.random() > 0.5 ? 'circle' : 'square';
        
        // Calculate animations
        const translateY = confetti.interpolate({
          inputRange: [0, 1],
          outputRange: [-confettiSize * 2, height + confettiSize],
        });
        
        const translateX = confetti.interpolate({
          inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
          outputRange: [
            startX, 
            startX + (Math.random() * 30 - 15),
            startX + (Math.random() * 60 - 30),
            startX + (Math.random() * 90 - 45),
            startX + (Math.random() * 120 - 60),
            endX
          ],
        });
        
        const rotate = confetti.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${rotations * 360}deg`],
        });
        
        const scale = confetti.interpolate({
          inputRange: [0, 0.2, 0.8, 1],
          outputRange: [0, 1, 1, 0.5],
        });
        
        const opacity = confetti.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [1, 1, 0],
        });
        
        return (
          <Animated.View
            key={index}
            style={[
              styles.confetti,
              {
                width: confettiSize,
                height: confettiSize,
                backgroundColor: color,
                borderRadius: shape === 'circle' ? confettiSize / 2 : 0,
                transform: [
                  { translateY },
                  { translateX },
                  { rotate },
                  { scale }
                ],
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  confetti: {
    position: 'absolute',
    top: 0,
  },
});

export default Confetti; 