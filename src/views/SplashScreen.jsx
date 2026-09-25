import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StatusBar, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../config/theme';
import { retrieveEncryptedData } from '../config/storage';

const LogoImg = require('../assets/img/Logo.jpg');

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Parallel entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar fill animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false, // width animation does not support native driver
    }).start();

    // Check auth status and navigate
    const checkAuthAndNavigate = async () => {
      try {
        const token = await retrieveEncryptedData('token');
        if (token) {
          navigation.replace('MainTabs');
        } else {
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        navigation.replace('Login');
      }
    };

    const timer = setTimeout(() => {
      checkAuthAndNavigate();
    }, 2500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.container}>
        
        {/* Animated Logo Container */}
        <Animated.View
          style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
        >
          <Image
            source={LogoImg}
            style={styles.logoImage}
          />
        </Animated.View>

        {/* Text Details / Loader */}
        <Animated.View style={[styles.loaderContainer, { opacity: fadeAnim }]}>
          <View style={styles.progressBarContainer}>
            <View style={styles.track}>
              <Animated.View 
                style={[
                  styles.progress, 
                  { width: progressWidth }
                ]} 
              />
            </View>
            <Text style={styles.loadingText}>GATE SECURITY OPERATIONS</Text>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 220, 
    height: 100, 
    resizeMode: 'contain', 
    marginBottom: 16
  },
  loaderContainer: {
    position: 'absolute', 
    bottom: 50, 
    left: 0, 
    right: 0,
    alignItems: 'center',
  },
  progressBarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progress: {
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  loadingText: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: FONTS.inter,
  }
});
