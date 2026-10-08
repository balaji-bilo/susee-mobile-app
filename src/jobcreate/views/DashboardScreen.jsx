import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { FlatList, StatusBar, Text, TextInput, View, useWindowDimensions, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Car, Clock, ClipboardCheck, Bell } from 'lucide-react-native';
import { Card } from '../../common/components/Card';
import { colors, spacing } from '../../common/config/theme';
import styles from '../styles/dashboardStyles';
import { base_url, job_card, notification_count } from '../../common/config/constant';
import { retrieveEncryptedData, storeEncryptedData } from '../../common/config/storage';
import axios from 'axios';
import { DashboardSkeleton } from '../components/loading/DashboardSkeleton';

const formatVehicleNumber = (num) => {
  if (!num) return '';
  const clean = num.replace(/\s+/g, '').toUpperCase();
  const match = clean.match(/^([A-Z]{2})([0-9]{2})([A-Z]{1,3})([0-9]{1,4})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }
  return clean;
};

const formatWaitingTime = (mins) => {
  const m = mins || 0;
  if (m >= 60) {
    const hrs = Math.floor(m / 60);
    const remainingMins = m % 60;
    return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`;
  }
  return `${m}m`;
};

export function DashboardScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const sortOrder = 'asc';
  const [queueList, setQueueList] = useState([]);
  const [statsData, setStatsData] = useState({ total: 0, waiting: 0, active: 0 });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [navigatingId, setNavigatingId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const isTablet = width > 768;

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
      console.warn('Error fetching unread count on dashboard:', err?.message);
    }
  }, []);

  useEffect(() => {
    fetchQueue(true);
    fetchUnreadCount();

    // Refresh queue when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchQueue(true);
      fetchUnreadCount();
      setNavigatingId(null);
    });
    return unsubscribe;
  }, [navigation, fetchUnreadCount]);

  const fetchQueue = async (isRefreshing = false) => {
    console.log(`${base_url}${job_card}`);
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const token = await retrieveEncryptedData('token');
      let allEntries = [];
      let page = 1;
      let totalPages = 1;
      let summaryData = null;

      do {
        const response = await axios.get(`${base_url}${job_card}`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            page: page
          }
        });
        console.log(`Job Card Queue Response (Page ${page}):`, response.data);
        if (response.data && response.data.success && response.data.data) {
          const { entries, summary } = response.data.data;
          if (entries && entries.length > 0) {
            allEntries = [...allEntries, ...entries];
          }
          if (summary) {
            summaryData = summary;
          }
          const meta = response.data.meta;
          totalPages = meta?.totalPages || 1;
          page++;
        } else {
          break;
        }
      } while (page <= totalPages && page <= 50);

      // Save taxRate to encrypted storage if available in entries
      if (allEntries.length > 0) {
        const firstEntry = allEntries[0];
        if (firstEntry.location && firstEntry.location.taxRate !== undefined) {
          try {
            await storeEncryptedData('taxRate', String(firstEntry.location.taxRate));
          } catch (err) {
            console.error('Error saving taxRate to storage:', err);
          }
        }
      }

      const mappedEntries = allEntries.map(item => ({
        id: String(item.id),
        vehicleNumber: item.vehicle?.registrationNumber || '',
        ownerName: item.customer?.name || '',
        vehicleModel: item.vehicle?.model || '',
        waitingMinutes: item.waitingMinutes || 0,
        waitingTime: formatWaitingTime(item.waitingMinutes),
        entryType: item.entryType || 'service',
        gateEntryId: item.gateEntryId || item.id,
        make: item.vehicle?.make || '',
        variant: item.vehicle?.variant || '',
        fuelType: item.vehicle?.fuelType || '',
        color: item.vehicle?.color || '',
        chassisNo: item.vehicle?.chassisNo || '',
        engineNo: item.vehicle?.engineNo || '',
        mobileNumber: item.customer?.mobileNo || '',
        alternateNumber: item.customer?.alternateMobileNo || '',
        email: item.customer?.emailId || '',
        address: item.customer?.address || '',
        taxRate: item.location?.taxRate !== undefined ? item.location.taxRate : 10,
        rawItem: item
      }));
      console.log('Mapped Entries:', mappedEntries);

      setQueueList(mappedEntries);
      setStatsData({
        total: summaryData?.totalQueue || 0,
        waiting: summaryData?.waiting || 0,
        active: summaryData?.active || 0
      });
    } catch (error) {
      console.error('Error fetching job card queue:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    await Promise.all([
      fetchQueue(true),
      fetchUnreadCount()
    ]);
  }, []);

  const filteredVehicles = useMemo(() => {
    const list = queueList.filter((vehicle) => {
      const matchesQuery =
        !query ||
        [vehicle.vehicleNumber, vehicle.ownerName, vehicle.vehicleModel].some((field) =>
          field && field.toLowerCase().includes(query.toLowerCase())
        );
      return matchesQuery;
    });
    return list.sort((a, b) =>
      sortOrder === 'asc' ? a.waitingMinutes - b.waitingMinutes : b.waitingMinutes - a.waitingMinutes
    );
  }, [queueList, query, sortOrder]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Vehicle Service</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notification')}
            style={styles.notificationButton}
            activeOpacity={0.7}
          >
            <Bell size={18} color={colors.primary} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {loading && queueList.length === 0 ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Enhanced individual stats cards */}
            <View style={styles.statsRow}>
              {/* Card 1: Total Queue */}
              <View style={[styles.statsCardTotal, isTablet && { padding: 16 }]}>
                <View style={styles.statsInfoGroup}>
                  <Text style={styles.statsValue}>{statsData.total}</Text>
                  <Text numberOfLines={1} style={styles.statsLabel}>Total Queue</Text>
                </View>
                <View style={[styles.statsIconContainer, { backgroundColor: 'rgba(15, 92, 150, 0.08)' }]}>
                  <Car size={15} color={colors.primary} />
                </View>
              </View>

              {/* Card 2: Waiting */}
              <View style={[styles.statsCardWaiting, isTablet && { padding: 16 }]}>
                <View style={styles.statsInfoGroup}>
                  <Text style={styles.statsValue}>{statsData.waiting}</Text>
                  <Text numberOfLines={1} style={styles.statsLabel}>Waiting</Text>
                </View>
                <View style={[styles.statsIconContainer, { backgroundColor: 'rgba(217, 119, 6, 0.08)' }]}>
                  <Clock size={15} color="#D97706" />
                </View>
              </View>

              {/* Card 3: Active */}
              <View style={[styles.statsCardActive, isTablet && { padding: 16 }]}>
                <View style={styles.statsInfoGroup}>
                  <Text style={styles.statsValue}>{statsData.active}</Text>
                  <Text numberOfLines={1} style={styles.statsLabel}>Active</Text>
                </View>
                <View style={[styles.statsIconContainer, { backgroundColor: 'rgba(13, 148, 136, 0.08)' }]}>
                  <ClipboardCheck size={15} color="#0D9488" />
                </View>
              </View>
            </View>

            {/* Vehicle List Card */}
            <Card style={styles.listCard}>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                  <Search size={16} color="#94A3B8" />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search Car No, Model, Owner..."
                    placeholderTextColor="#94A3B8"
                    style={styles.searchInput}
                  />
                </View>
              </View>

              {/* Scrollable List of Cards matching the user's design */}
              <FlatList
                key={isTablet ? 'tablet-grid' : 'mobile-list'}
                data={filteredVehicles}
                keyExtractor={(item) => item.id}
                numColumns={isTablet ? 3 : 1}
                columnWrapperStyle={isTablet ? { justifyContent: 'flex-start', gap: 12 } : null}
                contentContainerStyle={isTablet ? { paddingBottom: 120 } : { gap: spacing.sm, paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[colors.primary]}
                  />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                      <Car size={28} color={colors.mutedText} />
                    </View>
                    <Text style={styles.emptyTitle}>All Caught Up!</Text>
                    <Text style={styles.emptySubtitle}>
                      No vehicles are currently waiting in the queue.
                    </Text>
                  </View>
                }
                renderItem={({ item: vehicle }) => {
                  const entryType = vehicle.entryType || (vehicle.id === '2' ? 'Pickup' : vehicle.id === '3' ? 'Enquiry' : 'Service');
                  const typeStyle =
                    entryType.toLowerCase() === 'pickup'
                      ? { bg: '#ECFDF5', text: '#059669' }
                      : entryType.toLowerCase() === 'enquiry'
                        ? { bg: '#FFF7ED', text: '#D97706' }
                        : { bg: '#EFF6FF', text: '#2563EB' };

                  return isTablet ? (
                    <View style={styles.tabletCard}>
                      {/* Row 1: Entry Type Badge & Waiting Time */}
                      <View style={styles.tabletCardHeader}>
                        <View style={[styles.entryBadge, { backgroundColor: typeStyle.bg }]}>
                          <View style={[styles.entryBadgeDot, { backgroundColor: typeStyle.text }]} />
                          <Text style={[styles.entryBadgeText, { color: typeStyle.text }]}>
                            {entryType}
                          </Text>
                        </View>
                        <View style={styles.waitingBadge}>
                          <Clock size={11} color={vehicle.waitingMinutes > 20 ? colors.danger : colors.mutedText} />
                          <Text style={[styles.waitingText, { color: vehicle.waitingMinutes > 20 ? colors.danger : colors.text }]}>
                            Waiting: <Text style={styles.waitingBold}>{vehicle.waitingTime}</Text>
                          </Text>
                        </View>
                      </View>

                      {/* Row 2: License Plate (Styled Badge) */}
                      <View style={styles.plateContainerTablet}>
                        <Text style={styles.plateTextTablet}>
                          {formatVehicleNumber(vehicle.vehicleNumber)}
                        </Text>
                      </View>

                      {/* Row 3: Full-Width Button */}
                      <TouchableOpacity
                        onPress={async () => {
                          setNavigatingId(vehicle.id);
                          if (vehicle.taxRate !== undefined) {
                            await storeEncryptedData('taxRate', String(vehicle.taxRate));
                          }
                          navigation.navigate('JobCardWizard', { selectedVehicle: vehicle });
                        }}
                        disabled={navigatingId !== null}
                        style={[styles.actionButtonTablet, navigatingId === vehicle.id && { opacity: 0.8 }]}
                      >
                        {navigatingId === vehicle.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <ClipboardCheck size={14} color="#FFFFFF" />
                            <Text style={styles.actionButtonTextTablet}>
                              Create Job Card
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    // MOBILE VIEW (Vertically Compressed Single-Row Layout)
                    <View style={[styles.mobileRowContainer, { borderLeftWidth: 4, borderLeftColor: vehicle.waitingMinutes > 20 ? colors.danger : colors.primary }]}>
                      {/* Left Column: License Plate, Entry Type Badge & Waiting Time in horizontal group */}
                      <View style={styles.mobileLeftGroup}>
                        {/* License Plate Badge */}
                        <View style={styles.plateContainerMobile}>
                          <Text style={styles.plateTextMobile}>
                            {formatVehicleNumber(vehicle.vehicleNumber)}
                          </Text>
                        </View>

                        {/* Middle Info Column: Entry Type & Waiting Time stacked */}
                        <View style={styles.mobileMiddleInfo}>
                          <View style={[styles.entryBadgeMobile, { backgroundColor: typeStyle.bg }]}>
                            <View style={[styles.entryBadgeDotMobile, { backgroundColor: typeStyle.text }]} />
                            <Text style={[styles.entryBadgeTextMobile, { color: typeStyle.text }]}>
                              {entryType}
                            </Text>
                          </View>

                          <View style={styles.waitingBadgeMobile}>
                            <Clock size={9} color={vehicle.waitingMinutes > 20 ? colors.danger : colors.mutedText} />
                            <Text
                              style={[styles.waitingTextMobile, { color: vehicle.waitingMinutes > 20 ? colors.danger : colors.mutedText }]}
                              numberOfLines={1}
                              adjustsFontSizeToFit
                              minimumFontScale={0.8}
                            >
                              Waiting: <Text style={styles.waitingBoldMobile}>{vehicle.waitingTime}</Text>
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Create Job Card Action Button */}
                      <TouchableOpacity
                        onPress={async () => {
                          setNavigatingId(vehicle.id);
                          if (vehicle.taxRate !== undefined) {
                            await storeEncryptedData('taxRate', String(vehicle.taxRate));
                          }
                          navigation.navigate('JobCardWizard', { selectedVehicle: vehicle });
                        }}
                        disabled={navigatingId !== null}
                        style={[styles.actionButtonMobile, navigatingId === vehicle.id && { opacity: 0.8 }]}
                      >
                        {navigatingId === vehicle.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <ClipboardCheck size={12} color="#FFFFFF" />
                            <Text style={styles.actionButtonTextMobile}>
                              Create Job Card
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            </Card>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
