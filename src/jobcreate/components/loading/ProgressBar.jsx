import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';

export function ProgressBar({ 
  duration = 2500, 
  barWidth = 200, 
  barHeight = 4, 
  progressColor = '#FFFFFF', 
  trackColor = 'rgba(255, 255, 255, 0.3)',
  text = '',
  textStyle = {}
}) {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    }).start();
  }, [duration, progressAnim]);

  const widthInterpolated = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <View style={styles.container}>
      <View style={[styles.track, { width: barWidth, height: barHeight, backgroundColor: trackColor }]}>
        <Animated.View 
          style={[
            styles.progress, 
            { 
              width: widthInterpolated, 
              height: barHeight, 
              backgroundColor: progressColor 
            }
          ]} 
        />
      </View>
      {text ? (
        <Text style={[styles.text, textStyle]}>{text}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    borderRadius: 2,
    overflow: 'hidden',
  },
  progress: {
    borderRadius: 2,
  },
  text: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  }
});
