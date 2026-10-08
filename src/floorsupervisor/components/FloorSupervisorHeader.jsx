import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-simple-toast';
import axios from 'axios';
import { fonts, colors } from '../../common/config/theme';
import { retrieveEncryptedData } from '../../common/config/storage';
import { base_url, notification_count } from '../../common/config/constant';

export function FloorSupervisorHeader({ title, subtitle: propSubtitle, navigation: propNavigation }) {
  const hookNavigation = useNavigation();
  const navigation = propNavigation || hookNavigation;
  const [dynamicSubtitle, setDynamicSubtitle] = useState(propSubtitle || '');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = await retrieveEncryptedData('token');
      if (!token) return;

      const response = await axios.get(`${base_url}${notification_count}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success && response.data.data) {
        const count = response.data.data.count ?? 0;
        setUnreadCount(Number(count) || 0);
      }
    } catch (err) {
      console.warn('Error fetching unread notification count in header:', err?.message);
    }
  }, []);

  useEffect(() => {
    async function fetchRole() {
      try {
        const role = await retrieveEncryptedData('roleName');
        if (role) {
          const formattedRole = role
            .replace(/[-_]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
          
          setDynamicSubtitle(`${formattedRole} Workspace`);
        }
      } catch (error) {
        console.error('Error fetching role for header:', error);
      }
    }
    fetchRole();
    fetchUnreadCount();

    if (navigation && typeof navigation.addListener === 'function') {
      const unsubscribe = navigation.addListener('focus', () => {
        fetchUnreadCount();
      });
      return unsubscribe;
    }
  }, [navigation, fetchUnreadCount]);

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
        {dynamicSubtitle ? <Text style={styles.screenSubtitle}>{dynamicSubtitle}</Text> : null}
      </View>

      {/* Notification Bell Icon with Live Badge */}
      <TouchableOpacity
        style={styles.notifBtn}
        activeOpacity={0.7}
        onPress={handleNotificationPress}
      >
        <Bell size={19} color="#0F172A" />
        {unreadCount > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
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
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: fonts.inter,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
});

