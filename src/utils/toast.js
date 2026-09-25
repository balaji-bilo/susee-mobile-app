import { ToastAndroid, Platform, Alert } from 'react-native';

export const showToast = (message) => {
  const msgString = typeof message === 'string' ? message : (message?.toString() || 'An error occurred');
  if (Platform.OS === 'android') {
    ToastAndroid.show(msgString, ToastAndroid.SHORT);
  } else {
    Alert.alert('Notification', msgString);
  }
};

