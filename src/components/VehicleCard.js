import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../config/theme';
import { Car, Phone, Clock, ChevronRight, ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';

export default function VehicleCard({ vehicleNumber, whatsappNumber, status, entryType, meta }) {
  const isEntry = status?.toLowerCase() === 'inside' || status?.toLowerCase() === 'entry';
  const statusColor = isEntry ? '#10B981' : '#F59E0B'; // Emerald for entry, Amber for exit
  const statusBg = isEntry ? '#ECFDF5' : '#FFFBEB'; // Soft tints
  const StatusIcon = isEntry ? ArrowDownLeft : ArrowUpRight;

  return (
    <View style={[styles.card, { borderLeftColor: statusColor }]}>
      {/* Icon Badge Wrapper */}
      <View style={[styles.statusIconContainer, { backgroundColor: statusBg }]}>
        <StatusIcon size={18} color={statusColor} />
      </View>

      <View style={styles.leftContent}>
        {/* Top Row: Plate Number + Status Badge */}
        <View style={styles.headerRow}>
          <View style={styles.plateRow}>
            <Car size={15} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.vehicleNumber}>{vehicleNumber}</Text>
          </View>
          <View style={styles.badgesRow}>
            {entryType && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{entryType.toUpperCase()}</Text>
              </View>
            )}
            <View style={[styles.statusLabelBadge, { backgroundColor: statusBg, borderColor: isEntry ? '#A7F3D0' : '#FDE68A' }]}>
              <Text style={[styles.statusLabelBadgeText, { color: statusColor }]}>
                {isEntry ? 'ENTRY' : 'EXIT'}
              </Text>
            </View>
          </View>
        </View>

        {/* WhatsApp Info Row */}
        <View style={styles.infoRow}>
          <Phone size={13} color={COLORS.muted} style={{ marginRight: 6 }} />
          <Text style={styles.ownerText}>{whatsappNumber || 'N/A'}</Text>
        </View>

        {/* Timestamp Info Row */}
        <View style={styles.infoRow}>
          <Clock size={13} color={COLORS.muted} style={{ marginRight: 6 }} />
          <Text style={styles.metaText}>{meta}</Text>
        </View>
      </View>

      {/* Right chevron indicator */}
      <View style={styles.chevronWrap}>
        <ChevronRight size={18} color={COLORS.muted} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statusIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leftContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  plateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleNumber: {
    color: COLORS.secondary,
    fontSize: 15,
    fontFamily: FONTS.inter,
    // fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ownerText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontFamily: FONTS.inter,
  },
  typeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: '#BAE6FD',
  },
  typeBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.inter,
    // fontWeight: 'bold',
    color: COLORS.primary,
  },
  statusLabelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 0.5,
  },
  statusLabelBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.inter,
    // fontWeight: 'bold',
  },
  metaText: {
    color: COLORS.muted,
    fontSize: 12,
    fontFamily: FONTS.inter,
  },
  chevronWrap: {
    marginLeft: 12,
  },
});

