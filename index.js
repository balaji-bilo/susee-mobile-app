/**
 * @format
 */

import 'react-native-get-random-values';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App.jsx';
import { name as appName } from './app.json';

// Register background message handler at top-level for headless JS
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Background/Quit FCM message received:', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);

