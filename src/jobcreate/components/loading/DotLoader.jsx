import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

export function DotLoader({ 
  size = 12, 
  color = '#FFFFFF', 
  spaceBetween = 8, 
  bounceHeight = 10,
  duration = 600
}) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (animatedValue, delay) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
              toValue: 0,
              duration: duration,
              useNativeDriver: true,
            }),
          ])
        ),
      ]);
    };

    Animated.parallel([
      createAnimation(dot1, 0),
      createAnimation(dot2, duration / 3),
      createAnimation(dot3, (duration / 3) * 2),
    ]).start();
  }, [dot1, dot2, dot3, duration]);

  const translateY = (animatedValue) => {
    return animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -bounceHeight],
    });
  };

  const dotStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    marginHorizontal: spaceBetween / 2,
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[dotStyle, { transform: [{ translateY: translateY(dot1) }] }]} />
      <Animated.View style={[dotStyle, { transform: [{ translateY: translateY(dot2) }] }]} />
      <Animated.View style={[dotStyle, { transform: [{ translateY: translateY(dot3) }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
