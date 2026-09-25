import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Car,
  FileText,
  User,
  Phone,
  Calendar,
  PlusCircle,
  Clock,
  Pencil,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { colors, fonts } from '../../common/config/theme';

function formatVehicleNumber(num) {
  if (!num) return '';
  const clean = num.replace(/\s+/g, '').toUpperCase();
  const match = clean.match(/^([A-Z]{2})([0-9]{2})([A-Z]{1,3})([0-9]{1,4})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }
  return clean;
}

function getStatusBadgeConfig(statusName) {
  const norm = (statusName || '').toLowerCase();
  switch (norm) {
    case 'assigned':
      return { bg: '#E0F2FE', border: '#BAE6FD', text: '#0284C7', dot: '#0284C7' };
    case 'in progress':
      return { bg: '#EEF2FF', border: '#C7D2FE', text: '#4F46E5', dot: '#4F46E5' };
    case 'completed':
      return { bg: '#ECFDF5', border: '#A7F3D0', text: '#059669', dot: '#059669' };
    case 'rejected':
      return { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', dot: '#DC2626' };
    case 'postponed':
      return { bg: '#F1F5F9', border: '#CBD5E1', text: '#64748B', dot: '#64748B' };
    case 'pending':
    default:
      return { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', dot: '#D97706' };
  }
}

export function FloorJobCardViewScreen({ route, navigation }) {
  const { card: navCard } = route?.params || {};

  // Accordion state for Assigned Work Item (defaults to open for first item)
  const [expandedWorkId, setExpandedWorkId] = useState('w1');

  // Fallback data matching desktop view (JC0052)
  const defaultCard = {
    id: 'JC0052',
    vehicleNo: 'TN78UI9012',
    owner: 'Sutha',
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
  };

  const card = navCard || defaultCard;

  const [servicesList, setServicesList] = useState(
    card.selectedServices || defaultCard.selectedServices
  );
  const [additionalWorkList, setAdditionalWorkList] = useState(
    card.additionalWork || defaultCard.additionalWork
  );

  useEffect(() => {
    if (route?.params?.updatedServices) {
      setServicesList(route.params.updatedServices);
    }
    if (route?.params?.updatedAdditionalWork) {
      setAdditionalWorkList(route.params.updatedAdditionalWork);
    }
  }, [route?.params?.updatedServices, route?.params?.updatedAdditionalWork]);

  const services = servicesList;
  const additionalWork = additionalWorkList;
  const estimate = card.estimateSummary || defaultCard.estimateSummary;
  const assignedWork = card.assignedWork || defaultCard.assignedWork;

  const insets = useSafeAreaInsets();
  const safeTop = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);
  const topPadding = safeTop + 6;

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Navigation Header Bar */}
      <View style={[styles.detailHeaderBar, { paddingTop: topPadding }]}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation?.goBack()}
        >
          <ArrowLeft size={19} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitleText}>Job Card Details</Text>
        </View>
      </View>

      <ScrollView
        style={styles.detailScroll}
        contentContainerStyle={[styles.detailScrollContent, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Title Container */}
        <View style={styles.detailTitleCard}>
          <View style={styles.titleAccentLine} />
          <View style={{ flex: 1 }}>
            <Text style={styles.detailTitle}>Job Card: {card.id}</Text>
            <Text style={styles.detailSubtitle}>Created on {card.created}</Text>
          </View>
        </View>

        {/* 1. Vehicle & Owner Details */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Car size={16} color="#0D9488" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Vehicle & Owner Details</Text>
          </View>

          <View style={styles.gridContainer}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Owner Name</Text>
              <View style={styles.iconValRow}>
                <User size={13} color="#64748B" />
                <Text style={styles.gridVal}>{card.owner}</Text>
              </View>
            </View>

            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Mobile Number</Text>
              <Text style={styles.gridValBold}>{card.mobile}</Text>
            </View>
          </View>

          <View style={[styles.gridContainer, { marginTop: 12 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Registration Number</Text>
              <Text style={styles.gridValPlate}>{formatVehicleNumber(card.vehicleNo)}</Text>
            </View>

            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Brand & Model</Text>
              <Text style={styles.gridVal}>{card.brandModel || 'Tata Tata567 Tata67'}</Text>
            </View>
          </View>

          <View style={[styles.gridContainer, { marginTop: 12 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Expected Delivery Date</Text>
              <View style={styles.iconValRow}>
                <Calendar size={13} color="#0D9488" />
                <Text style={styles.gridValTeal}>
                  {card.expectedDelivery || '04 Sep 2026, 03:48 PM'}
                </Text>
              </View>
            </View>

            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Service Type</Text>
              <View style={styles.serviceTypeBadge}>
                <Text style={styles.serviceTypeText}>{card.serviceType || 'SERVICE'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2. Selected Services */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FileText size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Selected Services</Text>
            </View>
            <TouchableOpacity
              style={styles.editSectionBtn}
              activeOpacity={0.7}
              onPress={() =>
                navigation?.navigate('EditSelectedServicesScreen', {
                  card: { ...card, selectedServices: services },
                  onSaveServices: (newServices) => setServicesList(newServices),
                })
              }
            >
              <Pencil size={12} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.editSectionBtnText}>Edit Status</Text>
            </TouchableOpacity>
          </View>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeadText, { flex: 2 }]}>Service Description</Text>
            <Text style={[styles.tableHeadText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
            <Text style={[styles.tableHeadText, { flex: 1.5, textAlign: 'center' }]}>Status</Text>
            <Text style={[styles.tableHeadText, { flex: 1, textAlign: 'right' }]}>Rate</Text>
          </View>

          {services.map((item, idx) => {
            const stBadge = getStatusBadgeConfig(item.status);
            return (
              <View
                key={item.id || idx}
                style={[
                  styles.tableRow,
                  idx === services.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Text style={[styles.tableCellText, { flex: 2 }]}>{item.name}</Text>
                <Text style={[styles.tableCellMuted, { flex: 1, textAlign: 'center' }]}>
                  {item.qty || 'x1'}
                </Text>
                <View style={{ flex: 1.5, alignItems: 'center' }}>
                  <View
                    style={[
                      styles.statusPillSmall,
                      {
                        backgroundColor: stBadge.bg,
                        borderColor: stBadge.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.smallDot,
                        { backgroundColor: stBadge.dot },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusPillTextSmall,
                        { color: stBadge.text },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.tableCellBold, { flex: 1, textAlign: 'right' }]}>
                  {item.rate}
                </Text>
              </View>
            );
          })}
        </View>

        {/* 3. Additional Work & Services */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <PlusCircle size={16} color="#059669" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Additional Work & Services</Text>
            </View>
            <TouchableOpacity
              style={styles.editSectionBtn}
              activeOpacity={0.7}
              onPress={() =>
                navigation?.navigate('AddAdditionalWorkScreen', {
                  card: { ...card, currentServices: services },
                  onSaveAdditionalWork: (newItems) => setAdditionalWorkList(newItems),
                })
              }
            >
              <Pencil size={12} color="#059669" style={{ marginRight: 4 }} />
              <Text style={[styles.editSectionBtnText, { color: '#059669' }]}>Edit / Add</Text>
            </TouchableOpacity>
          </View>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeadText, { flex: 2.5 }]}>Service Description</Text>
            <Text style={[styles.tableHeadText, { flex: 1.5, textAlign: 'center' }]}>Status</Text>
            <Text style={[styles.tableHeadText, { flex: 1, textAlign: 'right' }]}>Rate</Text>
          </View>

          {additionalWork.map((item, idx) => (
            <View
              key={item.id || idx}
              style={[
                styles.tableRow,
                idx === additionalWork.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <Text style={[styles.tableCellText, { flex: 2.5 }]}>{item.name}</Text>
              <View style={{ flex: 1.5, alignItems: 'center' }}>
                <View style={[styles.statusPillSmall, styles.statusPillOrange]}>
                  <View style={[styles.smallDot, { backgroundColor: '#D97706' }]} />
                  <Text style={[styles.statusPillTextSmall, { color: '#D97706' }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={[styles.tableCellBold, { flex: 1, textAlign: 'right' }]}>
                {item.rate}
              </Text>
            </View>
          ))}
        </View>

        {/* 4. Estimate Summary */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderBetween}>
            <Text style={styles.sectionTitle}>Estimate Summary</Text>
            <View style={[styles.statusPillSmall, styles.statusPillIndigo]}>
              <View style={[styles.smallDot, { backgroundColor: '#4F46E5' }]} />
              <Text style={[styles.statusPillTextSmall, { color: '#4F46E5' }]}>
                {card.status || 'Mechanical In Progress'}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Base Subtotal</Text>
            <Text style={styles.summaryVal}>{estimate.baseSubtotal}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Additional Work</Text>
            <Text style={styles.summaryVal}>{estimate.additionalWork}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax (10%)</Text>
            <Text style={styles.summaryVal}>{estimate.tax}</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryTotalRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalVal}>{estimate.grandTotal}</Text>
          </View>
        </View>

        {/* 5. Assigned Mechanical Work (Accordion inside item box) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderBetween}>
            <Text style={styles.sectionTitle}>Assigned Mechanical Work</Text>
            <View style={styles.assignmentCountBadge}>
              <Text style={styles.assignmentCountText}>
                {assignedWork.length} Assignment
              </Text>
            </View>
          </View>

          {assignedWork.map((work, idx) => {
            const itemId = work.id || String(idx);
            const isItemExpanded = expandedWorkId === itemId;

            return (
              <View key={itemId} style={styles.assignedWorkBox}>
                <TouchableOpacity
                  style={[
                    styles.workTopRow,
                    { marginBottom: isItemExpanded ? 10 : 0 },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setExpandedWorkId(isItemExpanded ? null : itemId)}
                >
                  <View style={styles.workUserCircle}>
                    <User size={14} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.workTitle}>{work.serviceName}</Text>
                    <Text style={styles.workEmpText}>{work.empName}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.statusPillSmall, styles.statusPillIndigo]}>
                      <View style={[styles.smallDot, { backgroundColor: '#4F46E5' }]} />
                      <Text style={[styles.statusPillTextSmall, { color: '#4F46E5' }]}>
                        {work.status}
                      </Text>
                    </View>
                    {isItemExpanded ? (
                      <ChevronUp size={16} color="#64748B" />
                    ) : (
                      <ChevronDown size={16} color="#64748B" />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Collapsible Time Tracking Container */}
                {isItemExpanded && (
                  <View style={styles.timeTrackContainer}>
                    <View style={styles.timeTrackCol}>
                      <Text style={styles.timeTrackLabel}>START TIME</Text>
                      <View style={styles.iconValRow}>
                        <Clock size={12} color="#0D9488" />
                        <Text style={styles.timeTrackValTeal}>{work.startTime}</Text>
                      </View>
                    </View>

                    <View style={styles.timeTrackCol}>
                      <Text style={styles.timeTrackLabel}>END TIME</Text>
                      <View style={styles.iconValRow}>
                        <Clock size={12} color="#94A3B8" />
                        <Text style={styles.timeTrackValMuted}>{work.endTime}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export default FloorJobCardViewScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  detailHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitleText: {
    fontFamily: fonts.inter,
    fontSize: 20,
    color: colors.primary,
    fontWeight: '700',
  },
  detailScroll: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  detailScrollContent: {
    padding: 14,
    paddingBottom: 40,
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
  editSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  editSectionBtnText: {
    fontSize: 11.5,
    fontFamily: fonts.interBold,
    color: colors.primary,
  },
});
