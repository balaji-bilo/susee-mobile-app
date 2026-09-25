import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { ArrowLeft, Car, Clock, CheckCircle, AlertCircle, Wrench, Phone, AlertTriangle } from 'lucide-react-native';
import { COLORS, FONTS } from '../config/theme';
import { showToast } from '../utils/toast';
import { base_url, exit } from '../config/constant';
import axios from 'axios';
import { retrieveEncryptedData } from '../config/storage';

export default function HistoryDetailScreen({ route, navigation }) {
  const { vehicleNumber, whatsappNumber, status, entryType, meta, date, rawItem } = route.params;
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(false);
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [exitDateTimeStr, setExitDateTimeStr] = useState('');

  const isCompleted = status === 'Completed' || status === 'Exit';

  const statusColor = isCompleted ? '#22C55E' : '#F59E0B';
  const statusBg = isCompleted ? '#ECFDF5' : '#FEF3C7';
  const StatusIcon = isCompleted ? CheckCircle : AlertCircle;

  // Parse entry / exit from meta string (e.g. "Entered 08:45 AM • Exited 04:10 PM")
  const entryMatch = meta?.match(/Entered\s([\d:]+\s[AP]M)/i);
  const exitMatch = meta?.match(/Exited\s([\d:]+\s[AP]M)/i);

  const recordDate = date || '';
  const entryDateTime = entryMatch ? (recordDate ? `${recordDate} • ${entryMatch[1]}` : entryMatch[1]) : '-';
  const exitDateTime = exitMatch ? (recordDate ? `${recordDate} • ${exitMatch[1]}` : exitMatch[1]) : '-';

  const isEntryPhase = status === 'Entry' || status === 'Inside' || status === 'Pending';

  const executeExitApi = async () => {
    setLoading(true);
    try {
      const token = await retrieveEncryptedData('token');
      let gateEntryId = rawItem?.id || rawItem?._id;

      if (!gateEntryId) {
        showToast('No active gate entry found to exit.');
        return;
      }

      const response = await axios.put(`${base_url}${exit}/${gateEntryId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 200 || response.status === 201 || response.data?.success) {
        showToast(`Exit registered successfully for vehicle ${vehicleNumber}`);
        setExitModalVisible(false);
        navigation.goBack();
      } else {
        showToast(response.data?.message || 'Failed to submit exit.');
      }
    } catch (error) {
      showToast('Failed to submit exit.');
      console.error('Submit Exit API error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExit = () => {
    const exitDateObj = new Date();
    const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const dateString = exitDateObj.toLocaleDateString('en-GB', dateOptions);
    const timeString = exitDateObj.toLocaleTimeString('en-GB', timeOptions);
    setExitDateTimeStr(`${dateString} • ${timeString}`);
    setExitModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {isFocused && <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />}
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Detail</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.vehiclePlate}>
              <Car size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.plateText}>{vehicleNumber}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <StatusIcon size={13} color={statusColor} style={{ marginRight: 4 }} />
              <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
            </View>
          </View>
          <Text style={styles.ownerName}>{whatsappNumber}</Text>
          {/* <Text style={styles.metaText}>{meta}</Text> */}
        </View>

        {/* Info rows */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>

          <InfoRow icon={<Car size={16} color={COLORS.primary} />}
            label="Registration No." value={vehicleNumber} />
          <InfoRow icon={<Phone size={16} color={COLORS.primary} />}
            label="WhatsApp Number" value={whatsappNumber} />
          {entryType && (
            <InfoRow icon={<Wrench size={16} color={COLORS.primary} />}
              label="Entry Type" value={entryType} />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Log History</Text>

          <InfoRow icon={<Clock size={16} color={COLORS.success} />}
            label="Entry Date & Time" value={entryDateTime} />
          <InfoRow icon={<Clock size={16} color={COLORS.warning} />}
            label="Exit Date & Time" value={exitDateTime} />
        </View>

        {isEntryPhase && (
          <TouchableOpacity
            style={[styles.submitExitBtn, loading && { opacity: 0.8 }]}
            onPress={handleSubmitExit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitExitBtnText}>SUBMIT EXIT</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal
        visible={exitModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!loading) {
            setExitModalVisible(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AlertTriangle size={20} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>Confirm Vehicle Exit</Text>
            </View>

            <Text style={styles.modalSubtitle}>Are you sure you want to register exit for this vehicle?</Text>

            <View style={styles.modalVehiclePlate}>
              <Car size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.modalVehiclePlateText}>{vehicleNumber || 'Unknown'}</Text>
            </View>

            <View style={styles.modalTimeRow}>
              <Clock size={16} color={COLORS.muted} style={{ marginRight: 8 }} />
              <Text style={styles.modalTimeText}>{exitDateTimeStr}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setExitModalVisible(false)}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, loading && { opacity: 0.8 }]}
                onPress={executeExitApi}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Exit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ─── Sub-components ──────────────────────────────────── */

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

/* ─── Styles ──────────────────────────────────────────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  headerTitle: { color: COLORS.primary, fontSize: 24, fontFamily: FONTS.inter, fontWeight: '700'},

  container: { padding: 14, paddingBottom: 32 },

  /* Hero */
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  vehiclePlate: { flexDirection: 'row', alignItems: 'center' },
  plateText: { color: COLORS.primary, fontSize: 18, fontFamily: FONTS.inter, letterSpacing: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 12, fontFamily: FONTS.inter },
  ownerName: { color: COLORS.secondary, fontSize: 15, fontFamily: FONTS.inter, marginBottom: 4 },
  metaText: { color: COLORS.muted, fontSize: 12, fontFamily: FONTS.inter },

  /* Section */
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: { color: COLORS.secondary, fontSize: 13, fontFamily: FONTS.inter, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  /* Info row */
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  infoIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  infoLabel: { color: COLORS.muted, fontSize: 11, fontFamily: FONTS.inter, marginBottom: 2 },
  infoValue: { color: COLORS.secondary, fontSize: 14, fontFamily: FONTS.inter },

  submitExitBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 2,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  submitExitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.inter,
    letterSpacing: 0.5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.inter,
    color: COLORS.secondary,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.inter,
    color: COLORS.muted,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalVehiclePlate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  modalVehiclePlateText: {
    color: COLORS.primary,
    fontSize: 16,
    fontFamily: FONTS.inter,
  },
  modalTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  modalTimeText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontFamily: FONTS.inter,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  confirmButton: {
    backgroundColor: '#EF4444',
  },
  cancelButtonText: {
    color: COLORS.muted,
    fontFamily: FONTS.inter,
    fontSize: 14,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontFamily: FONTS.inter,
    fontSize: 14,
  },
});
