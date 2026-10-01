import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ScrollView, RefreshControl, ActivityIndicator, Modal, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../common/config/theme';
import notificationStyles from '../styles/notificationStyles';
import { ChevronLeft, BellOff, Info, AlertTriangle, Clock, Check, Phone } from 'lucide-react-native';
import { base_url, notification_list, notification_marked } from '../../common/config/constant';
import { retrieveEncryptedData } from '../../common/config/storage';
import axios from 'axios';
import { NotificationSkeleton } from '../components/loading/NotificationSkeleton';
import { useFocusEffect } from '@react-navigation/native';

const formatWaitingTime = (mins) => {
  const m = mins || 0;
  if (m >= 60) {
    const hrs = Math.floor(m / 60);
    const remainingMins = m % 60;
    return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`;
  }
  return `${m}m`;
};

const extractVehicleNumber = (message) => {
  if (!message) return 'N/A';

  // Try to match standard Indian vehicle number format like TN01AB1234
  const indMatch = message.match(/\b([A-Z]{2}[- ]?[0-9]{1,2}[- ]?[A-Z]{0,3}[- ]?[0-9]{4})\b/i);
  if (indMatch) return indMatch[1].toUpperCase().replace(/[- ]/g, '');

  // Try to match anything after "for " but ignore if it's the word "delivery" or "completed"
  const match = message.match(/for\s+([A-Z0-9]{4,15})/i);
  if (match) {
    const matchedWord = match[1].toLowerCase();
    if (!matchedWord.includes('delivery') && !matchedWord.includes('completed')) {
      return match[1].toUpperCase();
    }
  }

  return 'N/A';
};

const defaultMockNotifications = [
  {
    id: 'notif-1',
    type: 'warning',
    isFinished: false,
    isReadyForDelivery: false,
    buttonText: 'View Job Card',
    vehicleNumber: 'TN 78 UI 9012',
    customerMobile: '8523691476',
    serviceType: 'MECHANICAL ASSIGNED',
    title: 'New Mechanic Assigned',
    message: 'Technician Sakthivel assigned to TN 78 UI 9012 for Armrest Service.',
    waitingTime: '12m',
    waitTime: 12,
    isRead: false,
    rawItem: {
      id: 'JC0052',
      vehicle: { registrationNumber: 'TN 78 UI 9012' },
      entryType: 'SERVICE',
    },
  },
  {
    id: 'notif-2',
    type: 'warning',
    isFinished: false,
    isReadyForDelivery: false,
    buttonText: 'Review Additional Work',
    vehicleNumber: 'TN 00 HJ 6789',
    customerMobile: '7415823690',
    serviceType: 'ADDITIONAL WORK REQUESTED',
    title: 'Additional Work Approval Required',
    message: 'Brake shoe replacement requested for TN 00 HJ 6789 (Estimated ₹800).',
    waitingTime: '25m',
    waitTime: 25,
    isRead: false,
    rawItem: {
      id: 'JC0043',
      vehicle: { registrationNumber: 'TN 00 HJ 6789' },
      entryType: 'ADDITIONAL WORK',
    },
  },
  {
    id: 'notif-3',
    type: 'success',
    isFinished: true,
    isReadyForDelivery: true,
    buttonText: 'Ready for Delivery',
    vehicleNumber: 'TN 89 KL 7890',
    customerMobile: '7412589630',
    serviceType: 'BODY SHOP COMPLETED',
    title: 'Body Shop Painting Finished',
    message: 'Bumper painting completed for TN 89 KL 7890. Vehicle ready for inspection.',
    waitingTime: '45m',
    waitTime: 45,
    isRead: true,
    rawItem: {
      id: 'JC0044',
      vehicle: { registrationNumber: 'TN 89 KL 7890' },
      entryType: 'BODY SHOP',
    },
  },
  {
    id: 'notif-4',
    type: 'warning',
    isFinished: false,
    isReadyForDelivery: false,
    buttonText: 'View Job Card',
    vehicleNumber: 'TN 01 AB 1234',
    customerMobile: '9638527412',
    serviceType: 'MECHANICAL IN PROGRESS',
    title: 'Periodic Service Started',
    message: 'Oil filter change in progress at Bay Test001 for TN 01 AB 1234.',
    waitingTime: '1h 10m',
    waitTime: 70,
    isRead: true,
    rawItem: {
      id: 'JC0035',
      vehicle: { registrationNumber: 'TN 01 AB 1234' },
      entryType: 'PERIODIC SERVICE',
    },
  },
];

export function NotificationScreen({ navigation }) {
  const [notifications, setNotifications] = useState(defaultMockNotifications);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('unread');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tabCounts, setTabCounts] = useState({ all: 4, unread: 2 });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      setActiveTab('unread');
    }, [])
  );

  const fetchWaitingQueue = async (showLoadingIndicator = true, tab = activeTab, pageNum = 1) => {
    const unreadParam = tab === 'unread' ? '&unreadOnly=true' : '';
    console.log(`Fetching notifications: ${base_url}${notification_list}?page=${pageNum}${unreadParam}`);

    if (showLoadingIndicator && pageNum === 1) {
      setLoading(true);
    } else if (pageNum > 1) {
      setLoadingMore(true);
    }

    const filterMock = (t) => t === 'unread' ? defaultMockNotifications.filter(n => !n.isRead) : defaultMockNotifications;

    try {
      const token = await retrieveEncryptedData('token');
      const response = await axios.get(`${base_url}${notification_list}?page=${pageNum}${unreadParam}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Notification Response Data:', response.data);

      if (response.data && response.data.success && response.data.data?.notifications && response.data.data.notifications.length > 0) {
        const mapped = response.data.data.notifications
          .map(item => {
            let parsedVehicleNo = extractVehicleNumber(item.message);
            if (item.gateEntry?.vehicle?.registrationNumber) parsedVehicleNo = item.gateEntry.vehicle.registrationNumber;
            else if (item.jobCard?.vehicle?.registrationNumber) parsedVehicleNo = item.jobCard.vehicle.registrationNumber;
            else if (item.vehicle?.registrationNumber) parsedVehicleNo = item.vehicle.registrationNumber;

            const createdDate = item.createdAt ? new Date(item.createdAt) : new Date();
            const now = new Date();
            const diffMins = Math.max(0, Math.floor((now - createdDate) / (1000 * 60)));

            const title = item.title || 'Notification';
            const message = item.message || '';
            const itemType = item.type || '';

            const isCompleted = itemType === 'COMPLETION_ALERT' || title.toLowerCase().includes('completed');
            const isReadyForDelivery = itemType === 'READY_FOR_DELIVERY_ALERT' || title.toLowerCase().includes('ready for delivery');

            const isFinished = isCompleted || isReadyForDelivery;

            let type = isFinished ? 'success' : 'warning';
            let statusText = title.toUpperCase();

            let buttonText = 'Create Job Card';
            if (isReadyForDelivery) buttonText = 'Ready for Delivery';
            else if (isCompleted) buttonText = 'Completed';

            return {
              id: String(item.id),
              type,
              isFinished,
              isReadyForDelivery,
              buttonText,
              vehicleNumber: parsedVehicleNo,
              customerMobile: item.gateEntry?.customer?.mobileNo || '',
              serviceType: statusText,
              title,
              message,
              waitingTime: formatWaitingTime(diffMins),
              waitTime: diffMins,
              rawItem: {
                id: item.gateEntryId || item.id,
                gateEntryId: item.gateEntryId,
                vehicle: {
                  registrationNumber: parsedVehicleNo
                },
                customer: item.gateEntry?.customer ? {
                  name: '',
                  mobileNo: item.gateEntry.customer.mobileNo || '',
                  alternateMobileNo: item.gateEntry.customer.alternateMobileNo || ''
                } : undefined,
                entryType: item.gateEntry?.entryType || 'SERVICE'
              }
            };
          })
          .sort((a, b) => a.waitTime - b.waitTime);

        setNotifications(prev => {
          const combined = pageNum === 1 ? mapped : [...prev, ...mapped];
          combined.sort((a, b) => a.waitTime - b.waitTime);
          return combined;
        });

        let hasMoreData = false;
        if (response.data.data.pagination) {
          const totalCount = response.data.data.pagination.total;
          setTabCounts(prev => ({ ...prev, [tab]: totalCount }));
          hasMoreData = pageNum < response.data.data.pagination.totalPages;
          setHasMore(hasMoreData);
        } else {
          hasMoreData = response.data.data.notifications.length > 0;
          setHasMore(hasMoreData);
        }
      } else if (pageNum === 1) {
        setNotifications(filterMock(tab));
        setHasMore(false);
      }
    } catch (error) {
      console.log('Error fetching notifications, loading static mock fallback');
      if (pageNum === 1) {
        setNotifications(filterMock(tab));
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWaitingQueue(true, 'unread', 1);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchWaitingQueue(false, activeTab, 1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setNotifications([]);
    fetchWaitingQueue(true, tab, 1);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchWaitingQueue(false, activeTab, nextPage);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 20 }} />;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const handleMarkAsRead = async (id) => {
    try {
      const token = await retrieveEncryptedData('token');
      const response = await axios.put(`${base_url}${notification_marked}/${id}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Notification marked as read response:', response.data);
    } catch (error) {
      console.error('Error marking notification as read:', error?.response?.data || error?.message);
    } finally {
      fetchWaitingQueue(false);
    }
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(iconScaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      setModalVisible(false);
    });
  };

  const handleCardPress = (item) => {
    if (activeTab === 'unread') {
      handleMarkAsRead(item.id);
    }

    setSelectedNotification({
      title: item.title,
      message: item.message,
      vehicleNumber: item.vehicleNumber,
      entryType: item.serviceType
    });
    setModalVisible(true);

    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    iconScaleAnim.setValue(0);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(iconScaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      })
    ]).start();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={16} color="#D97706" />;
      case 'success':
        return <Check size={16} color="#10B981" />;
      default:
        return <Info size={16} color={colors.primary} />;
    }
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'warning':
        return { bg: '#FFF7ED', border: '#D97706' };
      case 'success':
        return { bg: '#ECFDF5', border: '#10B981' };
      default:
        return { bg: colors.primarySoft, border: colors.primary };
    }
  };

  const getDynamicTitleColor = (title) => {
    const t = (title || '').toLowerCase();
    if (t.includes('delayed')) {
      return { bg: '#FEE2E2', text: '#DC2626' };
    }
    if (t.includes('completed') || t.includes('ready for delivery')) {
      return { bg: '#D1FAE5', text: '#059669' };
    }
    if (t.includes('waiting')) {
      return { bg: '#FEF3C7', text: '#D97706' };
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Queue Alerts</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'all' && styles.activeTabButton]}
          onPress={() => handleTabChange('all')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'all' && styles.activeTabButtonText]}>
            All Notification {tabCounts.all !== null ? `(${tabCounts.all})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'unread' && styles.activeTabButton]}
          onPress={() => handleTabChange('unread')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'unread' && styles.activeTabButtonText]}>
            Unread {tabCounts.unread !== null ? `(${tabCounts.unread})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && notifications.length === 0 ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <NotificationSkeleton />
        </ScrollView>
      ) : notifications.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCircle}>
              <BellOff size={32} color={colors.mutedText} />
            </View>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>You have no notifications in this list.</Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, index) => item.id + '-' + index}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          renderItem={({ item }) => {
            const badge = getBadgeStyle(item.type);
            const badgeColor = item.type === 'warning' ? '#D97706' : item.type === 'success' ? '#10B981' : colors.primary;
            return (
              <View style={styles.notificationCard}>
                <TouchableOpacity
                  onPress={() => handleCardPress(item)}
                  activeOpacity={0.7}
                >
                  {/* Header: Status, Vehicle and Service details */}
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconCircle, { backgroundColor: badge.bg }]}>
                      {getIcon(item.type)}
                    </View>
                    <View style={styles.headerInfo}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.vehicleNumber}>{item.vehicleNumber}</Text>
                          <View style={[
                            styles.serviceBadge,
                            getDynamicTitleColor(item.title) && { backgroundColor: getDynamicTitleColor(item.title).bg }
                          ]}>
                            <Text style={[
                              styles.serviceText,
                              getDynamicTitleColor(item.title) && { color: getDynamicTitleColor(item.title).text }
                            ]}>{item.serviceType}</Text>
                          </View>
                        </View>

                        {item.customerMobile ? (
                          <View style={styles.customerMobileContainer}>
                            <Phone size={11} color={colors.mutedText} />
                            <Text style={styles.customerMobileText}>{item.customerMobile}</Text>
                          </View>
                        ) : null}
                        {item.message ? (
                          <Text style={{ fontSize: 12, color: colors.mutedText, marginTop: 4, fontStyle: 'italic' }} numberOfLines={1}>
                            {item.message}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.waitingBadge}>
                      <Clock size={11} color={badgeColor} />
                      <Text style={[styles.waitingLabel, { color: badgeColor }]}>
                        {item.waitingTime}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* Detail Modal Popup */}
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity activeOpacity={1} onPress={() => undefined} style={{ width: '100%', alignItems: 'center' }}>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                }
              ]}
            >
              <Animated.View style={[styles.modalIconContainer, { transform: [{ scale: iconScaleAnim }] }]}>
                <Check size={24} color="#1F8E57" />
              </Animated.View>
              <Text style={styles.modalTitle}>{selectedNotification?.title}</Text>

              {/* Notification details */}
              <View style={styles.modalInfoContainer}>
                {selectedNotification?.message ? (
                  <Text style={{ fontSize: 14, color: colors.text, textAlign: 'center', marginBottom: 12, lineHeight: 20 }}>
                    {selectedNotification.message}
                  </Text>
                ) : null}
                <Text style={styles.modalInfoLabel}>
                  Vehicle Number: <Text style={styles.modalInfoValue}>{selectedNotification?.vehicleNumber}</Text>
                </Text>
                <Text style={styles.modalInfoLabel}>
                  Entry Type: <Text style={styles.modalInfoValue}>{selectedNotification?.entryType}</Text>
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalButton}
                activeOpacity={0.8}
                onPress={closeModal}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = notificationStyles;
