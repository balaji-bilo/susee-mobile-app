import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-simple-toast';
import { fonts, colors } from '../../common/config/theme';

export function FloorSupervisorHeader({ title, subtitle, navigation: propNavigation }) {
  const hookNavigation = useNavigation();
  const navigation = propNavigation || hookNavigation;

  const insets = useSafeAreaInsets();
  const safeTop = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);
  const topPadding = safeTop + 6;

  const handleNotificationPress = () => {
    if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('Notification');
    } else {
      Toast.show('Notifications', Toast.SHORT);
    }
  };

  return (
    <View style={[styles.headerRow, { paddingTop: topPadding }]}>
      <View style={styles.headerTitleCol}>
        <Text style={styles.screenTitle}>{title}</Text>
        {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
      </View>

      {/* Notification Bell Icon */}
      <TouchableOpacity
        style={styles.notifBtn}
        activeOpacity={0.7}
        onPress={handleNotificationPress}
      >
        <Bell size={19} color="#0F172A" />
        <View style={styles.notifBadgeDot} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleCol: {
    flex: 1,
  },
  screenTitle: {
    fontFamily: fonts.inter,
    fontSize: 20,
    color: colors.primary,
    fontWeight: '700',
  },
  screenSubtitle: {
    fontSize: 12,
    fontFamily: fonts.inter,
    color: '#94A3B8',
    marginTop: 1,
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },
});
