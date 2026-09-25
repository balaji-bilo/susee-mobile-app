import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';
import { radius, spacing } from '../../../common/config/theme';

export function RecordDetailSkeleton() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={styles.heroCard}>
        <View style={styles.heroRow}>
          <SkeletonLoader style={styles.avatarPlaceholder} />
          <View style={styles.heroMeta}>
            <SkeletonLoader style={styles.ownerPlaceholder} />
            <SkeletonLoader style={styles.vehiclePlaceholder} />
          </View>
          <SkeletonLoader style={styles.platePlaceholder} />
        </View>
        <View style={styles.divider} />
        <View style={styles.heroFooter}>
          <SkeletonLoader style={styles.footerTextPlaceholder} />
          <SkeletonLoader style={styles.statusPlaceholder} />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <SkeletonLoader style={styles.headerIconPlaceholder} />
          <SkeletonLoader style={styles.headerTitlePlaceholder} />
        </View>
        <View style={styles.specGrid}>
          {[1, 2, 3, 4, 5, 6].map((val) => (
            <View key={val} style={styles.gridCell}>
              <SkeletonLoader style={styles.cellLabelPlaceholder} />
              <SkeletonLoader style={styles.cellValuePlaceholder} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <SkeletonLoader style={styles.headerIconPlaceholder} />
          <SkeletonLoader style={styles.headerTitlePlaceholder} />
        </View>
        {[1, 2, 3, 4].map((val) => (
          <View key={val} style={styles.contactRow}>
            <SkeletonLoader style={styles.contactIconPlaceholder} />
            <View style={styles.contactDetail}>
              <SkeletonLoader style={styles.contactLabelPlaceholder} />
              <SkeletonLoader style={styles.contactValuePlaceholder} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <SkeletonLoader style={styles.headerIconPlaceholder} />
          <SkeletonLoader style={styles.headerTitlePlaceholder} />
        </View>
        <SkeletonLoader style={styles.tableHeaderPlaceholder} />
        {[1, 2].map((val) => (
          <View key={val} style={styles.tableRow}>
            <SkeletonLoader style={styles.tableItemPlaceholder} />
            <SkeletonLoader style={styles.tableQtyPlaceholder} />
            <SkeletonLoader style={styles.tablePricePlaceholder} />
          </View>
        ))}
        <SkeletonLoader style={styles.billingCardPlaceholder} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  heroMeta: {
    flex: 1,
    gap: 6,
  },
  ownerPlaceholder: {
    width: '60%',
    height: 16,
  },
  vehiclePlaceholder: {
    width: '40%',
    height: 12,
  },
  platePlaceholder: {
    width: 80,
    height: 24,
    borderRadius: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: spacing.md,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerTextPlaceholder: {
    width: 90,
    height: 12,
  },
  statusPlaceholder: {
    width: 65,
    height: 18,
    borderRadius: 6,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerIconPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 3,
  },
  headerTitlePlaceholder: {
    width: 150,
    height: 14,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.md,
  },
  gridCell: {
    width: '50%',
    gap: 6,
  },
  cellLabelPlaceholder: {
    width: '50%',
    height: 10,
  },
  cellValuePlaceholder: {
    width: '70%',
    height: 14,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  contactIconPlaceholder: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  contactDetail: {
    flex: 1,
    gap: 4,
  },
  contactLabelPlaceholder: {
    width: '40%',
    height: 10,
  },
  contactValuePlaceholder: {
    width: '60%',
    height: 14,
  },
  tableHeaderPlaceholder: {
    width: '100%',
    height: 28,
    borderRadius: 6,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  tableItemPlaceholder: {
    width: '50%',
    height: 12,
  },
  tableQtyPlaceholder: {
    width: '15%',
    height: 12,
  },
  tablePricePlaceholder: {
    width: '20%',
    height: 12,
  },
  billingCardPlaceholder: {
    width: '100%',
    height: 110,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
});
