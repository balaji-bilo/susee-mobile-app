import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { UserCheck, ChevronDown, Check, X } from 'lucide-react-native';
import { colors, fonts } from '../../common/config/theme';

export function AssignTechnicianModal({
  visible,
  onClose,
  jobCardNumber = 'JC0044',
  onAssignSuccess,
}) {
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedBay, setSelectedBay] = useState('');
  const [techDropdownOpen, setTechDropdownOpen] = useState(false);
  const [bayDropdownOpen, setBayDropdownOpen] = useState(false);

  // Sample data lists
  const technicians = [
    { id: 't1', name: 'Sakthivel' },
    { id: 't2', name: 'Balu' },
    { id: 't3', name: 'Karthik' },
    { id: 't4', name: 'Ramesh' },
    { id: 't5', name: 'Vignesh' },
  ];

  const bays = [
    { id: 'b1', name: 'Test001 (Mechanical Bay 1)' },
    { id: 'b2', name: 'Test002 (Mechanical Bay 2)' },
    { id: 'b3', name: 'Bay-03 (Body Shop)' },
    { id: 'b4', name: 'Bay-04 (Body Shop)' },
    { id: 'b5', name: 'Bay-05 (Washing & Polish)' },
  ];

  const handleAssign = () => {
    if (!selectedTechnician || !selectedBay) {
      alert('Please select both a technician and a bay number.');
      return;
    }
    const techObj = technicians.find((t) => t.id === selectedTechnician);
    const bayObj = bays.find((b) => b.id === selectedBay);

    if (onAssignSuccess) {
      onAssignSuccess({
        jobCardNumber,
        technician: techObj?.name,
        bay: bayObj?.name,
      });
    }

    // Reset & close
    setSelectedTechnician('');
    setSelectedBay('');
    setTechDropdownOpen(false);
    setBayDropdownOpen(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.cardContainer}
          onPress={(e) => e.stopPropagation?.()}
        >
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
              <Text style={selectedTechnician ? styles.selectedText : styles.placeholderText}>
                {technicians.find((t) => t.id === selectedTechnician)?.name || 'Select Technician'}
              </Text>
              <ChevronDown size={18} color="#64748B" />
            </TouchableOpacity>

            {techDropdownOpen && (
              <View style={styles.dropdownList}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                  {technicians.map((t) => (
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
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedTechnician === t.id && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {t.name}
                      </Text>
                      {selectedTechnician === t.id && <Check size={16} color={colors.primary} />}
                    </TouchableOpacity>
                  ))}
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
              <Text style={selectedBay ? styles.selectedText : styles.placeholderText}>
                {bays.find((b) => b.id === selectedBay)?.name || 'Select Bay Number'}
              </Text>
              <ChevronDown size={18} color="#64748B" />
            </TouchableOpacity>

            {bayDropdownOpen && (
              <View style={styles.dropdownList}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                  {bays.map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      style={[
                        styles.dropdownItem,
                        selectedBay === b.id && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedBay(b.id);
                        setBayDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedBay === b.id && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {b.name}
                      </Text>
                      {selectedBay === b.id && <Check size={16} color={colors.primary} />}
                    </TouchableOpacity>
                  ))}
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
              style={styles.assignBtn}
              activeOpacity={0.85}
              onPress={handleAssign}
            >
              <Text style={styles.assignText}>Assign</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
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
