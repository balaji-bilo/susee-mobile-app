import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import React from 'react';
import { storeEncryptedData, retrieveEncryptedData } from '../../common/config/storage';
import axios from 'axios';
import { base_url, save_fcm_token } from '../../common/config/constant';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { navigationRef } from '../../common/navigation/navigationRef';
export { navigationRef };

const requestNotificationPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Error requesting POST_NOTIFICATIONS permission:', err);
      return false;
    }
  }
  return true;
};

export const getFcmToken = async () => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      const token = await messaging().getToken();
      console.log('FCM Device Token retrieved:', token);

      await storeEncryptedData('fcm_token', token);
      global.fcm_token = token;
      return token;
    } else {
      console.log('FCM authorization status not enabled');
    }
  } catch (error) {
    console.warn('FCM token not available on this device/emulator:', error?.message || error);
  }
  return null;
};

export const notification_redirection = async (data = {}) => {
  console.log('Handling notification click, redirecting to Notification screen with data:', data);

  const navToNotification = () => {
    if (navigationRef.isReady && navigationRef.isReady()) {
      navigationRef.navigate('Notification', { data });
    } else if (navigationRef.current) {
      navigationRef.current.navigate('Notification', { data });
    } else {
      console.warn('Navigation reference is not ready yet, retrying in 500ms...');
      setTimeout(() => {
        if (navigationRef.isReady && navigationRef.isReady()) {
          navigationRef.navigate('Notification', { data });
        } else if (navigationRef.current) {
          navigationRef.current.navigate('Notification', { data });
        }
      }, 500);
    }
  };

  navToNotification();
};

const setupNotificationChannel = async () => {
  try {
    await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      badge: true,
    });
  } catch (err) {
    console.warn('Error setting up notification channel:', err);
  }
};

let isListenersAttached = false;
let memoryDeviceId = null;
const recentMessageCache = new Map();

const listenToMessages = () => {
  if (isListenersAttached) {
    console.log('[NotificationService] Listeners already attached, skipping duplicate attachment.');
    return;
  }
  isListenersAttached = true;

  messaging().onMessage(async (remoteMessage) => {
    console.log('Foreground notification received:', remoteMessage);

    if (remoteMessage.notification) {
      try {
        const notifId = remoteMessage.data?.notificationId
          ? `dvsos_${remoteMessage.data.notificationId}`
          : (remoteMessage.messageId || `dvsos_${Date.now()}`);

        const now = Date.now();
        // Check if recently handled within 15 seconds
        if (recentMessageCache.has(notifId)) {
          const lastTime = recentMessageCache.get(notifId);
          if (now - lastTime < 15000) {
            console.log('[NotificationService] Ignoring duplicate notification payload:', notifId);
            return;
          }
        }
        recentMessageCache.set(notifId, now);

        // Keep cache bounded
        if (recentMessageCache.size > 50) {
          for (const [k, time] of recentMessageCache.entries()) {
            if (now - time > 60000) recentMessageCache.delete(k);
          }
        }

        await notifee.requestPermission();
        await setupNotificationChannel();

        await notifee.displayNotification({
          id: notifId,
          title: remoteMessage.notification.title,
          body: remoteMessage.notification.body,
          android: {
            channelId: 'default',
            importance: AndroidImportance.HIGH,
            smallIcon: 'ic_stat_notification',
            tag: notifId,
            pressAction: {
              id: 'default',
            },
          },
          data: remoteMessage.data || {},
        });
      } catch (error) {
        console.error('Error displaying local foreground notification:', error);
      }
    }
  });

  notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      console.log('User pressed foreground notification:', detail.notification);
      notification_redirection(detail.notification?.data || {});
    }
  });

  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('Notification clicked from background state:', remoteMessage);
    notification_redirection(remoteMessage?.data || {});
  });

  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('Notification clicked from quit/terminated state:', remoteMessage);
        setTimeout(() => {
          notification_redirection(remoteMessage?.data || {});
        }, 1000);
      }
    });

  messaging().onTokenRefresh(async (newToken) => {
    console.log('FCM Token refreshed:', newToken);
    await storeEncryptedData('fcm_token', newToken);
    global.fcm_token = newToken;
    await sendTokenToBackend(newToken);
  });
};

const getOrCreateDeviceId = async () => {
  if (memoryDeviceId) return memoryDeviceId;
  try {
    let deviceId = await retrieveEncryptedData('deviceId');
    if (!deviceId) {
      deviceId = 'dev-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
      await storeEncryptedData('deviceId', deviceId);
    }
    memoryDeviceId = deviceId;
    return deviceId;
  } catch (err) {
    console.error('Error in getOrCreateDeviceId:', err);
    memoryDeviceId = memoryDeviceId || ('dev-fallback-' + Date.now());
    return memoryDeviceId;
  }
};

export const sendTokenToBackend = async (fcmToken) => {
  try {
    if (!fcmToken) {
      console.log('sendTokenToBackend: fcmToken missing');
      return;
    }
    const token = await retrieveEncryptedData('token');
    const deviceId = await getOrCreateDeviceId();
    const payload = {
      token: fcmToken,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      deviceId: deviceId
    };
    console.log('Sending FCM token to backend with payload:', payload);
    const response = await axios.post(`${base_url}${save_fcm_token}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    console.log('FCM token sent to backend response:', response.data);
  } catch (error) {
    console.error('Error sending FCM token to backend:', error?.response?.data || error?.message);
  }
};

export const registerToken = async (userId) => {
  try {
    const fcmToken = await getFcmToken();
    if (fcmToken) {
      await sendTokenToBackend(fcmToken);
    }
  } catch (error) {
    console.error('Error during token registration:', error);
  }
};

export const NotificationService = {
  init: async () => {
    try {
      const granted = await requestNotificationPermission();
      await setupNotificationChannel();
      if (granted) {
        const fcmToken = await getFcmToken();
        if (fcmToken) {
          await sendTokenToBackend(fcmToken);
        }
        listenToMessages();
      } else {
        console.log('Notification permission denied by user.');
      }
    } catch (err) {
      console.error('Error during NotificationService initialization:', err);
    }
  },
  registerToken,
};
