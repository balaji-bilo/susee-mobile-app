import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import {
  ArrowRight,
  X,
  Wrench,
  FilePlus,
  BellRing
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export function StageAlertModal({
  visible,
  alert,
  onProceed,
  onCancel,
  role = 'crm-team'
}) {
  if (!visible || !alert) return null;

  const normalizedRole = String(role || '').toLowerCase().replace(/\s+/g, '-');
  const isFloor = normalizedRole === 'floor-supervisor' || normalizedRole === 'manager';

  const rawTitle = alert.title || 'Stage Alert';
  const rawMsg = alert.message || '';
  const combinedText = `${rawTitle} ${rawMsg}`.toLowerCase();

  // Detect exact stage type
  const isAssignMechanic =
    combinedText.includes('unassigned') ||
    combinedText.includes('assignment pending') ||
    combinedText.includes('assignment_pending') ||
    combinedText.includes('without a mechanic') ||
    combinedText.includes('without a bay') ||
    combinedText.includes('assign mechanic') ||
    combinedText.includes('assign technician') ||
    combinedText.includes('assign bay') ||
    /\bassign\s*(mechanic|technician|bay)?\b/i.test(combinedText) ||
    /\b(assignment\s*pending|pending\s*assignment)\b/i.test(combinedText);

  const isJobCardCreationPending =
    !isFloor && (
      combinedText.includes('create job card') ||
      combinedText.includes('job card pending') ||
      combinedText.includes('gate entry') ||
      alert.type === 'START_ALERT' ||
      !alert.jobCardId
    );

  let buttonText = 'View Job Details';
  if (isAssignMechanic) {
    buttonText = 'Assign Mechanic Now';
  } else if (isJobCardCreationPending) {
    buttonText = 'Create Job Card Now';
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Top Close Button */}
          <TouchableOpacity
            style={styles.closeIconButton}
            activeOpacity={0.7}
            onPress={onCancel}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color="#64748b" />
          </TouchableOpacity>

          {/* Header with Icon and Notification Title */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, isAssignMechanic ? styles.iconContainerMechanic : styles.iconContainerDefault]}>
              {isAssignMechanic ? (
                <Wrench size={24} color="#d97706" />
              ) : isJobCardCreationPending ? (
                <FilePlus size={24} color="#dc2626" />
              ) : (
                <BellRing size={24} color="#2563eb" />
              )}
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>
                {rawTitle}
              </Text>
            </View>
          </View>

          {/* Notification Message */}
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>
              {rawMsg}
            </Text>
          </View>

          {/* Action Buttons: Cancel and Redirect */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.7}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.redirectButton, isAssignMechanic ? styles.redirectButtonMechanic : styles.redirectButtonPrimary]}
              activeOpacity={0.85}
              onPress={onProceed}
            >
              <Text style={styles.redirectButtonText}>{buttonText}</Text>
              <ArrowRight size={18} color="#ffffff" style={styles.buttonIcon} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  container: {
    position: 'relative',
    width: Math.min(width - 32, 400),
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 25,
  },
  closeIconButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingRight: 32,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerMechanic: {
    backgroundColor: '#fef3c7',
  },
  iconContainerDefault: {
    backgroundColor: '#eff6ff',
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 22,
  },
  messageBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  redirectButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  redirectButtonPrimary: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
  },
  redirectButtonMechanic: {
    backgroundColor: '#d97706',
    shadowColor: '#d97706',
  },
  redirectButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  buttonIcon: {
    marginLeft: 2,
  },
});
