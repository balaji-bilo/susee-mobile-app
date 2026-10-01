import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { UserCheck, ChevronDown, Check, X } from 'lucide-react-native';
import { colors, fonts } from '../../common/config/theme';

import axios from 'axios';
import { base_url, mobile_assign_mechanic_assign } from '../../common/config/constant';
import { retrieveEncryptedData } from '../../common/config/storage';

export function AssignTechnicianModal({
  visible,
  onClose,
  jobCardNumber = '',
  jobCardId = null,
  department = 'mechanical',
  onAssignSuccess,
}) {
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedBay, setSelectedBay] = useState('');
  const [techDropdownOpen, setTechDropdownOpen] = useState(false);
  const [bayDropdownOpen, setBayDropdownOpen] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [bays, setBays] = useState([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (visible) {
      fetchDropdowns();
      setSelectedTechnician('');
      setSelectedBay('');
    }
  }, [visible, department]);

  const fetchDropdowns = async () => {
    try {
      const token = await retrieveEncryptedData('token');
      const userStr = await retrieveEncryptedData('user');
      const user = userStr ? JSON.parse(userStr) : {};
      const locId = user?.locationId || user?.location_id || user?.branchId || '';

      const deptStr = department === 'body-shop' ? 'body-shop' : 'mechanical';
      const bayType = department === 'body-shop' ? 'Body Shop' : 'Mechanical';

      const techRes = await axios.get(`${base_url}/users/mechanics/dropdown`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { locationId: locId, category: deptStr }
      });
      
      const bayRes = await axios.get(`${base_url}/bays/dropdown`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { locationId: locId, bayType }
      });

      if (techRes.data?.success) {
        setTechnicians(techRes.data.data?.users || techRes.data.users || []);
      }
      if (bayRes.data?.success) {
        setBays(bayRes.data.data?.bays || bayRes.data.bays || []);
      }
    } catch (error) {
      console.error('Error fetching dropdowns:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedTechnician || !selectedBay) {
      alert('Please select both a technician and a bay number.');
      return;
    }

    setLoading(true);
    try {
      const token = await retrieveEncryptedData('token');
      const deptStr = department === 'body-shop' ? 'body-shop' : 'mechanical';

      const response = await axios.post(
        `${base_url}${mobile_assign_mechanic_assign}/${jobCardId}`,
        {
          category: deptStr,
          assignedUserId: selectedTechnician,
          bayId: selectedBay,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const techObj = technicians.find((t) => t.id === selectedTechnician);
        const bayObj = bays.find((b) => b.id === selectedBay);

        if (onAssignSuccess) {
          onAssignSuccess({
            jobCardNumber,
            jobCardId,
            technician: techObj?.name || techObj?.fullName,
            bay: bayObj?.name || bayObj?.bayName,
          });
        }

        // Reset & close
        setSelectedTechnician('');
        setSelectedBay('');
        setTechDropdownOpen(false);
        setBayDropdownOpen(false);
        onClose();
      } else {
        alert(response.data.message || 'Failed to assign work');
      }
    } catch (error) {
      alert(error?.response?.data?.message || 'Error assigning work');
      console.error('Assign error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
        >
          <View style={styles.cardContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <View style={styles.iconCircle}>
                  <UserCheck size={22} color={colors.primary} />
                </View>
                <Text style={styles.titleText}>Assign Technician</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>
              Please assign a technician and bay for job{' '}
              <Text style={styles.jobHighlight}>{jobCardNumber}</Text>
            </Text>

            {/* Form */}
            <View style={styles.formContainer}>
              {/* Technician Select */}
              <Text style={styles.label}>Select Technician</Text>
              <TouchableOpacity
                style={styles.dropdownHeader}
                activeOpacity={0.8}
                onPress={() => {
                  setTechDropdownOpen(!techDropdownOpen);
                  setBayDropdownOpen(false);
                }}
              >
                <Text style={selectedTechnician ? styles.selectedText : styles.placeholderText} numberOfLines={1}>
                  {(() => {
                    const tech = technicians.find((t) => t.id === selectedTechnician);
                    if (!tech) return 'Select Technician';
                    return `${tech.fullName || tech.name}${tech.employeeCode ? ` - ${tech.employeeCode}` : ''}`;
                  })()}
                </Text>
                <ChevronDown size={18} color="#64748B" />
              </TouchableOpacity>

              {techDropdownOpen && (
                <View style={styles.dropdownList}>
                  <ScrollView
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                    style={styles.dropdownScroll}
                  >
                    {technicians.map((t) => {
                      const jobCount = t.activeJobCount || 0;
                      const isBusy = jobCount > 0;
                      const badgeLabel = t.availabilityLabel || (isBusy ? `Busy (${jobCount} job${jobCount > 1 ? 's' : ''})` : 'Available');

                      return (
                        <TouchableOpacity
                          key={t.id}
                          style={[
                            styles.dropdownItem,
                            selectedTechnician === t.id && styles.dropdownItemSelected,
                          ]}
                          onPress={() => {
                            setSelectedTechnician(t.id);
                            setTechDropdownOpen(false);
                          }}
                        >
                          <View style={styles.dropdownItemRow}>
                            <Text
                              style={[
                                styles.dropdownItemText,
                                selectedTechnician === t.id && styles.dropdownItemTextSelected,
                              ]}
                            >
                              {t.fullName || t.name}{t.employeeCode ? ` - ${t.employeeCode}` : ''}
                            </Text>
                            <View style={isBusy ? styles.badgeBusy : styles.badgeAvailable}>
                              <Text style={isBusy ? styles.badgeBusyText : styles.badgeAvailableText}>
                                {badgeLabel}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Bay Select */}
              <Text style={[styles.label, { marginTop: 16 }]}>Bay Number</Text>
              <TouchableOpacity
                style={styles.dropdownHeader}
                activeOpacity={0.8}
                onPress={() => {
                  setBayDropdownOpen(!bayDropdownOpen);
                  setTechDropdownOpen(false);
                }}
              >
                <Text style={selectedBay ? styles.selectedText : styles.placeholderText} numberOfLines={1}>
                  {(() => {
                    const bay = bays.find((b) => b.id === selectedBay);
                    if (!bay) return 'Select Bay Number';
                    return bay.bayName || bay.bayCode || bay.name;
                  })()}
                </Text>
                <ChevronDown size={18} color="#64748B" />
              </TouchableOpacity>

              {bayDropdownOpen && (
                <View style={styles.dropdownList}>
                  <ScrollView
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                    style={styles.dropdownScroll}
                  >
                    {bays.map((b) => {
                      const isBusy = b.availability === 'BUSY';
                      const badgeLabel = b.availabilityLabel || (isBusy ? 'Busy' : 'Available');

                      return (
                        <TouchableOpacity
                          key={b.id}
                          disabled={isBusy}
                          style={[
                            styles.dropdownItem,
                            selectedBay === b.id && styles.dropdownItemSelected,
                            isBusy && { backgroundColor: '#F8FAFC' }
                          ]}
                          onPress={() => {
                            setSelectedBay(b.id);
                            setBayDropdownOpen(false);
                          }}
                        >
                          <View style={styles.dropdownItemRow}>
                            <Text
                              style={[
                                styles.dropdownItemText,
                                selectedBay === b.id && styles.dropdownItemTextSelected,
                                isBusy && styles.disabledItemText
                              ]}
                            >
                              {b.bayName || b.bayCode || b.name}
                            </Text>
                            <View style={isBusy ? styles.badgeBusy : styles.badgeAvailable}>
                              <Text style={isBusy ? styles.badgeBusyText : styles.badgeAvailableText}>
                                {badgeLabel}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                activeOpacity={0.8}
                onPress={onClose}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.assignBtn, loading && { opacity: 0.7 }]}
                activeOpacity={0.85}
                onPress={handleAssign}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.assignText}>Assign</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // Clean, modern dark translucent backdrop
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyboardWrap: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 15, 126, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 18,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.inter,
    color: '#64748B',
    marginBottom: 20,
  },
  jobHighlight: {
    fontFamily: fonts.interBold,
    color: colors.primary,
  },
  formContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.interMedium,
    color: '#334155',
    marginBottom: 6,
  },
  dropdownHeader: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: fonts.inter,
    color: '#94A3B8',
  },
  selectedText: {
    fontSize: 14,
    fontFamily: fonts.interMedium,
    color: '#0F172A',
  },
  dropdownList: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 180,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(0, 15, 126, 0.05)',
  },
  dropdownItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  badgeAvailable: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeAvailableText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '700',
  },
  badgeBusy: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeBusyText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '700',
  },
  disabledItemText: {
    color: '#94A3B8',
  },
  dropdownItemText: {
    fontSize: 14,
    fontFamily: fonts.inter,
    color: '#334155',
  },
  dropdownItemTextSelected: {
    fontFamily: fonts.interSemiBold,
    color: colors.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelText: {
    fontSize: 14,
    fontFamily: fonts.interSemiBold,
    color: '#475569',
  },
  assignBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  assignText: {
    fontSize: 14,
    fontFamily: fonts.interSemiBold,
    color: '#FFFFFF',
  },
});
