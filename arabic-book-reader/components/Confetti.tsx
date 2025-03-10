import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions, Platform } from 'react-native';

interface ConfettiProps {
  count?: number;
  duration?: number;
  colors?: string[];
  size?: { min: number; max: number };
  performanceMode?: boolean;
}

const { width, height } = Dimensions.get('window');

const Confetti: React.FC<ConfettiProps> = ({ 
  count = Platform.OS === 'ios' ? 80 : 50, 
  duration = 5000,
  colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'],
  size = { min: 5, max: 15 },
  performanceMode = Platform.OS !== 'ios'
}) => {
  const confettiRefs = useRef<Animated.Value[]>([]);
  const animations = useRef<Animated.CompositeAnimation[]>([]);
  
  // Initialize confetti pieces - optimized count based on platform
  useEffect(() => {
    confettiRefs.current = Array(count).fill(0).map(() => new Animated.Value(0));
    
    // Start animations with a slight delay to avoid initial frame drops
    setTimeout(() => {
      startConfettiAnimation();
    }, 50);
    
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
    
    // Create smaller batches of animations to reduce load on the JS thread
    const batchSize = performanceMode ? 10 : 20;
    const batches = Math.ceil(confettiRefs.current.length / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const startIdx = i * batchSize;
      const endIdx = Math.min(startIdx + batchSize, confettiRefs.current.length);
      
      setTimeout(() => {
        const batchAnimations = confettiRefs.current.slice(startIdx, endIdx).map(confetti => {
          return Animated.timing(confetti, {
            toValue: 1,
            duration: duration + (Math.random() * 1500), // Less variation for more consistent performance
            easing: Easing.linear,
            useNativeDriver: true,
          });
        });
        
        // Start this batch of animations
        batchAnimations.forEach(anim => anim.start());
        animations.current.push(...batchAnimations);
      }, i * 50); // Small delay between batches for smoother start
    }
  };
  
  return (
    <View style={styles.container} pointerEvents="none">
      {confettiRefs.current.map((confetti, index) => {
        // Reduce computational complexity for better performance
        const confettiSize = Math.random() * (size.max - size.min) + size.min;
        const startX = Math.random() * width;
        const xVariance = performanceMode ? 80 : 200;
        const endX = startX + (Math.random() * xVariance - xVariance/2);
        const rotations = performanceMode ? 3 : (Math.floor(Math.random() * 8) + 3);
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = Math.random() > 0.5 ? 'circle' : 'square';
        
        // Ensure confetti always starts from top of the screen with slight variation
        // Some will start slightly above the screen (-50 to 0)
        const startY = -50 - Math.random() * 50;
        
        // Calculate animations for smoother performance
        const translateY = confetti.interpolate({
          inputRange: [0, 1],
          outputRange: [startY, height + confettiSize], // Ensure it goes all the way to bottom
        });
        
        // Simplified X movement with fewer interpolation points
        const translateX = confetti.interpolate({
          inputRange: [0, 0.3, 0.7, 1],
          outputRange: [
            startX, 
            startX + (Math.random() * 40 - 20),
            startX + (Math.random() * 80 - 40),
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