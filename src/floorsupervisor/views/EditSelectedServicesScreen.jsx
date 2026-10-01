import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Modal,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-simple-toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ChevronDown,
  Check,
  FileText,
  Save,
  Car,
  User,
} from 'lucide-react-native';
import { colors, fonts } from '../../common/config/theme';
import { RupeeFormatText } from '../../common/components/RupeeFormatText';
import axios from 'axios';
import { base_url } from '../../common/config/constant';
import { retrieveEncryptedData } from '../../common/config/storage';

const STATUS_OPTIONS = [
  {
    label: 'Pending',
    value: 'Pending',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    textColor: '#D97706',
    dotColor: '#D97706',
  },
  {
    label: 'Assigned',
    value: 'Assigned',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    textColor: '#0284C7',
    dotColor: '#0284C7',
  },
  {
    label: 'In Progress',
    value: 'In Progress',
    bgColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    textColor: '#4F46E5',
    dotColor: '#4F46E5',
  },
  {
    label: 'Completed',
    value: 'Completed',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    textColor: '#059669',
    dotColor: '#059669',
  },
  {
    label: 'Rejected',
    value: 'Rejected',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    textColor: '#DC2626',
    dotColor: '#DC2626',
  },
  {
    label: 'Postponed',
    value: 'Postponed',
    bgColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    textColor: '#64748B',
    dotColor: '#64748B',
  },
];

function getStatusStyle(statusName) {
  const found = STATUS_OPTIONS.find(
    opt => opt.value.toLowerCase() === (statusName || '').toLowerCase()
  );
  return (
    found || {
      label: statusName || 'Pending',
      value: statusName || 'Pending',
      bgColor: '#FFFBEB',
      borderColor: '#FDE68A',
      textColor: '#D97706',
      dotColor: '#D97706',
    }
  );
}

