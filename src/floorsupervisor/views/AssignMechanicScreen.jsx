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
  Platform,
  Modal,
  Pressable,
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

export function AssignMechanicScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [skipModalVisible, setSkipModalVisible] = useState(false);
  const [selectedJobCardToSkip, setSelectedJobCardToSkip] = useState(null);
  const [activeTab, setActiveTab] = useState('MECHANICAL'); // 'ALL' | 'MECHANICAL' | 'BODY_SHOP'

  // Tab definitions
  const tabs = [
    { key: 'MECHANICAL', label: 'Mechanical', dept: 'Mechanical' },
    { key: 'BODY_SHOP', label: 'Body Shop', dept: 'Body Shop' },
  ];

  // Initial pending allocation items with Department tags
  const [allocations, setAllocations] = useState([
    {
      id: '1',
      jobCard: 'JC-0043',
      vehicleNo: 'TN00HJ6789',
      customer: 'Kings',
      initial: 'K',
      services: 'Engine Inspection & Oil Filter Change',
      waitTime: '12 mins',
      delivery: '25 Sep 2026, 11:24 AM',
      department: 'Mechanical',
    },
    {
      id: '2',
      jobCard: 'JC-0042',
      vehicleNo: 'TN80CG4456',
      customer: 'Joyo',
      initial: 'J',
      services: 'Brake Pad & Suspension Check',
      waitTime: '50 mins',
      delivery: '25 Sep 2026, 11:08 AM',
      department: 'Mechanical',
    },
    {
      id: '3',
      jobCard: 'JC-0044',
      vehicleNo: 'TN89KL7890',
      customer: 'Kilso',
      initial: 'K',
      services: 'Door Dent Repair & Full Painting',
      waitTime: '4 mins',
      delivery: '25 Sep 2026, 11:33 AM',
      department: 'Body Shop',
    },
    {
      id: '4',
      jobCard: 'JC-0045',
      vehicleNo: 'TN90AD6789',
      customer: 'Jiya',
      initial: 'J',
      services: 'Bumper Scratch Polish & Denting',
      waitTime: '25 mins',
      delivery: '25 Sep 2026, 02:15 PM',
      department: 'Body Shop',
    },
  ]);

  const filteredAllocations = allocations.filter((item) => {
    const matchesSearch =
      item.jobCard.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      (activeTab === 'MECHANICAL' && item.department === 'Mechanical') ||
      (activeTab === 'BODY_SHOP' && item.department === 'Body Shop');

    return matchesSearch && matchesTab;
  });

  const handleOpenAssign = (item) => {
    setSelectedJobCard(item);
    setModalVisible(true);
  };

  const handleOpenSkipModal = (item) => {
    setSelectedJobCardToSkip(item);
    setSkipModalVisible(true);
  };

  const handleCancelSkip = () => {
    setSkipModalVisible(false);
    setSelectedJobCardToSkip(null);
  };

  const handleConfirmSkipDept = () => {
    if (!selectedJobCardToSkip) return;
    const jobCardNo = selectedJobCardToSkip.jobCard;

    setAllocations((prev) => {
      const target = prev.find((item) => item.jobCard === jobCardNo);
      if (!target) return prev;

      if (target.department === 'Mechanical') {
        Toast.show(
          `Skipped Mechanical for #${jobCardNo} ➔ Moved to Body Shop!`,
          Toast.LONG
        );
        return prev.map((item) =>
          item.jobCard === jobCardNo
            ? { ...item, department: 'Body Shop' }
            : item
        );
      } else {
        Toast.show(
          `Skipped Body Shop department for #${jobCardNo}`,
          Toast.SHORT
        );
        return prev.filter((item) => item.jobCard !== jobCardNo);
      }
    });

    setSkipModalVisible(false);
    setSelectedJobCardToSkip(null);
  };

  const handleAssignSuccess = (data) => {
    Toast.show(
      `Assigned ${data.technician} (${data.bay}) to ${data.jobCardNumber}!`,
      Toast.LONG
    );
    setAllocations((prev) =>
      prev.filter((item) => item.jobCard !== data.jobCardNumber)
    );
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
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const count =
                tab.key === 'ALL'
                  ? allocations.length
                  : allocations.filter((a) => a.department === tab.dept).length;

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
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 130 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {filteredAllocations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Allocations Pending</Text>
              <Text style={styles.emptySubtitle}>
                No vehicle mechanic assignments pending in this tab.
              </Text>
            </View>
          ) : (
            filteredAllocations.map((item) => (
              <View key={item.id} style={styles.card}>
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
                        item.department === 'Mechanical'
                          ? styles.deptBadgeMech
                          : styles.deptBadgeBody,
                      ]}
                    >
                      {item.department === 'Mechanical' ? (
                        <Wrench size={10} color="#1E40AF" style={{ marginRight: 3 }} />
                      ) : (
                        <Shield size={10} color="#6B21A8" style={{ marginRight: 3 }} />
                      )}
                      <Text
                        style={[
                          styles.deptBadgeText,
                          item.department === 'Mechanical'
                            ? styles.deptTextMech
                            : styles.deptTextBody,
                        ]}
                      >
                        {item.department}
                      </Text>
                    </View>

                    {/* Job Card Badge */}
                    <View style={styles.jobCardBadge}>
                      <View style={styles.jobBadgeDot} />
                      <Text style={styles.jobBadgeText}>#{item.jobCard}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Customer Info & Wait Time Row */}
                <View style={styles.customerRow}>
                  {/* Left: Avatar & Name */}
                  <View style={styles.customerLeftGroup}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarInitial}>{item.initial}</Text>
                    </View>
                    <View style={styles.customerTextCol}>
                      <Text style={styles.customerLabel}>CUSTOMER</Text>
                      <Text style={styles.customerName}>{item.customer}</Text>
                    </View>
                  </View>

                  {/* Right: Wait Time Container */}
                  <View style={styles.waitTimeBox}>
                    <Clock size={14} color="#D97706" style={{ marginTop: 1 }} />
                    <View style={styles.waitTimeCol}>
                      <Text style={styles.waitTimeLabel}>WAIT TIME</Text>
                      <Text style={styles.waitTimeVal}>{item.waitTime}</Text>
                    </View>
                  </View>
                </View>

                {/* Services Required */}
                <View style={styles.servicesSection}>
                  <Text style={styles.servicesLabel}>SERVICES REQUIRED</Text>
                  <View style={styles.servicePill}>
                    <View style={styles.serviceAccentBar} />
                    <Text style={styles.servicePillText}>{item.services}</Text>
                  </View>
                </View>

                {/* Delivery Warning Box */}
                <View style={styles.deliveryBox}>
                  <AlertTriangle size={14} color="#D97706" />
                  <Text style={styles.deliveryText}>
                    <Text style={styles.deliveryLabel}>Delivery: </Text>
                    {item.delivery}
                  </Text>
                </View>

                <View style={styles.divider} />

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.skipBtn}
                    activeOpacity={0.8}
                    onPress={() => handleOpenSkipModal(item)}
                  >
                    <Text style={styles.skipBtnText}>Skip Dept</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.assignBtn}
                    activeOpacity={0.88}
                    onPress={() => handleOpenAssign(item)}
                  >
                    <Text style={styles.assignBtnText}>Assign Mechanic</Text>
                    <ChevronRight size={15} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Assignment Modal */}
      <AssignTechnicianModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        jobCardNumber={selectedJobCard?.jobCard}
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
          <Pressable style={styles.skipModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.skipModalIconCircle}>
              <AlertTriangle size={24} color="#D97706" />
            </View>

            <Text style={styles.skipModalTitle}>Skip Department?</Text>

            <Text style={styles.skipModalMessage}>
              Are you sure you want to skip{' '}
              <Text style={{ fontFamily: fonts.interBold, color: '#0F172A' }}>
                {selectedJobCardToSkip?.department || 'Mechanical'}
              </Text>{' '}
              department and move Job Card{' '}
              <Text style={{ fontFamily: fonts.interBold, color: colors.primary }}>
                #{selectedJobCardToSkip?.jobCard}
              </Text>{' '}
              to{' '}
              <Text style={{ fontFamily: fonts.interBold, color: '#0D9488' }}>
                Body Shop
              </Text>
              ?
            </Text>

            <View style={styles.skipModalActionRow}>
              <TouchableOpacity
                style={styles.skipCancelBtn}
                activeOpacity={0.7}
                onPress={handleCancelSkip}
              >
                <Text style={styles.skipCancelBtnText}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipConfirmBtn}
                activeOpacity={0.85}
                onPress={handleConfirmSkipDept}
              >
                <Text style={styles.skipConfirmBtnText}>Yes, Skip</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: fonts.inter,
    color: '#64748B',
    marginTop: 4,
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
