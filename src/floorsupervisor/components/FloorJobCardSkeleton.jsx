import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { colors } from '../../common/config/theme';

function SkeletonBlock({ style, width, height, borderRadius = 6 }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        width !== undefined && { width },
        height !== undefined && { height },
        borderRadius !== undefined && { borderRadius },
        style,
        { opacity },
      ]}
    />
  );
}

export function FloorJobCardSkeleton() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Card Skeleton */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.accentBar} />
          <View style={{ flex: 1, gap: 6, marginLeft: 10 }}>
            <SkeletonBlock width={160} height={20} borderRadius={4} />
            <SkeletonBlock width={220} height={13} borderRadius={4} />
          </View>
          <SkeletonBlock width={36} height={36} borderRadius={18} />
        </View>
      </View>

      {/* 2. Job Progress Stepper Skeleton */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <SkeletonBlock width={18} height={18} borderRadius={4} />
          <SkeletonBlock width={130} height={16} borderRadius={4} />
        </View>

        <View style={styles.stepperContainer}>
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <View key={idx} style={styles.timelineRow}>
              <View style={styles.timelineIconCol}>
                <SkeletonBlock width={18} height={18} borderRadius={9} />
                {idx < 6 && <View style={styles.timelineLine} />}
              </View>
              <View style={[styles.timelineTextCol, idx === 6 && { paddingBottom: 0 }]}>
                <SkeletonBlock width="45%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                <SkeletonBlock width="75%" height={11} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 3. Vehicle & Owner Details Skeleton */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <SkeletonBlock width={18} height={18} borderRadius={4} />
          <SkeletonBlock width={170} height={16} borderRadius={4} />
        </View>

        <View style={styles.gridContainer}>
          {[1, 2, 3, 4, 5, 6].map((val) => (
            <View key={val} style={styles.gridCol}>
              <SkeletonBlock width={80} height={11} borderRadius={3} style={{ marginBottom: 6 }} />
              <SkeletonBlock width="90%" height={15} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>

      {/* 4. Selected Services Skeleton */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderBetween}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <SkeletonBlock width={18} height={18} borderRadius={4} />
            <SkeletonBlock width={140} height={16} borderRadius={4} />
          </View>
          <SkeletonBlock width={85} height={26} borderRadius={6} />
        </View>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <SkeletonBlock width={100} height={12} borderRadius={3} />
          <SkeletonBlock width={30} height={12} borderRadius={3} />
          <SkeletonBlock width={60} height={12} borderRadius={3} />
          <SkeletonBlock width={45} height={12} borderRadius={3} />
        </View>

        {/* Table Rows */}
        {[1, 2, 3].map((val) => (
          <View key={val} style={styles.tableRow}>
            <SkeletonBlock width="35%" height={14} borderRadius={4} />
            <SkeletonBlock width={24} height={14} borderRadius={4} />
            <SkeletonBlock width={75} height={20} borderRadius={6} />
            <SkeletonBlock width={50} height={14} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* 5. Additional Work Skeleton */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <SkeletonBlock width={18} height={18} borderRadius={4} />
          <SkeletonBlock width={180} height={16} borderRadius={4} />
        </View>

        <View style={styles.addlCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <SkeletonBlock width={110} height={16} borderRadius={4} />
            <SkeletonBlock width={80} height={20} borderRadius={10} />
          </View>
          <SkeletonBlock width="100%" height={38} borderRadius={8} />
        </View>
      </View>

      {/* 6. Estimate & Cost Summary Skeleton */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <SkeletonBlock width={18} height={18} borderRadius={4} />
          <SkeletonBlock width={180} height={16} borderRadius={4} />
        </View>

        {[1, 2, 3].map((val) => (
          <View key={val} style={styles.summaryRow}>
            <SkeletonBlock width="40%" height={14} borderRadius={4} />
            <SkeletonBlock width="25%" height={14} borderRadius={4} />
          </View>
        ))}
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <SkeletonBlock width="35%" height={17} borderRadius={4} />
          <SkeletonBlock width="30%" height={18} borderRadius={4} />
        </View>
      </View>
    </ScrollView>
  );
}

export default FloorJobCardSkeleton;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  skeletonBase: {
    backgroundColor: '#CBD5E1',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accentBar: {
    width: 4,
    height: 36,
    backgroundColor: colors.primary || '#0D9488',
    borderRadius: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  stepperContainer: {
    paddingTop: 4,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineIconCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
    minHeight: 22,
  },
  timelineTextCol: {
    flex: 1,
    paddingBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCol: {
    width: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  addlCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
});
