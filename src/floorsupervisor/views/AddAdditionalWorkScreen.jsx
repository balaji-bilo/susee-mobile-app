import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Wrench,
  Calendar,
  CheckSquare,
  Square,
  Send,
  Info,
  MessageSquare,
  Car,
  Clock,
  Shield,
  FileText,
} from 'lucide-react-native';
import Toast from 'react-native-simple-toast';
import { colors, fonts } from '../../common/config/theme';
import Fonts from '../../common/assets/fonts/FontStyle';

const AVAILABLE_SERVICES_LIST = [
  { id: 'as1', name: 'Engine Work', category: 'Mechanical', price: 1500 },
  { id: 'as2', name: 'Oil Change', category: 'Mechanical', price: 600 },
  { id: 'as3', name: 'side Mirror change', category: 'Mechanical', price: 500 },
  { id: 'as4', name: 'Speed meter change', category: 'Mechanical', price: 750 },
];

/** Safely parse numeric price values from numbers or formatted strings like "₹4,500" */
function parsePriceNumber(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const clean = String(val).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

/** Format currency value for clean display */
function formatCurrency(val) {
  const num = parsePriceNumber(val);
  return `₹${num.toLocaleString('en-IN')}`;
}

export function AddAdditionalWorkScreen({ route, navigation }) {
  const { card: navCard, onSaveAdditionalWork } = route?.params || {};

  const defaultCard = {
    id: 'JC0044',
    vehicleNo: 'TN89KL7890',
    owner: 'Kilso',
    mobile: '7412589630',
    brandModel: 'Hyundai i20 Asta',
    created: '23 Sep 2026, 11:34 AM',
    selectedServices: [
      { id: 's1', name: 'Bumper Painting', rate: '₹4,500', status: 'Pending' },
      { id: 's2', name: 'Fender Repair', rate: '₹3,200', status: 'Pending' },
    ],
  };

  const card = navCard || defaultCard;

  const [expectedDelivery, setExpectedDelivery] = useState('25 Sep 2026, 05:00 PM');
  const [mechanicExplanation, setMechanicExplanation] = useState(
    'Require additional oil change and brake shoe replacement based on inspection.'
  );

  // Selected available services IDs (pre-select Engine Work as initial demo selection)
  const [selectedServiceIds, setSelectedServiceIds] = useState(['as1']);

  const toggleService = (id) => {
    if (selectedServiceIds.includes(id)) {
      setSelectedServiceIds(selectedServiceIds.filter((sId) => sId !== id));
    } else {
      setSelectedServiceIds([...selectedServiceIds, id]);
    }
  };

  // Extract previous services from card
  const previousServices =
    card.selectedServices || card.currentServices || defaultCard.selectedServices;

  // Previous Subtotal Calculation
  const previousSubtotal = previousServices.reduce(
    (sum, item) => sum + parsePriceNumber(item.rate || item.price || item.cost),
    0
  );

  // Selected Additional Work Services Objects & Subtotal
  const selectedServicesObjects = AVAILABLE_SERVICES_LIST.filter((item) =>
    selectedServiceIds.includes(item.id)
  );

  const additionalWorkSubtotal = selectedServicesObjects.reduce(
    (sum, item) => sum + parsePriceNumber(item.price),
    0
  );

  const subtotal = previousSubtotal + additionalWorkSubtotal;
  const tax = Math.round(subtotal * 0.1);
  const grandTotal = subtotal + tax;

  const insets = useSafeAreaInsets();
  const safeTop = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);
  const topPadding = safeTop + 6;

  const handleSendApproval = () => {
    Toast.show('Additional work request sent for approval!', Toast.LONG);
    if (onSaveAdditionalWork) {
      const formattedItems = selectedServicesObjects.map((s) => ({
        id: s.id,
        name: s.name,
        status: 'Pending',
        rate: formatCurrency(s.price),
      }));
      onSaveAdditionalWork(formattedItems);
    }
    navigation?.goBack();
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Navigation Header */}
      <View style={[styles.headerBar, { paddingTop: topPadding }]}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation?.goBack()}
        >
          <ArrowLeft size={18} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Additional Work</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 130 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Vehicle and Customer Details Card */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <Car size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.cardTitle}>Vehicle and Customer Details</Text>
          </View>
          <View style={styles.divider} />

          {/* Top Row: Customer Avatar & License Plate */}
          <View style={styles.customerRow}>
            <View style={styles.customerGroup}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {(card.owner || 'C').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.customerName}>{card.owner || 'Customer'}</Text>
                <Text style={styles.customerPhone}>{card.mobile || ''}</Text>
              </View>
            </View>

            <View style={styles.plateContainer}>
              <View style={styles.indBlueBox}>
                <View style={styles.indDot} />
                <Text style={styles.indText}>IND</Text>
              </View>
              <View style={styles.plateNumberBox}>
                <Text style={styles.plateNumberText}>
                  {card.vehicleNo || 'TN89KL7890'}
                </Text>
              </View>
            </View>
          </View>

          {/* Meta Grid Layout - Clean 2-Row Layout to prevent text overflow */}
          <View style={styles.metaBox}>
            <View style={styles.metaRowTop}>
              <View style={styles.metaColSmall}>
                <Text style={styles.metaLabel}>JOB CARD</Text>
                <Text style={styles.metaValBold}>{card.id || 'JC0044'}</Text>
              </View>

              <View style={styles.metaColLarge}>
                <Text style={styles.metaLabel}>BRAND / MODEL</Text>
                <Text style={styles.metaVal}>{card.brandModel || 'Hyundai i20 Asta'}</Text>
              </View>
            </View>

            <View style={styles.metaRowBottom}>
              <Text style={styles.metaLabel}>CREATED</Text>
              <Text style={styles.metaVal}>{card.created || '23 Sep 2026, 11:34 AM'}</Text>
            </View>
          </View>
        </View>

        {/* 2. Additional Work Form Card */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <Wrench size={16} color="#0D9488" style={{ marginRight: 6 }} />
            <Text style={styles.cardTitle}>Additional Work</Text>
          </View>
          <View style={styles.divider} />

          {/* Expected Delivery */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Expected Delivery <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputIconBox}>
              <TextInput
                style={styles.inputText}
                value={expectedDelivery}
                onChangeText={setExpectedDelivery}
                placeholder="dd-mm-yyyy --:--"
                placeholderTextColor="#94A3B8"
              />
              <Calendar size={16} color="#64748B" />
            </View>
          </View>

          {/* Mechanic Explanation */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Mechanic Explanation <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.inputText, styles.textArea]}
              value={mechanicExplanation}
              onChangeText={setMechanicExplanation}
              multiline
              numberOfLines={3}
              placeholder="Explain why this extra work is needed"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* AVAILABLE SERVICES List */}
          <View style={styles.fieldGroup}>
            <Text style={styles.subSectionTitle}>AVAILABLE SERVICES</Text>
            <View style={styles.servicesGrid}>
              {AVAILABLE_SERVICES_LIST.map((service) => {
                const isSelected = selectedServiceIds.includes(service.id);
                return (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceSelectCard,
                      isSelected && styles.serviceSelectCardActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => toggleService(service.id)}
                  >
                    <View style={styles.serviceSelectLeft}>
                      {isSelected ? (
                        <CheckSquare size={18} color={colors.primary} />
                      ) : (
                        <Square size={18} color="#94A3B8" />
                      )}
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.serviceSelectName}>{service.name}</Text>
                        <View style={styles.catBadgeSmall}>
                          <Text style={styles.catBadgeTextSmall}>
                            {service.category}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.serviceSelectPrice}>
                      {formatCurrency(service.price)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 3. Approval Preview Card */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <MessageSquare size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.cardTitle}>Approval Preview</Text>
          </View>
          <View style={styles.divider} />

          <Text style={styles.billPreviewTitle}>Bill Preview</Text>

          {/* PREVIOUS JOB CARD BILL */}
          <Text style={styles.billSectionHeading}>PREVIOUS JOB CARD BILL</Text>
          <View style={styles.billList}>
            {previousServices.map((item, idx) => (
              <View key={item.id || idx} style={styles.billRow}>
                <Text style={styles.billItemName}>{item.name} x1</Text>
                <Text style={styles.billItemPrice}>
                  {formatCurrency(item.rate || item.price || item.cost)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.dashedDivider} />

          {/* ADDITIONAL WORK */}
          <Text style={styles.billSectionHeading}>ADDITIONAL WORK</Text>
          <View style={styles.billList}>
            {selectedServicesObjects.length === 0 ? (
              <Text style={styles.emptyBillText}>Select additional services above.</Text>
            ) : (
              selectedServicesObjects.map((item) => (
                <View key={item.id} style={styles.billRow}>
                  <Text style={styles.billItemName}>{item.name} x1</Text>
                  <Text style={styles.billItemPrice}>
                    {formatCurrency(item.price)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.divider} />

          {/* Clean Calculations Breakdown Box */}
          <View style={styles.calcContainer}>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Previous Subtotal</Text>
              <Text style={styles.calcVal}>{formatCurrency(previousSubtotal)}</Text>
            </View>

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Additional Work</Text>
              <Text style={styles.calcVal}>{formatCurrency(additionalWorkSubtotal)}</Text>
            </View>

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Subtotal</Text>
              <Text style={styles.calcVal}>{formatCurrency(subtotal)}</Text>
            </View>

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Tax (10%)</Text>
              <Text style={styles.calcVal}>{formatCurrency(tax)}</Text>
            </View>

            <View style={styles.approvalTotalRow}>
              <Text style={styles.approvalTotalLabel}>Approval Total</Text>
              <Text style={styles.approvalTotalVal}>{formatCurrency(grandTotal)}</Text>
            </View>
          </View>

          {/* Pending Notice Box */}
          <View style={styles.noticeBox}>
            <Info size={16} color="#1E40AF" style={{ marginRight: 8, marginTop: 1 }} />
            <Text style={styles.noticeText}>
              Pending approval (AW127958) is already waiting for customer response.
            </Text>
          </View>

          {/* Submit Action Button */}
          <TouchableOpacity
            style={styles.approveBtn}
            activeOpacity={0.85}
            onPress={handleSendApproval}
          >
            <Send size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.approveBtnText}>Approve Additional Work</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

export default AddAdditionalWorkScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: Fonts.inter,
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    padding: 14,
    gap: 14,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: fonts.interBold,
    color: '#FFFFFF',
  },
  customerName: {
    fontSize: 14,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  customerPhone: {
    fontSize: 12,
    fontFamily: fonts.inter,
    color: '#64748B',
    marginTop: 1,
  },
  plateContainer: {
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
    backgroundColor: '#000F7E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFCC00',
    marginBottom: 1,
  },
  indText: {
    fontSize: 6.5,
    fontFamily: fonts.interBold,
    color: '#FFFFFF',
  },
  plateNumberBox: {
    paddingHorizontal: 8,
  },
  plateNumberText: {
    fontSize: 12,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  metaBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  metaRowTop: {
    flexDirection: 'row',
    gap: 12,
  },
  metaColSmall: {
    width: 90,
  },
  metaColLarge: {
    flex: 1,
  },
  metaRowBottom: {
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
  },
  metaLabel: {
    fontSize: 10,
    fontFamily: fonts.interBold,
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  metaValBold: {
    fontSize: 12.5,
    fontFamily: fonts.interBold,
    color: '#0F172A',
    marginTop: 2,
  },
  metaVal: {
    fontSize: 12,
    fontFamily: fonts.interSemiBold,
    color: '#0F172A',
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontFamily: fonts.interBold,
    color: '#334155',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  inputIconBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
  },
  inputText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.inter,
    color: '#0F172A',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  subSectionTitle: {
    fontSize: 11,
    fontFamily: fonts.interBold,
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  servicesGrid: {
    gap: 8,
  },
  serviceSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
  },
  serviceSelectCardActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#818CF8',
  },
  serviceSelectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceSelectName: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
    color: '#0F172A',
  },
  catBadgeSmall: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  catBadgeTextSmall: {
    fontSize: 9.5,
    fontFamily: fonts.interMedium,
    color: '#2563EB',
  },
  serviceSelectPrice: {
    fontSize: 13,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  billPreviewTitle: {
    fontSize: 14,
    fontFamily: fonts.interBold,
    color: '#0F172A',
    marginBottom: 8,
  },
  billSectionHeading: {
    fontSize: 10,
    fontFamily: fonts.interBold,
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginVertical: 4,
  },
  billList: {
    gap: 6,
    marginVertical: 4,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billItemName: {
    fontSize: 12.5,
    fontFamily: fonts.interMedium,
    color: '#334155',
  },
  billItemPrice: {
    fontSize: 12.5,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  emptyBillText: {
    fontSize: 12,
    fontFamily: fonts.inter,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  calcContainer: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 12.5,
    fontFamily: fonts.interMedium,
    color: '#64748B',
  },
  calcVal: {
    fontSize: 12.5,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  approvalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
  },
  approvalTotalLabel: {
    fontSize: 14,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  approvalTotalVal: {
    fontSize: 16,
    fontFamily: fonts.interBold,
    color: '#0D9488',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    marginBottom: 14,
  },
  noticeText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: fonts.interMedium,
    color: '#1E40AF',
    lineHeight: 16,
  },
  approveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnText: {
    fontSize: 13.5,
    fontFamily: fonts.interBold,
    color: '#FFFFFF',
  },
});
