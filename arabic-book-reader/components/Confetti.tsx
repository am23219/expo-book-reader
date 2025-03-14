import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

interface ConfettiProps {
  count?: number;
  duration?: number;
  colors?: string[];
  size?: {
    min: number;
    max: number;
  };
}

const { width, height } = Dimensions.get('window');

const Confetti: React.FC<ConfettiProps> = ({
  count = 50,
  duration = 3000,
  colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3'],
  size = { min: 5, max: 15 }
}) => {
  const confettiPieces = useRef<Array<{
    x: Animated.Value;
    y: Animated.Value;
    rotation: Animated.Value;
    color: string;
    size: number;
    shape: 'circle' | 'square' | 'triangle';
  }>>([]).current;

  // Generate confetti pieces
  useEffect(() => {
    for (let i = 0; i < count; i++) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const randomSize = Math.random() * (size.max - size.min) + size.min;
      const shapes = ['circle', 'square', 'triangle'] as const;
      const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
      
      confettiPieces.push({
        x: new Animated.Value(Math.random() * width),
        y: new Animated.Value(-50 - Math.random() * 100),
        rotation: new Animated.Value(0),
        color: randomColor,
        size: randomSize,
        shape: randomShape
      });
    }

    // Animate each piece
    const animations = confettiPieces.map(piece => {
      const xDestination = piece.x._value + (Math.random() * 200 - 100);
      
      return Animated.parallel([
        Animated.timing(piece.y, {
          toValue: height + 100,
          duration: duration,
          easing: Easing.ease,
          useNativeDriver: true
        }),
        Animated.timing(piece.x, {
          toValue: xDestination,
          duration: duration,
          easing: Easing.ease,
          useNativeDriver: true
        }),
        Animated.timing(piece.rotation, {
          toValue: Math.random() * 4 * Math.PI,
          duration: duration,
          easing: Easing.ease,
          useNativeDriver: true
        })
      ]);
    });

    Animated.stagger(50, animations).start();

    // Cleanup
    return () => {
      animations.forEach(animation => animation.stop());
    };
  }, []);

  const renderConfettiPiece = (piece: typeof confettiPieces[0], index: number) => {
    const spin = piece.rotation.interpolate({
      inputRange: [0, Math.PI * 2],
      outputRange: ['0deg', '360deg']
    });

    const pieceStyle = {
      transform: [
        { translateX: piece.x },
        { translateY: piece.y },
        { rotate: spin }
      ],
      width: piece.size,
      height: piece.size,
      backgroundColor: piece.color,
      borderRadius: piece.shape === 'circle' ? piece.size / 2 : piece.shape === 'square' ? 0 : 0,
      position: 'absolute' as 'absolute',
    };

    if (piece.shape === 'triangle') {
      return (
        <Animated.View key={index} style={[pieceStyle, { backgroundColor: 'transparent' }]}>
          <View style={{
            width: 0,
            height: 0,
            backgroundColor: 'transparent',
            borderStyle: 'solid',
            borderLeftWidth: piece.size / 2,
            borderRightWidth: piece.size / 2,
            borderBottomWidth: piece.size,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: piece.color
          }} />
        </Animated.View>
      );
    }

    return <Animated.View key={index} style={pieceStyle} />;
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.map(renderConfettiPiece)}
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
    pointerEvents: 'none',
  },
});

export default Confetti; 