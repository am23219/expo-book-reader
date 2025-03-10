import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ElegantCelebrationProps {
  visible: boolean;
  text?: string;
  subText?: string;
  colors?: string[];
  onAnimationComplete?: () => void;
}

const { width, height } = Dimensions.get('window');

const ElegantCelebration: React.FC<ElegantCelebrationProps> = ({
  visible,
  text = "Congratulations!",
  subText = "You've completed a Khatm",
  colors = ['#0D8A4E', '#5A9EBF', '#4CAF50', '#8BC34A', '#FFEB3B'],
  onAnimationComplete
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const ringAnimations = useRef(Array(3).fill(0).map(() => new Animated.Value(0))).current;
  
  useEffect(() => {
    if (visible) {
      // Reset animations
      opacity.setValue(0);
      scale.setValue(0.3);
      rotateAnimation.setValue(0);
      ringAnimations.forEach(anim => anim.setValue(0));
      
      // Start main animation sequence
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.elastic(1.2),
          }),
        ]),
        
        // Celebratory rotate animation
        Animated.timing(rotateAnimation, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
      ]).start(() => {
        // Start the ripple ring animations
        startRingAnimations();
        
        // Schedule the callback a bit earlier to ensure smooth transition
        if (onAnimationComplete) {
          setTimeout(onAnimationComplete, 1500); // Reduced from 2000 to start fade sooner
        }
      });
    } else {
      // Improved hide animation - faster and more complete
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300, // Faster fade out (from 400)
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic), // More aggressive easing
      }).start();
      
      // Stop any running ring animations when hiding
      ringAnimations.forEach(anim => {
        anim.stopAnimation();
        anim.setValue(0);
      });
    }
  }, [visible]);
  
  const startRingAnimations = () => {
    // Start each ring with a staggered delay
    ringAnimations.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Stagger the start of each ring animation
      setTimeout(() => {
        anim.setValue(0.3);
      }, index * 400);
    });
  };
  
  // Calculate animation styles
  const containerStyle = {
    opacity,
    transform: [{ scale }]
  };
  
  const starRotation = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  // Early return if not visible to avoid rendering
  if (!visible && opacity._value === 0) return null;
  
  return (
    <Animated.View 
      style={[
        styles.overlay,
        { opacity }  // Apply opacity to the entire overlay
      ]} 
      pointerEvents="none"
    >
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Animated rings */}
        {ringAnimations.map((anim, index) => {
          const ringScale = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 2.5],
          });
          
          const ringOpacity = anim.interpolate({
            inputRange: [0, 0.6, 1],
            outputRange: [0.8, 0.4, 0],
          });
          
          return (
            <Animated.View 
              key={`ring-${index}`}
              style={[
                styles.ring, 
                { 
                  borderColor: colors[index % colors.length],
                  transform: [{ scale: ringScale }],
                  opacity: ringOpacity,
                }
              ]} 
            />
          );
        })}
        
        {/* Star icon with rotation */}
        <Animated.View style={{ transform: [{ rotate: starRotation }] }}>
          <Ionicons 
            name="star" 
            size={60} 
            color={colors[0]} 
          />
        </Animated.View>
        
        <Text style={styles.text}>{text}</Text>
        <Text style={styles.subText}>{subText}</Text>
        
        {/* Decorative elements */}
        <View style={styles.decorations}>
          {colors.map((color, i) => (
            <View 
              key={`decoration-${i}`} 
              style={[
                styles.decoration, 
                { 
                  backgroundColor: color,
                  width: 8 + (i % 3) * 4,
                  height: 8 + (i % 3) * 4,
                  transform: [{ rotate: `${i * 45}deg` }] 
                }
              ]} 
            />
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderStyle: 'dashed',
  },
  text: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0D8A4E',
    marginTop: 20,
    textAlign: 'center',
  },
  subText: {
    fontSize: 18,
    color: '#5A9EBF',
    marginTop: 10,
    textAlign: 'center',
  },
  decorations: {
    position: 'absolute',
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decoration: {
    position: 'absolute',
    borderRadius: 4,
    opacity: 0.7,
    transform: [{ rotate: '45deg' }],
  },
});

export default ElegantCelebration; 