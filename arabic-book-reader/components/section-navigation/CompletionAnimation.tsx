import React, { forwardRef, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

interface CompletionAnimationProps {
  animationSource: any;
}

// Create a more specific ref type that includes just what we need
type CompletionAnimationRef = {
  play: (startFrame?: number, endFrame?: number) => void;
  reset: () => void;
};

const CompletionAnimation = forwardRef<CompletionAnimationRef, CompletionAnimationProps>(
  ({ animationSource }, ref) => {
    const [visible, setVisible] = useState(false);

    // Use a forwarded ref with our own internal implementation
    const lottieRef = React.useRef<LottieView>(null);

    // Forward the ref methods but add our visibility control
    React.useImperativeHandle(ref, () => ({
      play: (startFrame?: number, endFrame?: number) => {
        setVisible(true);
        if (lottieRef.current) {
          lottieRef.current.play(startFrame, endFrame);
        }
      },
      reset: () => {
        if (lottieRef.current) {
          lottieRef.current.reset();
        }
        setVisible(false);
      }
    }));

    // Hide the animation once it completes
    const handleAnimationFinish = () => {
      setVisible(false);
    };

    if (!visible) return null;

    return (
      <View style={styles.completionAnimationContainer} pointerEvents="none">
        <LottieView
          ref={lottieRef}
          source={animationSource}
          style={styles.completionLottie}
          loop={false}
          autoPlay={false}
          onAnimationFinish={handleAnimationFinish}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  completionAnimationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  completionLottie: {
    width: 300,
    height: 300,
  },
});

export default CompletionAnimation; 