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
  FileText,
  User,
  Phone,
  Wrench,
  Layers,
  Calendar,
  MoreVertical,
  Filter,
  ArrowLeft,
  Car,
  PlusCircle,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import { colors, fonts } from '../../common/config/theme';
import { AssignTechnicianModal } from '../components/AssignTechnicianModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

export function FloorJobCardsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('MECHANICAL');
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedCardForAssign, setSelectedCardForAssign] = useState(null);

  const tabs = [
    { key: 'MECHANICAL', label: 'Mechanical' },
    { key: 'BODY_SHOP', label: 'Body Shop' },
  ];

  // Sample data matching Job Cards
  const [jobCards, setJobCards] = useState([
    {
      id: 'JC0052',
      vehicleNo: 'TN78UI9012',
      owner: 'Sutha',
      initial: 'S',
      mobile: '8523691476',
      brandModel: 'Tata Tata567 Tata67',
      expectedDelivery: '04 Sep 2026, 03:48 PM',
      serviceType: 'SERVICE',
      status: 'Mechanical In Progress',
      mechanic: 'sakthivel',
      bay: 'Test001',
      estCost: '₹1,485',
      created: '23 Sep 2026, 02:09 PM',
      selectedServices: [
        { id: '1', name: 'Armrest', qty: 'x1', status: 'In Progress', rate: '₹350' },
        { id: '2', name: 'Door Dent', qty: 'x1', status: 'Pending', rate: '₹1,000' },
      ],
      additionalWork: [
        { id: 'a1', name: 'Brake shoe', status: 'Pending', rate: '₹800' },
      ],
      estimateSummary: {
        baseSubtotal: '₹550',
        additionalWork: '₹800',
        tax: '₹135',
        grandTotal: '₹1,485',
      },
      assignedWork: [
        {
          id: 'w1',
          serviceName: 'Armrest',
          empName: 'huka - EMP0012',
          status: 'In Progress',
          startTime: '23 Sep 2026, 02:48 PM',
          endTime: 'Not Started',
        },
      ],
    },
    {
      id: 'JC0044',
      vehicleNo: 'TN89KL7890',
      owner: 'Kilso',
      initial: 'K',
      mobile: '7412589630',
      brandModel: 'Hyundai i20 Asta',
      expectedDelivery: '24 Sep 2026, 05:00 PM',
      serviceType: 'PERIODIC SERVICE',
      status: 'Body Shop Assignment Pending',
      mechanic: 'Unassigned',
      bay: 'Unassigned',
      estCost: '₹8,580',
      created: '23 Sep 2026, 11:34 AM',
      selectedServices: [
        { id: '1', name: 'Bumper Painting', qty: 'x1', status: 'Pending', rate: '₹4,500' },
        { id: '2', name: 'Fender Repair', qty: 'x1', status: 'Pending', rate: '₹3,200' },
      ],
      additionalWork: [],
      estimateSummary: {
        baseSubtotal: '₹7,700',
        additionalWork: '₹0',
        tax: '₹880',
        grandTotal: '₹8,580',
      },
      assignedWork: [],
    },
    {
      id: 'JC0043',
      vehicleNo: 'TN00HJ6789',
      owner: 'Kings',
      initial: 'K',
      mobile: '7415823690',
      status: 'Body Shop In Progress',
      mechanic: 'Unassigned',
      bay: 'Unassigned',
      estCost: '₹6,160',
      created: '23 Sep 2026, 11:24 AM',
    },
    {
      id: 'JC0041',
      vehicleNo: 'TN90AD6789',
      owner: 'Jiya',
      initial: 'J',
      mobile: '8523697412',
      status: 'Approved',
      mechanic: 'Unassigned',
      bay: 'Unassigned',
      estCost: '₹3,410',
      created: '23 Sep 2026, 10:56 AM',
    },
    {
      id: 'JC0035',
      vehicleNo: 'TN01AB1234',
      owner: 'Anui',
      initial: 'A',
      mobile: '9638527412',
      status: 'Mechanical Assigned',
      mechanic: 'sakthivel',
      bay: 'Test001',
      estCost: '₹374',
      created: '21 Sep 2026, 04:55 PM',
    },
    {
      id: 'JC0034',
      vehicleNo: 'TN65CH1234',
      owner: 'Jack',
      initial: 'J',
      mobile: '9638527410',
      status: 'Mechanical Assigned',
      mechanic: 'sakthivel',
      bay: 'Test002',
      estCost: '₹396',
      created: '21 Sep 2026, 03:54 PM',
    },
  ]);

  const getTabCount = (key) => {
    if (key === 'BODY_SHOP') {
      return jobCards.filter((c) => {
        const s = (c.status || '').toUpperCase();
        const st = (c.serviceType || '').toUpperCase();
        return s.includes('BODY') || st.includes('BODY');
      }).length;
    }
    if (key === 'MECHANICAL') {
      return jobCards.filter((c) => {
        const s = (c.status || '').toUpperCase();
        const st = (c.serviceType || '').toUpperCase();
        return !(s.includes('BODY') || st.includes('BODY'));
      }).length;
    }
    return jobCards.length;
  };

  const filteredCards = jobCards.filter((card) => {
    const matchesSearch =
      card.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.mobile.includes(searchQuery);

    const s = (card.status || '').toUpperCase();
    const st = (card.serviceType || '').toUpperCase();
    const isBodyShop = s.includes('BODY') || st.includes('BODY');

    let matchesStatus = true;
    if (selectedStatusFilter === 'MECHANICAL') {
      matchesStatus = !isBodyShop;
    } else if (selectedStatusFilter === 'BODY_SHOP') {
      matchesStatus = isBodyShop;
    }

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    if (status.includes('Pending')) return { bg: '#EEF2FF', text: colors.primary, border: '#C7D2FE' };
    if (status.includes('Progress')) return { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' };
    if (status.includes('Approved')) return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
    return { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' };
  };

  const handleOpenAssignModal = (card) => {
    setSelectedCardForAssign(card);
    setAssignModalVisible(true);
  };

  const handleAssignSuccess = ({ jobCardNumber, technician, bay }) => {
    setJobCards((prevCards) =>
      prevCards.map((card) => {
        if (card.id === jobCardNumber || card.id === selectedCardForAssign?.id) {
          return {
            ...card,
            mechanic: technician || card.mechanic,
            bay: bay || card.bay,
            status: 'Mechanical Assigned',
          };
        }
        return card;
      })
    );
    setAssignModalVisible(false);
    setSelectedCardForAssign(null);
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Main Container */}
      <View style={styles.container}>
        <FloorSupervisorHeader title="Job Cards" />

        {/* Search Bar with Filter Icon */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vehicle, owner, mobile, job ID..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
            <Filter size={16} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Horizontal Filter Pill Tabs with Badges */}
        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            {tabs.map((tab) => {
              const isActive = selectedStatusFilter === tab.key;
              const count = getTabCount(tab.key);

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

        {/* Job Cards List */}
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 130 + insets.bottom }]} showsVerticalScrollIndicator={false}>
          {filteredCards.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FileText size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No matching job cards found</Text>
            </View>
          ) : (
            filteredCards.map((item) => {
              const statusStyle = getStatusColor(item.status);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  activeOpacity={0.88}
                  onPress={() =>
                    navigation?.navigate('FloorJobCardViewScreen', {
                      card: item,
                      jobCardId: item.id,
                    })
                  }
                >
                  <View style={styles.cardHeader}>
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

                    <View style={styles.idGroup}>
                      <View style={styles.jobTagPill}>
                        <Text style={styles.jobTagText}>#{item.id}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Horizontal Divider Line with Space */}
                  <View style={styles.cardDivider} />

                  {/* Status Badge Row (No Regular Service text) */}
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
                      ]}
                    >
                      <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  {/* Owner & Mobile */}
                  <View style={styles.detailsRow}>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>OWNER</Text>
                      <View style={styles.iconTextRow}>
                        <User size={12} color="#64748B" />
                        <Text style={styles.detailVal}>{item.owner}</Text>
                      </View>
                    </View>

                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>MOBILE</Text>
                      <View style={styles.iconTextRow}>
                        <Phone size={12} color="#64748B" />
                        <Text style={styles.detailVal}>{item.mobile}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Mechanic & Bay Badges (Click to open assign modal) */}
                  <View style={styles.assignmentRow}>
                    <View style={styles.tagCol}>
                      <Text style={styles.detailLabel}>MECHANIC</Text>
                      <TouchableOpacity
                        style={[styles.tagBadge, item.mechanic !== 'Unassigned' && styles.tagBadgeActive]}
                        activeOpacity={0.7}
                        onPress={() => handleOpenAssignModal(item)}
                      >
                        <Wrench size={11} color={item.mechanic !== 'Unassigned' ? colors.primary : '#94A3B8'} />
                        <Text style={[styles.tagText, item.mechanic !== 'Unassigned' && styles.tagTextActive]}>
                          {item.mechanic}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.tagCol}>
                      <Text style={styles.detailLabel}>BAY</Text>
                      <TouchableOpacity
                        style={[styles.tagBadge, item.bay !== 'Unassigned' && styles.tagBadgeActiveGreen]}
                        activeOpacity={0.7}
                        onPress={() => handleOpenAssignModal(item)}
                      >
                        <Layers size={11} color={item.bay !== 'Unassigned' ? '#059669' : '#94A3B8'} />
                        <Text style={[styles.tagText, item.bay !== 'Unassigned' && styles.tagTextGreen]}>
                          {item.bay}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Footer */}
                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.costLabel}>ESTIMATED COST</Text>
                      <Text style={styles.costVal}>{item.estCost}</Text>
                    </View>

                    <View style={styles.timeCol}>
                      <Calendar size={11} color="#64748B" style={{ marginRight: 4 }} />
                      <Text style={styles.createdText}>{item.created}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* Assign Technician Modal Popup */}
        <AssignTechnicianModal
          visible={assignModalVisible}
          onClose={() => setAssignModalVisible(false)}
          jobCardNumber={selectedCardForAssign?.id || 'JC0044'}
          onAssignSuccess={handleAssignSuccess}
        />
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

  /* Compact Card Styling */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jobTagPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  jobTagText: {
    fontSize: 12,
    fontFamily: fonts.interBold,
    color: colors.primary,
  },
  indPlateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    borderRadius: 6,
    borderWidth: 1.2,
    borderColor: '#94A3B8',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  indBlueBox: {
    width: 22,
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
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  plateNumberText: {
    fontSize: 12.5,
    fontFamily: fonts.interBold,
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  moreBtn: {
    padding: 2,
    marginLeft: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11.5,
    fontFamily: fonts.interSemiBold,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 8,
    fontFamily: fonts.interBold,
    color: '#94A3B8',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailVal: {
    fontSize: 12,
    fontFamily: fonts.interBold,
    color: '#334155',
  },
  assignmentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  tagCol: {
    flex: 1,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagBadgeActive: {
    backgroundColor: '#EEF2FF',
    borderColor: colors.primary,
  },
  tagBadgeActiveGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  tagText: {
    fontSize: 11,
    fontFamily: fonts.interMedium,
    color: '#64748B',
  },
  tagTextActive: {
    color: colors.primary,
    fontFamily: fonts.interSemiBold,
  },
  tagTextGreen: {
    color: '#059669',
    fontFamily: fonts.interSemiBold,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  costLabel: {
    fontSize: 8,
    fontFamily: fonts.interBold,
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  costVal: {
    fontSize: 14,
    fontFamily: fonts.interBold,
    color: '#0F172A',
    marginTop: 1,
  },
  timeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  createdText: {
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

  /* Detail View Styles */
  detailHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 13,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  detailScroll: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  detailScrollContent: {
    padding: 14,
    paddingBottom: 110,
    gap: 12,
  },
  detailTitleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  titleAccentLine: {
    width: 4,
    height: 36,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginRight: 12,
  },
  detailTitle: {
    fontSize: 19,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  detailSubtitle: {
    fontSize: 11.5,
    fontFamily: fonts.inter,
    color: '#64748B',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 9.5,
    fontFamily: fonts.interBold,
    color: '#94A3B8',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  gridVal: {
    fontSize: 12.5,
    fontFamily: fonts.interMedium,
    color: '#334155',
  },
  gridValBold: {
    fontSize: 12.5,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  gridValPlate: {
    fontSize: 12.5,
    fontFamily: fonts.interBold,
    color: colors.primary,
  },
  gridValTeal: {
    fontSize: 12,
    fontFamily: fonts.interBold,
    color: '#0D9488',
  },
  iconValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  serviceTypeText: {
    fontSize: 10.5,
    fontFamily: fonts.interBold,
    color: '#475569',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  tableHeadText: {
    fontSize: 10,
    fontFamily: fonts.interBold,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableCellText: {
    fontSize: 12,
    fontFamily: fonts.interMedium,
    color: '#1E293B',
  },
  tableCellMuted: {
    fontSize: 12,
    fontFamily: fonts.interMedium,
    color: '#64748B',
  },
  tableCellBold: {
    fontSize: 12.5,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  statusPillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  statusPillIndigo: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  statusPillOrange: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statusPillGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  smallDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusPillTextSmall: {
    fontSize: 10,
    fontFamily: fonts.interBold,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: fonts.interMedium,
    color: '#64748B',
  },
  summaryVal: {
    fontSize: 12.5,
    fontFamily: fonts.interSemiBold,
    color: '#1E293B',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  grandTotalVal: {
    fontSize: 17,
    fontFamily: fonts.interBold,
    color: colors.primary,
  },
  assignmentCountBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  assignmentCountText: {
    fontSize: 10.5,
    fontFamily: fonts.interBold,
    color: colors.primary,
  },
  assignedWorkBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  workTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  workUserCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workTitle: {
    fontSize: 12.5,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  workEmpText: {
    fontSize: 10.5,
    fontFamily: fonts.interMedium,
    color: '#64748B',
  },
  timeTrackContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  timeTrackCol: {
    flex: 1,
  },
  timeTrackLabel: {
    fontSize: 8.5,
    fontFamily: fonts.interBold,
    color: '#94A3B8',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  timeTrackValTeal: {
    fontSize: 11,
    fontFamily: fonts.interBold,
    color: '#0D9488',
  },
  timeTrackValMuted: {
    fontSize: 11,
    fontFamily: fonts.interMedium,
    color: '#64748B',
  },
});
