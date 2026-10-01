import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Search,
  FilePlus,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Wrench,
  FileText,
  Calendar,
} from 'lucide-react-native';
import { colors, fonts } from '../../common/config/theme';
import { FloorSupervisorHeader } from '../components/FloorSupervisorHeader';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { base_url, mobile_additional_work_list } from '../../common/config/constant';
import { retrieveEncryptedData } from '../../common/config/storage';

function formatVehicleNumber(num) {
  if (!num) return '';
  const clean = num.replace(/\s+/g, '').toUpperCase();
  const match = clean.match(/^([A-Z]{2})([0-9]{2})([A-Z]{1,3})([0-9]{1,4})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }
  return clean;
}

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CardSkeleton = () => {
  return (
    <View style={[styles.newCard, { padding: 0, marginBottom: 9 }]}>
      <View style={[styles.cardTopHeader, { backgroundColor: '#F8FAFC' }]}>
        <View style={styles.cardHeaderLeft}>
          <View style={{ width: 60, height: 20, backgroundColor: '#E2E8F0', borderRadius: 4 }} />
          <View style={{ width: 50, height: 20, backgroundColor: '#E2E8F0', borderRadius: 4, marginLeft: 6 }} />
        </View>
        <View style={{ width: 70, height: 20, backgroundColor: '#E2E8F0', borderRadius: 10 }} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.vehicleCustomerRow}>
          <View style={{ width: 100, height: 26, backgroundColor: '#F1F5F9', borderRadius: 4 }} />
          <View style={{ width: 120, height: 32, backgroundColor: '#F1F5F9', borderRadius: 16 }} />
        </View>
        <View style={[styles.servicesBox, { height: 60, backgroundColor: '#F8FAFC', borderColor: '#F1F5F9', borderWidth: 1 }]} />
        <View style={styles.cardFooter}>
          <View style={{ width: 80, height: 20, backgroundColor: '#F1F5F9', borderRadius: 4 }} />
          <View style={{ width: 100, height: 20, backgroundColor: '#F1F5F9', borderRadius: 4 }} />
        </View>
      </View>
    </View>
  );
};

