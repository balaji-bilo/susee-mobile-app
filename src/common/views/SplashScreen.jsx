import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../styles/theme';
import { retrieveEncryptedData } from '../config/storage';
import styles from '../styles/splashStyles';
import { ProgressBar } from '../../jobcreate/components/loading/ProgressBar';

export function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
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

    const checkAuthAndNavigate = async () => {
      try {
        const token = await retrieveEncryptedData('token');
        const roleName = await retrieveEncryptedData('roleName');
        const appModule = await retrieveEncryptedData('appModule');
        if (token) {
          navigation.replace('MainTabs', { role: roleName, appModule: appModule });
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
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDeep} />
      <View style={styles.container}>
        <Animated.View
          style={[{ alignItems: 'center' }, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
        >
          <Image
            source={require('../../assets/img/Logo.jpg')}
            style={{ width: 220, height: 90, resizeMode: 'contain' }}
          />
        </Animated.View>

        {/* Text Details / Loader */}
        <Animated.View style={[styles.textContainer, { position: 'absolute', bottom: 50, left: 0, right: 0, opacity: fadeAnim }]}>
          <ProgressBar text="Susee Group of Companies" duration={2500} />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

export default SplashScreen;
