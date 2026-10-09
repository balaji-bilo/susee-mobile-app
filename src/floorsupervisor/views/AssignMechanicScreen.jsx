import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  SafeAreaView,
  Modal,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Search,
  Clock,
  ChevronDown,
  ChevronRight,
  Filter,
  AlertTriangle,
  Wrench,
  Shield,
  Layers,
  Bell,
} from 'lucide-react-native';
import { colors, fonts } from '../../common/config/theme';
import { AssignTechnicianModal } from '../components/AssignTechnicianModal';
import { FloorSupervisorHeader } from '../components/FloorSupervisorHeader';
import Toast from 'react-native-simple-toast';
import axios from 'axios';
import { base_url, mobile_assign_mechanic_list } from '../../common/config/constant';
import { retrieveEncryptedData } from '../../common/config/storage';
import { useFocusEffect } from '@react-navigation/native';

function formatVehicleNumber(num) {
  if (!num) return '';
  const clean = num.replace(/\s+/g, '').toUpperCase();
  const match = clean.match(/^([A-Z]{2})([0-9]{2})([A-Z]{1,3})([0-9]{1,4})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }
  return clean;
}

function formatWaitTime(waitTimeStr) {
  if (!waitTimeStr) return '';
  const minsMatch = waitTimeStr.toString().trim().match(/^(\d+)\s*mins?$/i);
  if (minsMatch) {
    const totalMins = parseInt(minsMatch[1], 10);
    if (totalMins < 60) return `${totalMins} mins`;
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return mins > 0 ? `${hours} hr ${mins} mins` : `${hours} hr`;
  }
  return waitTimeStr;
}

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CardSkeleton = () => {
  return (
    <View style={[styles.card, { padding: 0, marginBottom: 16 }]}>
      <View style={[styles.cardHeaderRow, { backgroundColor: '#F8FAFC', padding: 12, borderTopLeftRadius: 12, borderTopRightRadius: 12 }]}>
        <View style={{ width: 100, height: 24, backgroundColor: '#E2E8F0', borderRadius: 4 }} />
        <View style={{ width: 70, height: 20, backgroundColor: '#E2E8F0', borderRadius: 10 }} />
      </View>
      <View style={{ padding: 16 }}>
        <View style={styles.customerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9' }} />
            <View style={{ width: 80, height: 20, backgroundColor: '#F1F5F9', borderRadius: 4, marginLeft: 8 }} />
          </View>
          <View style={{ width: 60, height: 30, backgroundColor: '#F1F5F9', borderRadius: 16 }} />
        </View>
        <View style={{ width: '100%', height: 40, backgroundColor: '#F8FAFC', borderRadius: 4, marginTop: 12 }} />
        <View style={{ width: '80%', height: 20, backgroundColor: '#FEF3C7', borderRadius: 4, marginTop: 12 }} />
        <View style={[styles.actionRow, { marginTop: 16 }]}>
          <View style={{ width: '30%', height: 36, backgroundColor: '#F1F5F9', borderRadius: 4 }} />
          <View style={{ width: '60%', height: 36, backgroundColor: '#E2E8F0', borderRadius: 4 }} />
        </View>
      </View>
    </View>
  );
};

export function AssignMechanicScreen() {
  const insets = useSafeAreaInsets();
  const flatListRef = React.useRef(null);
  const tabsScrollViewRef = React.useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [skipModalVisible, setSkipModalVisible] = useState(false);
  const [selectedJobCardToSkip, setSelectedJobCardToSkip] = useState(null);
  const [skipReason, setSkipReason] = useState('');
  const [isSkipping, setIsSkipping] = useState(false);
  const [activeTab, setActiveTab] = useState('MECHANICAL');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [tabCounts, setTabCounts] = useState({ MECHANICAL: 0, BODY_SHOP: 0 });
  const [refreshing, setRefreshing] = useState(false);

  // Tab definitions
  const tabs = [
    { key: 'MECHANICAL', label: 'Mechanical', dept: 'mechanical' },
    { key: 'BODY_SHOP', label: 'Body Shop', dept: 'body-shop' },
  ];

  const fetchRequests = async (pageNum, isRefresh = false) => {
    try {
      if (pageNum === 1 && !refreshing) setLoading(true);
      else if (!refreshing) setLoadingMore(true);

      const token = await retrieveEncryptedData('token');
      const dept = activeTab === 'BODY_SHOP' ? 'body-shop' : 'mechanical';
      
      const response = await axios.get(`${base_url}${mobile_assign_mechanic_list}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: pageNum,
          limit: 10,
          search: searchQuery,
          department: dept
        }
      });

      if (response.data.success) {
        const { requests: newRequests, counts } = response.data.data;
        
        setTabCounts({
          MECHANICAL: counts.mechanical || 0,
          BODY_SHOP: counts.bodyShop || 0
        });

        if (isRefresh || pageNum === 1) {
          setRequests(newRequests);
        } else {
          setRequests(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newItems = newRequests.filter(f => !existingIds.has(f.id));
            return [...prev, ...newItems];
          });
        }

        if (newRequests.length < 10) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      }
    } catch (error) {
      console.error('Error fetching assign mechanic list:', error);
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

  useFocusEffect(
    React.useCallback(() => {
      setActiveTab('MECHANICAL');
      setSearchQuery('');
      if (tabsScrollViewRef.current) {
        tabsScrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
      }
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: false });
      }
    }, [])
  );

  React.useEffect(() => {
    setPage(1);
    fetchRequests(1, true);
  }, [activeTab]);

  React.useEffect(() => {
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
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const handleOpenAssign = (item) => {
    setSelectedJobCard(item);
    setModalVisible(true);
  };

  const handleOpenSkipModal = (item) => {
    setSelectedJobCardToSkip(item);
    setSkipReason('');
    setSkipModalVisible(true);
  };

  const handleCancelSkip = () => {
    setSkipModalVisible(false);
    setSelectedJobCardToSkip(null);
    setSkipReason('');
  };

  const handleConfirmSkipDept = async () => {
    if (!selectedJobCardToSkip) return;
    if (!skipReason || !skipReason.trim()) {
      Toast.show('Reason is required to skip the department', Toast.SHORT);
      return;
    }
    
    const jobCardId = selectedJobCardToSkip.id;
    const department = activeTab === 'BODY_SHOP' ? 'body-shop' : 'mechanical';

    try {
      setIsSkipping(true);
      const token = await retrieveEncryptedData('token');
      const response = await axios.post(
        `${base_url}/job-cards/${jobCardId}/departments/${department}/skip`,
        { reason: skipReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        Toast.show('Department skipped successfully', Toast.SHORT);
        setSkipModalVisible(false);
        setSelectedJobCardToSkip(null);
        setSkipReason('');
        
        // Refresh the list after skipping
        setPage(1);
        fetchRequests(1, true);
      }
    } catch (error) {
      Toast.show(error?.response?.data?.message || error?.message || 'Failed to skip department', Toast.LONG);
    } finally {
      setIsSkipping(false);
    }
  };

  const handleAssignSuccess = (data) => {
    Toast.show(
      `Assigned ${data.technician} (${data.bay}) to #${data.jobCardNumber}!`,
      Toast.LONG
    );
    setRequests((prev) =>
      prev.filter((item) => item.id !== data.jobCardId)
    );
    // Refresh count on assignment
    fetchRequests(1, true);
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Main Container */}
      <View style={styles.container}>
        <FloorSupervisorHeader title="Assign Mechanic" subtitle="Floor Supervisor Workspace" />

        {/* Search Bar with Filter Icon */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vehicle, owner, job card..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
            <Filter size={16} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Horizontal Department Pill Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView
            ref={tabsScrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const count = tabCounts[tab.key] || 0;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabPill, isActive && styles.tabPillActive]}
                  activeOpacity={0.8}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text
                    style={[styles.tabText, isActive && styles.tabTextActive]}
                  >
                    {tab.label}
                  </Text>
                  <View
                    style={[
                      styles.tabBadge,
                      isActive
                        ? styles.tabBadgeActive
                        : styles.tabBadgeInactive,
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

        {/* Compact Card List Scroll View */}
        {loading && page === 1 ? (
          <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 130 + insets.bottom }]} showsVerticalScrollIndicator={false}>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </ScrollView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={requests}
            keyExtractor={(item, index) => item.id + '_' + index.toString()}
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.scrollContent,
              requests.length === 0
                ? { flexGrow: 1, justifyContent: 'center', paddingBottom: 80 + insets.bottom }
                : { paddingBottom: 130 + insets.bottom },
            ]}
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
                <Text style={styles.emptyTitle}>No Allocations Pending</Text>
                <Text style={styles.emptySubtitle}>
                  No vehicle mechanic assignments pending in this tab.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                {/* Header Row: IND License Plate & Job Card + Dept Badge */}
                <View style={styles.cardHeaderRow}>
                  {/* Styled IND License Plate */}
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

                  <View style={styles.headerRightGroup}>
                    {/* Department Tag Badge */}
                    <View
                      style={[
                        styles.deptBadge,
                        item.departmentTag === 'Mechanical'
                          ? styles.deptBadgeMech
                          : styles.deptBadgeBody,
                      ]}
                    >
                      {item.departmentTag === 'Mechanical' ? (
                        <Wrench size={10} color="#1E40AF" style={{ marginRight: 3 }} />
                      ) : (
                        <Shield size={10} color="#6B21A8" style={{ marginRight: 3 }} />
                      )}
                      <Text
                        style={[
                          styles.deptBadgeText,
                          item.departmentTag === 'Mechanical'
                            ? styles.deptTextMech
                            : styles.deptTextBody,
                        ]}
                      >
                        {item.departmentTag}
                      </Text>
                    </View>

                    {/* Job Card Badge */}
                    <View style={styles.jobCardBadge}>
                      <View style={styles.jobBadgeDot} />
                      <Text style={styles.jobBadgeText}>#{item.jobCardNo}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Customer Info & Wait Time Row */}
                <View style={styles.customerRow}>
                  {/* Left: Avatar & Name */}
                  <View style={styles.customerLeftGroup}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarInitial}>{item.customerInitial}</Text>
                    </View>
                    <View style={styles.customerTextCol}>
                      <Text style={styles.customerLabel}>CUSTOMER</Text>
                      <Text style={styles.customerName}>{item.customerName}</Text>
                    </View>
                  </View>

                  {/* Right: Wait Time Container */}
                  <View style={styles.waitTimeBox}>
                    <Clock size={14} color="#D97706" style={{ marginTop: 1 }} />
                    <View style={styles.waitTimeCol}>
                      <Text style={styles.waitTimeLabel}>WAIT TIME</Text>
                      <Text style={styles.waitTimeVal}>{formatWaitTime(item.waitTime)}</Text>
                    </View>
                  </View>
                </View>

                {/* Services Required */}
                <View style={styles.servicesSection}>
                  <Text style={styles.servicesLabel}>SERVICES REQUIRED</Text>
                  <View style={styles.servicePill}>
                    <View style={styles.serviceAccentBar} />
                    <Text style={styles.servicePillText}>{item.servicesRequired}</Text>
                  </View>
                </View>

                {/* Delivery Warning Box */}
                <View style={styles.deliveryBox}>
                  <AlertTriangle size={14} color="#D97706" />
                  <Text style={styles.deliveryText}>
                    <Text style={styles.deliveryLabel}>Delivery: </Text>
                    {item.deliveryDate}
                  </Text>
                </View>

                <View style={styles.divider} />

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  {item.canSkip && (
                    <TouchableOpacity
                      style={styles.skipBtn}
                      activeOpacity={0.8}
                      onPress={() => handleOpenSkipModal(item)}
                    >
                      <Text style={styles.skipBtnText}>Skip Dept</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.assignBtn, !item.canSkip && { flex: 1 }]}
                    activeOpacity={0.88}
                    onPress={() => handleOpenAssign(item)}
                  >
                    <Text style={styles.assignBtnText}>
                      {activeTab === 'BODY_SHOP' ? 'Assign Technician' : 'Assign Mechanic'}
                    </Text>
                    <ChevronRight size={15} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Assignment Modal */}
      <AssignTechnicianModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        jobCardNumber={selectedJobCard?.jobCardNo}
        jobCardId={selectedJobCard?.id}
        department={activeTab === 'BODY_SHOP' ? 'body-shop' : 'mechanical'}
        onAssignSuccess={handleAssignSuccess}
      />

      {/* Skip Department Confirmation Modal */}
      <Modal
        visible={skipModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelSkip}
      >
        <Pressable style={styles.skipModalOverlay} onPress={handleCancelSkip}>
          <Pressable style={[styles.skipModalCard, { alignItems: 'stretch' }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.skipModalTitle, { textAlign: 'left', marginBottom: 16 }]}>
              Skip {selectedJobCardToSkip?.department || 'Mechanical'} Department
            </Text>

            <Text style={[styles.skipModalMessage, { textAlign: 'left', marginBottom: 16 }]}>
              Skipping this department will postpone all remaining services for this job card in this queue and route it to the next department.
            </Text>

            <View style={styles.reasonInputContainer}>
              <TextInput
                style={styles.reasonInput}
                placeholder="Reason for skipping *"
                placeholderTextColor="#94A3B8"
                value={skipReason}
                onChangeText={setSkipReason}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={[styles.skipModalActionRow, { justifyContent: 'flex-end', marginTop: 16 }]}>
              <TouchableOpacity
                style={[styles.skipCancelBtn, { flex: 0, paddingHorizontal: 20, backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }]}
                activeOpacity={0.7}
                onPress={handleCancelSkip}
              >
                <Text style={[styles.skipCancelBtnText, { color: '#64748B' }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.skipConfirmBtn,
                  { flex: 0, paddingHorizontal: 20, backgroundColor: colors.primary },
                  (!skipReason.trim() || isSkipping) && { opacity: 0.5 }
                ]}
                activeOpacity={0.85}
                onPress={handleConfirmSkipDept}
                disabled={!skipReason.trim() || isSkipping}
              >
                {isSkipping ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.skipConfirmBtnText}>Confirm Skip</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft || '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  pendingBadgeText: {
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

  /* Horizontal Department Filter Tabs */
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
    backgroundColor: colors.primary, // #000F7E
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

  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  deptBadgeMech: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  deptBadgeBody: {
    backgroundColor: '#F3E8FF',
    borderColor: '#E9D5FF',
  },
  deptBadgeText: {
    fontSize: 10,
    fontFamily: fonts.interBold,
  },
  deptTextMech: {
    color: '#1E40AF',
  },
  deptTextBody: {
    color: '#6B21A8',
  },

  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 8,
    marginTop: 2,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  blueDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary,
  },
  sectionTitleText: {
    fontSize: 11,
    fontFamily: fonts.interBold,
    color: '#475569',
    letterSpacing: 0.5,
  },
  deadlineDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft || '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  deadlineText: {
    fontSize: 11,
    fontFamily: fonts.interSemiBold,
    color: colors.primary,
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 110,
    gap: 10,
  },

  /* Compact Card Styling */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  /* Compact IND License Plate */
  indPlateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    borderRadius: 6,
    borderWidth: 1.2,
    borderColor: '#0F172A',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  indBlueBox: {
    width: 24,
    height: '100%',
    backgroundColor: colors.primary, // #000F7E
    justifyContent: 'center',
    alignItems: 'center',
    gap: 1,
  },
  indDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#F59E0B',
  },
  indText: {
    fontSize: 7,
    fontFamily: fonts.interBold,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  plateNumberBox: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  plateNumberText: {
    fontSize: 13,
    fontFamily: fonts.interBold,
    color: '#0F172A',
    letterSpacing: 0.6,
  },

  jobCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  jobBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
  },
  jobBadgeText: {
    fontSize: 11,
    fontFamily: fonts.interSemiBold,
    color: '#475569',
  },

  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },

  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary, // Project Brand Color #000F7E
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontFamily: fonts.interBold,
    color: '#FFFFFF',
  },
  customerTextCol: {},
  customerLabel: {
    fontSize: 9,
    fontFamily: fonts.interBold,
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  customerName: {
    fontSize: 14,
    fontFamily: fonts.interBold,
    color: '#0F172A',
    marginTop: 1,
  },

  /* Compact Wait Time Box */
  waitTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  waitTimeCol: {},
  waitTimeLabel: {
    fontSize: 8,
    fontFamily: fonts.interBold,
    color: '#D97706',
    letterSpacing: 0.4,
  },
  waitTimeVal: {
    fontSize: 13,
    fontFamily: fonts.interBold,
    color: '#B45309',
  },

  servicesSection: {
    marginTop: 8,
  },
  servicesLabel: {
    fontSize: 9,
    fontFamily: fonts.interBold,
    color: '#94A3B8',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  servicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  serviceAccentBar: {
    width: 3,
    height: 12,
    borderRadius: 1.5,
    backgroundColor: colors.primary,
  },
  servicePillText: {
    fontSize: 12,
    fontFamily: fonts.interSemiBold,
    color: colors.primary,
  },

  /* Compact Delivery Warning Box */
  deliveryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFDF5',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEF08A',
    marginTop: 8,
  },
  deliveryText: {
    fontSize: 12,
    fontFamily: fonts.interSemiBold,
    color: '#78350F',
  },
  deliveryLabel: {
    fontFamily: fonts.interBold,
    color: '#78350F',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  skipBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBtnText: {
    fontSize: 13,
    fontFamily: fonts.interBold,
    color: '#334155',
  },
  assignBtn: {
    flex: 1.4,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.primary, // Project Brand Color #000F7E
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  assignBtnText: {
    fontSize: 13,
    fontFamily: fonts.interBold,
    color: '#FFFFFF',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: fonts.interBold,
    color: '#0F172A',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: fonts.inter,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },

  /* Skip Confirmation Modal Styles */
  skipModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  skipModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  skipModalIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  skipModalTitle: {
    fontSize: 18,
    fontFamily: fonts.interBold,
    color: '#0F172A',
    marginBottom: 8,
  },
  skipModalMessage: {
    fontSize: 13.5,
    fontFamily: fonts.inter,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  reasonInputContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  reasonInput: {
    height: 100,
    padding: 12,
    fontSize: 14,
    fontFamily: fonts.inter,
    color: '#0F172A',
  },
  skipModalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  skipCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipCancelBtnText: {
    fontSize: 14,
    fontFamily: fonts.interBold,
    color: '#475569',
  },
  skipConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipConfirmBtnText: {
    fontSize: 14,
    fontFamily: fonts.interBold,
    color: '#FFFFFF',
  },
});