export function AdditionalWorkScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Status Filter Tabs definitions
  const tabs = [
    { key: 'ALL', label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'REJECTED', label: 'Rejected' },
  ];

  // Requests data showing current additional work statuses
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [tabCounts, setTabCounts] = useState({ ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = async (pageNum, isRefresh = false) => {
    try {
      if (pageNum === 1 && !refreshing) setLoading(true);
      else if (!refreshing) setLoadingMore(true);

      const token = await retrieveEncryptedData('token');
      const response = await axios.get(`${base_url}${mobile_additional_work_list}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: pageNum,
          limit: 10,
          search: searchQuery,
          status: selectedStatusFilter
        }
      });

      if (response.data && response.data.success && response.data.data) {
        if (response.data.data.counts) {
          setTabCounts(response.data.data.counts);
        }

        if (response.data.data.requests) {
          const formatted = response.data.data.requests.map(req => ({
            id: req.awId,
            jobCard: req.jobCardId,
            vehicleNo: req.vehicleReg,
            customer: req.customerName,
            initial: req.customerInitials,
            services: Array.isArray(req.requestedServices) ? req.requestedServices.join(', ') : req.requestedServices,
            amount: req.estimatedCost,
            requestedAt: req.date,
            status: req.status
          }));

          if (isRefresh || pageNum === 1) {
            setRequests(formatted);
          } else {
            setRequests(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newItems = formatted.filter(f => !existingIds.has(f.id));
              return [...prev, ...newItems];
            });
          }

          if (formatted.length < 10) {
            setHasMore(false);
          } else {
            setHasMore(true);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching additional work:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchRequests(1, true);
  };

  const isFirstMount = useRef(true);
  const flatListRef = useRef(null);
  const tabsScrollViewRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      setSelectedStatusFilter('ALL');
      setSearchQuery('');
      if (tabsScrollViewRef.current) {
        tabsScrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
      }
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ animated: false, offset: 0 });
      }
    }, [])
  );

  useEffect(() => {
    setPage(1);
    fetchRequests(1, true);
  }, [selectedStatusFilter]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchRequests(1, true);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchRequests(nextPage);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const statusTheme = getStatusColor(item.status);
    const StatusIcon = statusTheme.Icon;
    const serviceItems = typeof item.services === 'string' ? item.services.split(', ') : item.services;

    return (
      <TouchableOpacity
        style={styles.newCard}
        activeOpacity={0.9}
      >
        {/* Top Header Strip inside Card */}
        <View style={[styles.cardTopHeader, { backgroundColor: statusTheme.bg }]}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.reqIdPill}>
              <FileText size={11} color="#475569" style={{ marginRight: 4 }} />
              <Text style={styles.reqIdText}>{item.id}</Text>
            </View>
            <View style={styles.jobTagPill}>
              <Text style={styles.jobTagText}>#{item.jobCard}</Text>
            </View>
          </View>

          {/* Status Pill */}
          <View
            style={[
              styles.statusPill,
              { backgroundColor: statusTheme.pillBg, borderColor: statusTheme.pillBorder },
            ]}
          >
            <StatusIcon size={12} color={statusTheme.primary} />
            <Text style={[styles.statusText, { color: statusTheme.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Card Content Section */}
        <View style={styles.cardBody}>
          {/* Vehicle Number & Customer Info Row */}
          <View style={styles.vehicleCustomerRow}>
            {/* IND License Plate */}
            <View style={styles.indPlateContainer}>
              <View style={styles.indBlueBox}>
                <View style={styles.indDot} />
                <Text style={styles.indText}>IND</Text>
              </View>
              <View style={styles.plateNumberBox}>
                <Text style={styles.plateNumberText}>
                  {formatVehicleNumber(item.vehicleNo)}
                </Text>
              </View>
            </View>

            {/* Customer Profile Pill */}
            <View style={styles.customerPill}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{item.initial}</Text>
              </View>
              <View style={styles.customerTextCol}>
                <Text style={styles.customerLabel}>CUSTOMER</Text>
                <Text style={styles.customerName}>{item.customer}</Text>
              </View>
            </View>
          </View>

          {/* Requested Services Box */}
          <View style={styles.servicesBox}>
            <View style={styles.servicesHeader}>
              <Wrench size={12} color="#64748B" style={{ marginRight: 5 }} />
              <Text style={styles.servicesHeaderLabel}>REQUESTED SERVICES</Text>
            </View>

            <View style={styles.servicesWrap}>
              {serviceItems.map((svc, idx) => (
                <View key={idx} style={styles.serviceChip}>
                  <View style={styles.serviceDot} />
                  <Text style={styles.serviceChipText}>{svc}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Card Footer: Cost & Request Date */}
          <View style={styles.cardFooter}>
            <View style={styles.costCol}>
              <Text style={styles.costLabel}>ESTIMATED COST</Text>
              <Text style={styles.costVal}>
                <Text style={{ fontFamily: fonts.inter }}>₹</Text>{item.amount}
              </Text>
            </View>

            <View style={styles.timeCol}>
              <Calendar size={12} color="#64748B" style={{ marginRight: 4 }} />
              <Text style={styles.timeText}>{item.requestedAt}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return {
          primary: '#10B981',
          bg: '#F0FDF4',
          pillBg: '#ECFDF5',
          pillBorder: '#A7F3D0',
          text: '#047857',
          Icon: CheckCircle,
        };
      case 'Rejected':
        return {
          primary: '#EF4444',
          bg: '#FEF2F2',
          pillBg: '#FEF2F2',
          pillBorder: '#FECACA',
          text: '#B91C1C',
          Icon: XCircle,
        };
      default:
        return {
          primary: '#F59E0B',
          bg: '#FFFDF5',
          pillBg: '#FFFBEB',
          pillBorder: '#FDE68A',
          text: '#B45309',
          Icon: Clock,
        };
    }
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Main Container */}
      <View style={styles.container}>
        <FloorSupervisorHeader title="Additional Work" />

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vehicle, approval ID, job card..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
            <Filter size={16} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Horizontal Filter Pill Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView
            ref={tabsScrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            {tabs.map((tab) => {
              const isActive = selectedStatusFilter === tab.key;
              const count = tabCounts[tab.key] || 0;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabPill, isActive && styles.tabPillActive]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedStatusFilter(tab.key)}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                  <View
                    style={[
                      styles.tabBadge,
                      isActive ? styles.tabBadgeActive : styles.tabBadgeInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        isActive
                          ? styles.tabBadgeTextActive
                          : styles.tabBadgeTextInactive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Work Requests Card List */}
        {loading && page === 1 ? (
          <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 130 + insets.bottom }]} showsVerticalScrollIndicator={false}>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </ScrollView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={requests}
            keyExtractor={(item, index) => item.id + '_' + index.toString()}
            renderItem={renderItem}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 130 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <FilePlus size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>No work requests found</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerTitleCol: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: fonts.interBold,
    color: '#0F172A',
    fontWeight: '800',
  },
  screenSubtitle: {
    fontSize: 12,
    fontFamily: fonts.inter,
    color: '#94A3B8',
    marginTop: 1,
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft || '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  counterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  counterBadgeText: {
    fontSize: 12,
    fontFamily: fonts.interBold,
    color: colors.primary,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.inter,
    color: '#0F172A',
  },
  filterBtn: {
    padding: 4,
  },

  /* Horizontal Filter Tabs */
  tabsContainer: {
    marginBottom: 10,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    elevation: 1,
  },
  tabPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontFamily: fonts.interBold,
    color: '#475569',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabBadgeInactive: {
    backgroundColor: '#F1F5F9',
  },
  tabBadgeText: {
    fontSize: 10,
    fontFamily: fonts.interBold,
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
  tabBadgeTextInactive: {
    color: '#64748B',
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 110,
    gap: 9,
  },

  /* Compact Modern Card Styling */
  newCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reqIdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reqIdText: {
    fontSize: 10.5,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  jobTagPill: {
    backgroundColor: 'rgba(0, 15, 126, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  jobTagText: {
    fontSize: 10.5,
    fontFamily: fonts.interSemiBold,
    color: colors.primary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10.5,
    fontFamily: fonts.interBold,
  },

  cardBody: {
    padding: 10,
  },
  vehicleCustomerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  indPlateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 26,
    borderRadius: 5,
    borderWidth: 1.2,
    borderColor: '#0F172A',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  indBlueBox: {
    width: 20,
    height: '100%',
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 1,
  },
  indDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#F59E0B',
  },
  indText: {
    fontSize: 6.5,
    fontFamily: fonts.interBold,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  plateNumberBox: {
    paddingHorizontal: 7,
    justifyContent: 'center',
  },
  plateNumberText: {
    fontSize: 12,
    fontFamily: fonts.interBold,
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  customerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 11.5,
    fontFamily: fonts.interBold,
    color: '#FFFFFF',
  },
  customerTextCol: {},
  customerLabel: {
    fontSize: 7.5,
    fontFamily: fonts.interBold,
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  customerName: {
    fontSize: 12,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },

  servicesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 8,
  },
  servicesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  servicesHeaderLabel: {
    fontSize: 8.5,
    fontFamily: fonts.interBold,
    color: '#64748B',
    letterSpacing: 0.4,
  },
  servicesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 4,
  },
  serviceDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    backgroundColor: colors.primary,
  },
  serviceChipText: {
    fontSize: 11,
    fontFamily: fonts.interSemiBold,
    color: colors.primary,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  costCol: {},
  costLabel: {
    fontSize: 7.5,
    fontFamily: fonts.interBold,
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  costVal: {
    fontSize: 14,
    fontFamily: fonts.interBold,
    color: '#059669',
    marginTop: 0.5,
  },
  timeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeText: {
    fontSize: 10.5,
    fontFamily: fonts.interMedium,
    color: '#64748B',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.interMedium,
    color: '#94A3B8',
    marginTop: 12,
  },
});


