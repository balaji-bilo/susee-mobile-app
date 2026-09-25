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
  const [requests] = useState([
    {
      id: 'AW913171',
      jobCard: 'JC0035',
      vehicleNo: 'TN01AB1234',
      customer: 'Anui',
      initial: 'A',
      services: 'Brake shoe, Brake wire, Engine oil change',
      amount: '₹4,550',
      requestedAt: '21 Sep 2026, 05:06 PM',
      status: 'Pending',
    },
    {
      id: 'AW774172',
      jobCard: 'JC0034',
      vehicleNo: 'TN65CH1234',
      customer: 'Jack',
      initial: 'J',
      services: 'Armrest installation',
      amount: '₹350',
      requestedAt: '21 Sep 2026, 04:00 PM',
      status: 'Pending',
    },
    {
      id: 'AW525663',
      jobCard: 'JC0033',
      vehicleNo: 'TN47K2348',
      customer: 'Vicky',
      initial: 'V',
      services: 'Armrest',
      amount: '₹350',
      requestedAt: '08 Sep 2026, 05:53 PM',
      status: 'Pending',
    },
    {
      id: 'AW183302',
      jobCard: 'JC0033',
      vehicleNo: 'TN47K2348',
      customer: 'Vicky',
      initial: 'V',
      services: 'Side Mirror change, Brake wire',
      amount: '₹900',
      requestedAt: '03 Sep 2026, 05:35 PM',
      status: 'Approved',
    },
    {
      id: 'AW304343',
      jobCard: 'JC0023',
      vehicleNo: 'TN58HV0112',
      customer: 'Vicky',
      initial: 'V',
      services: 'Front wheel tyre change, left side',
      amount: '₹2,199',
      requestedAt: '20 Aug 2026, 06:11 PM',
      status: 'Rejected',
    },
  ]);

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.jobCard.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.customer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === 'ALL' ||
      req.status.toUpperCase() === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

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
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            {tabs.map((tab) => {
              const isActive = selectedStatusFilter === tab.key;
              const count =
                tab.key === 'ALL'
                  ? requests.length
                  : requests.filter((r) => r.status.toUpperCase() === tab.key).length;

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
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 130 + insets.bottom }]} showsVerticalScrollIndicator={false}>
          {filteredRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FilePlus size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No work requests found</Text>
            </View>
          ) : (
            filteredRequests.map((item) => {
              const statusTheme = getStatusColor(item.status);
              const StatusIcon = statusTheme.Icon;
              const serviceItems = item.services.split(', ');

              return (
                <TouchableOpacity
                  key={item.id}
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
                        <Text style={styles.costVal}>{item.amount}</Text>
                      </View>

                      <View style={styles.timeCol}>
                        <Calendar size={12} color="#64748B" style={{ marginRight: 4 }} />
                        <Text style={styles.timeText}>{item.requestedAt}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
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


