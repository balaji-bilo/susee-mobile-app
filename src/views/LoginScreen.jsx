import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StatusBar, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import LottieView from 'lottie-react-native';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import styles from '../styles/LoginScreenStyles.jsx';
import { COLORS } from '../config/theme';
import { storeEncryptedData } from '../config/storage';
import { showToast } from '../utils/toast';
import axios from 'axios';
import { base_url, login, forgot_password } from '../config/constant';

export default function LoginScreen({ navigation }) {
  const [emailId, setEmailId] = useState('');
  const [password, setPassword] = useState('');
  const [emailIdError, setEmailIdError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailError, setForgotEmailError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleForgotEmailChange = (text) => {
    setForgotEmail(text);
    if (text.trim()) {
      setForgotEmailError('');
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      setForgotEmailError('Email ID is required');
      return;
    }
    const emailRegex = /^[^\s@]*[a-zA-Z][^\s@]*@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail.trim())) {
      setForgotEmailError('Please enter a valid email address');
      return;
    }

    setForgotLoading(true);
    try {
      console.log(base_url + forgot_password);
      console.log({ emailId: forgotEmail.trim() });
      const response = await axios.post(base_url + forgot_password, {
        emailId: forgotEmail.trim(),
      });

      console.log("Forgot password response is", response);
      const result = response.data;
      if (result.success) {
        showToast(result.message);
        setForgotModalVisible(false);
        setForgotEmail('');
      } else {
        setForgotEmailError(result.message || 'Failed to send reset link');
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      const errMsg = error.response?.data?.message || error.message || 'Error occurred';
      setForgotEmailError(errMsg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleEmailIdChange = (text) => {
    setEmailId(text);
    if (text.trim()) {
      setEmailIdError('');
    }
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (text.trim()) {
      setPasswordError('');
    }
  };

  const handleLogin = async () => {
    let valid = true;

    if (!emailId.trim()) {
      setEmailIdError('Email ID is required');
      valid = false;
    } else {
      const emailRegex = /^[^\s@]*[a-zA-Z][^\s@]*@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailId.trim())) {
        setEmailIdError('Please enter a valid email address');
        valid = false;
      } else {
        setEmailIdError('');
      }
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      valid = false;
    } else {
      setPasswordError('');
    }

    if (valid) {
      setLoading(true);
      try {
        const response = await axios.post(
          base_url + login,
          {
            emailId: emailId.trim(),
            password: password,
          },
          {
            headers: {
              'x-client-platform': 'mobile-gate',
            },
          }
        );

        const result = response.data;

        if (result.success) {
          const { token, user } = result.data;
          await storeEncryptedData('token', token);
          await storeEncryptedData('user', JSON.stringify(user));
          await storeEncryptedData('fullName', user.fullName);
          await storeEncryptedData('emailId', user.emailId || '');
          await storeEncryptedData('mobileNo', user.mobileNo || '');

          showToast('Login successful');
          navigation.replace('MainTabs');
        } else {
          showToast(result.message || 'Login failed. Please check your credentials.');
        }
      } catch (error) {
        console.error("Login API error:", error);
        const errMsg = error.response?.data?.message || 'Network error. Unable to connect to server.';
        showToast(errMsg);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={true} />
      {/* Wave Background with Topography/Contour Curves */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Wave Background with Topography/Contour Curves */}
          <View style={styles.headerBackground}>
            <Svg height="100%" width="100%" viewBox="0 0 1440 240" preserveAspectRatio="none">
              {/* Main Wave */}
              <Path
                fill={COLORS.primary}
                d="M0,0 L0,180 C360,290 1080,70 1440,190 L1440,0 Z"
              />
              {/* Topographical Contour lines */}
              <Path
                fill="none"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="3"
                d="M0,130 C360,240 1080,20 1440,140"
              />
              <Path
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="3"
                d="M0,80 C360,190 1080,-30 1440,90"
              />
              <Path
                fill="none"
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth="3"
                d="M0,30 C360,140 1080,-80 1440,40"
              />
            </Svg>
            {/* Lottie Animation */}
            <View style={styles.lottieContainer}>
              <LottieView
                source={require('../assets/json/login.json')}
                autoPlay
                loop
                style={styles.lottie}
              />
            </View>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Sign in</Text>
              <View style={styles.titleUnderline} />
            </View>

            <CustomInput
              label="Email ID"
              placeholder="Enter email ID"
              value={emailId}
              onChangeText={handleEmailIdChange}
              error={emailIdError}
              variant="underlined"
              leftIcon={<Mail size={18} color={COLORS.muted} />}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <CustomInput
              label="Password"
              placeholder="Enter password"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry={!showPassword}
              error={passwordError}
              variant="underlined"
              leftIcon={<Lock size={18} color={COLORS.muted} />}
              icon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
                  {showPassword
                    ? <Eye size={18} color={COLORS.muted} />
                    : <EyeOff size={18} color={COLORS.muted} />}
                </TouchableOpacity>
              }
            />

            <TouchableOpacity
              style={styles.forgotButton}
              activeOpacity={0.7}
              onPress={() => setForgotModalVisible(true)}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <CustomButton title="Login" onPress={handleLogin} loading={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={forgotModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!forgotLoading) {
            setForgotModalVisible(false);
            setForgotEmail('');
            setForgotEmailError('');
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Forgot Password</Text>
            <Text style={styles.modalSubtitle}>
              Enter your registered Email ID to receive password reset instructions.
            </Text>

            <CustomInput
              label="Email ID"
              placeholder="Enter email ID"
              value={forgotEmail}
              onChangeText={handleForgotEmailChange}
              error={forgotEmailError}
              variant="underlined"
              leftIcon={<Mail size={18} color={COLORS.muted} />}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setForgotModalVisible(false);
                  setForgotEmail('');
                  setForgotEmailError('');
                }}
                disabled={forgotLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleForgotPassword}
                disabled={forgotLoading}
                activeOpacity={0.7}
              >
                {forgotLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