export function EditSelectedServicesScreen({ route, navigation }) {
  const { card, onSaveServices } = route?.params || {};

  const defaultServices = card?.selectedServices || [];

  const [servicesList, setServicesList] = useState(
    JSON.parse(JSON.stringify(defaultServices))
  );

  const [dynamicStatuses, setDynamicStatuses] = useState(STATUS_OPTIONS);
  const [isUpdating, setIsUpdating] = useState(false);

  // Active dropdown modal state
  const [activeItemIndex, setActiveItemIndex] = useState(null);

  React.useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const token = await retrieveEncryptedData('token');
        const response = await axios.get(`${base_url}/job-cards/service-statuses/list`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data?.success && response.data?.data) {
          const apiStatuses = response.data.data.map(s => {
            const defaultStyle = getStatusStyle(s.statusCode);
            return {
              label: s.statusName,
              value: s.statusCode,
              bgColor: defaultStyle.bgColor,
              borderColor: defaultStyle.borderColor,
              textColor: defaultStyle.textColor,
              dotColor: defaultStyle.dotColor,
            };
          });
          if (apiStatuses.length > 0) {
            setDynamicStatuses(apiStatuses);
          }
        }
      } catch (error) {
        console.error('Failed to fetch service statuses:', error);
      }
    };
    fetchStatuses();
  }, []);

  const handleSelectStatus = (index, newStatus) => {
    const updated = [...servicesList];
    updated[index].status = newStatus;
    setServicesList(updated);
    setActiveItemIndex(null);
  };

  const handleSaveChanges = async () => {
    const jcId = card?.jobCardId || card?.id;
    if (!jcId) return;

    // 1. Check if originally completed service was modified
    for (const current of servicesList) {
      const original = defaultServices.find(s => s.id === current.id);
      if (original) {
        const origCode = String(original.serviceStatusCode || original.status || '').toUpperCase().replace(/\s+/g, '_');
        const currCode = String(current.status || '').toUpperCase().replace(/\s+/g, '_');
        const origIsCompleted = original.isCompleted || origCode.includes('COMPLETED');
        
        if (origIsCompleted && origCode !== currCode) {
          Toast.show('Completed service status cannot be changed', Toast.SHORT);
          return;
        }
      }
    }

    // 2. Additional work must be customer approved before it can be started / progressed
    for (const s of servicesList) {
      const stNorm = String(s.status || '').toUpperCase().replace(/\s+/g, '_');
      const isProgressing = ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'ONGOING'].some(st => stNorm.includes(st));
      if (s.isAdditional && isProgressing) {
        const approvalCode = String(s.approvalStatusCode || '').toUpperCase();
        const isApproved = approvalCode === 'APPROVED' || approvalCode === 'CUSTOMER_APPROVED';
        if (!isApproved) {
          Toast.show('Additional work must be customer approved before it can be started', Toast.LONG);
          return;
        }
      }
    }

    // 3. Department sequence check (Body Shop cannot start before Mechanical is complete)
    for (const targetService of servicesList) {
      const stNorm = String(targetService.status || '').toUpperCase().replace(/\s+/g, '_');
      const isProgressing = ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'ONGOING'].some(st => stNorm.includes(st));

      const isBodyShop = (
        (targetService.category || targetService.categorySlug || targetService.name || '').toLowerCase().includes('body') ||
        (targetService.category || targetService.categorySlug || targetService.name || '').toLowerCase().includes('paint') ||
        (targetService.category || targetService.categorySlug || targetService.name || '').toLowerCase().includes('dent')
      );

      if (isBodyShop && isProgressing) {
        const incompleteMechanical = servicesList.some(s => {
          const sIsBody = (
            (s.category || s.categorySlug || s.name || '').toLowerCase().includes('body') ||
            (s.category || s.categorySlug || s.name || '').toLowerCase().includes('paint') ||
            (s.category || s.categorySlug || s.name || '').toLowerCase().includes('dent')
          );
          if (sIsBody) return false;
          const sStatus = String(s.status || '').toUpperCase();
          return !sStatus.includes('COMPLETED') && !sStatus.includes('POSTPONED') && !sStatus.includes('REJECTED') && !sStatus.includes('CANCELLED');
        });

        if (incompleteMechanical) {
          Toast.show('Previous service stage must be completed before updating this service status', Toast.LONG);
          return;
        }
      }
    }

    // 4. Validate In Progress without mechanic assigned
    const hasAssignedMechanic = Boolean(card?.mechanic && card.mechanic !== 'Unassigned') || Boolean(card?.technician) || (card?.assignedMechanics && card.assignedMechanics.length > 0) || (card?.workAssignments && card.workAssignments.some(a => !!a.assignedUserId || !!a.assignedUser));
    for (const s of servicesList) {
      const stNorm = String(s.status || '').toUpperCase().replace(/\s+/g, '_');
      if (stNorm.includes('IN_PROGRESS') && !hasAssignedMechanic) {
        Toast.show(`Cannot mark service ${s.name} as In Progress without an assigned mechanic`, Toast.LONG);
        return;
      }
    }

    setIsUpdating(true);
    try {
      const token = await retrieveEncryptedData('token');
      const payload = {
        services: servicesList.map(s => ({
          id: s.id,
          status: s.status
        }))
      };
      
      const res = await axios.put(`${base_url}/mobile/job-cards/update-services/${jcId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data?.success) {
        Toast.show('Job Card services updated successfully!', Toast.SHORT);
        if (onSaveServices) {
          onSaveServices(servicesList);
        }
        navigation?.goBack();
      } else {
        Toast.show(res.data?.message || 'Failed to update services', Toast.LONG);
      }
    } catch (error) {
      console.error('Update failed:', error);
      const errMsg = error.response?.data?.message || error.message || 'Failed to update job card services';
      Toast.show(errMsg, Toast.LONG);
    } finally {
      setIsUpdating(false);
    }
  };

  const activeService =
    activeItemIndex !== null ? servicesList[activeItemIndex] : null;

  const insets = useSafeAreaInsets();
  const safeTop = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);
  const topPadding = safeTop + 6;

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
          <ArrowLeft size={19} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Edit Service Status</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <View style={styles.bannerRow}>
            <View style={styles.bannerCol}>
              <View style={styles.bannerLabelRow}>
                <Car size={13} color="#0D9488" />
                <Text style={styles.bannerLabel}>VEHICLE</Text>
              </View>
              <Text style={styles.bannerValBold}>
                {card?.vehicleNo || 'TN 78 UI 9012'}
              </Text>
            </View>

            <View style={styles.bannerCol}>
              <View style={styles.bannerLabelRow}>
                <User size={13} color="#64748B" />
                <Text style={styles.bannerLabel}>OWNER</Text>
              </View>
              <Text style={styles.bannerVal}>{card?.owner || 'Sutha'}</Text>
            </View>
          </View>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeaderRow}>
          <FileText size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Selected Services Status</Text>
        </View>
        <Text style={styles.sectionHint}>
          Select the current progress status for each service listed below.
        </Text>

        {/* Services List */}
        <View style={styles.listContainer}>
          {servicesList.map((item, idx) => {
            const statusConfig = getStatusStyle(item.status);

            return (
              <View key={item.id || idx} style={styles.serviceCard}>
                <View style={styles.serviceMainRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName}>{item.name}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaBadge}>Qty: {item.qty || 'x1'}</Text>
                      <Text style={styles.metaDot}>•</Text>
                      <RupeeFormatText style={styles.metaPrice}>{item.rate}</RupeeFormatText>
                    </View>
                  </View>

                  {/* Dropdown Selector Button */}
                  <TouchableOpacity
                    style={[
                      styles.statusDropdownBtn,
                      {
                        backgroundColor: statusConfig.bgColor,
                        borderColor: statusConfig.borderColor,
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setActiveItemIndex(idx)}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: statusConfig.dotColor },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusDropdownText,
                        { color: statusConfig.textColor },
                      ]}
                    >
                      {item.status}
                    </Text>
                    <ChevronDown size={15} color={statusConfig.textColor} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer Action Buttons */}
      <View style={[styles.footerBar, { paddingBottom: 14 + insets.bottom }]}>
        <TouchableOpacity
          style={styles.cancelBtn}
          activeOpacity={0.7}
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, isUpdating && { opacity: 0.7 }]}
          activeOpacity={0.8}
          onPress={handleSaveChanges}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
          ) : (
            <Save size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          )}
          <Text style={styles.saveBtnText}>{isUpdating ? 'Updating...' : 'Update Job Card'}</Text>
        </TouchableOpacity>
      </View>

      {/* Clean Status Select Modal */}
      <Modal
        visible={activeItemIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveItemIndex(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setActiveItemIndex(null)}
        >
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Status</Text>
              <Text style={styles.modalSubTitle}>
                {activeService ? activeService.name : 'Service'}
              </Text>
            </View>

            <View style={styles.modalDivider} />

            <View style={styles.optionsList}>
              {dynamicStatuses.map(opt => {
                const isSelected =
                  activeService?.status?.toLowerCase() === opt.value.toLowerCase();

                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.optionRow,
                      isSelected && styles.optionRowSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleSelectStatus(activeItemIndex, opt.value)}
                  >
                    <View style={styles.optionLeft}>
                      <View
                        style={[
                          styles.optionPill,
                          {
                            backgroundColor: opt.bgColor,
                            borderColor: opt.borderColor,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: opt.dotColor },
                          ]}
                        />
                        <Text
                          style={[
                            styles.optionPillText,
                            { color: opt.textColor },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </View>
                    </View>

                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Check size={13} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default EditSelectedServicesScreen;

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
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontFamily: fonts.inter,
    fontSize: 20,
    color: colors.primary,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: fonts.interMedium,
    color: '#64748B',
    marginTop: 1,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  infoBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bannerCol: {
    flex: 1,
  },
  bannerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  bannerLabel: {
    fontSize: 9.5,
    fontFamily: fonts.interBold,
    color: '#64748B',
    letterSpacing: 0.3,
  },
  bannerValBold: {
    fontSize: 13,
    fontFamily: fonts.interBold,
    color: colors.primary,
  },
  bannerVal: {
    fontSize: 13,
    fontFamily: fonts.interMedium,
    color: '#1E293B',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  sectionHint: {
    fontSize: 12,
    fontFamily: fonts.inter,
    color: '#64748B',
    marginBottom: 14,
  },
  listContainer: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  serviceMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceName: {
    fontSize: 14,
    fontFamily: fonts.interBold,
    color: '#0F172A',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaBadge: {
    fontSize: 11.5,
    fontFamily: fonts.interMedium,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaDot: {
    fontSize: 10,
    color: '#94A3B8',
  },
  metaPrice: {
    fontSize: 12.5,
    fontFamily: fonts.interBold,
    color: '#1E293B',
  },
  statusDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    minWidth: 125,
    justifyContent: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDropdownText: {
    fontSize: 12,
    fontFamily: fonts.interBold,
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontFamily: fonts.interBold,
    color: '#475569',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 13.5,
    fontFamily: fonts.interBold,
    color: '#FFFFFF',
  },

  /* Modal Styling */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  modalHeader: {
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  modalSubTitle: {
    fontSize: 12,
    fontFamily: fonts.interMedium,
    color: colors.primary,
    marginTop: 2,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  optionsList: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionRowSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  optionPillText: {
    fontSize: 12,
    fontFamily: fonts.interBold,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
