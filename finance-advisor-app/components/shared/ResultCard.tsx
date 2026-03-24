/**
 * ResultCard — Shared result screen used by BOTH Traditional and AI purchase paths.
 * Shows: animated checkmark, product name, reference number, key details, next steps, CTAs.
 * NO agent log — that stays in Profile > Agent History.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../../constants/theme';

export interface KeyDetail {
  label: string;
  value: string;
}

interface Props {
  productName: string;
  productType: string;
  referenceNo: string;
  keyDetails: KeyDetail[];
  nextSteps: string;
  onViewActiveProducts: () => void;
  onBrowseMore: () => void;
}

export default function ResultCard({
  productName, productType, referenceNo, keyDetails, nextSteps,
  onViewActiveProducts, onBrowseMore,
}: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Animated checkmark */}
      <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
        <Ionicons name="checkmark" size={48} color={Colors.white} />
      </Animated.View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.title}>Application Complete!</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{productType}</Text>
        </View>
        <Text style={styles.productName}>{productName}</Text>

        {/* Reference number */}
        <View style={styles.refCard}>
          <Text style={styles.refLabel}>Reference Number</Text>
          <Text style={styles.refValue}>{referenceNo}</Text>
        </View>

        {/* Key details */}
        {keyDetails.length > 0 && (
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Your Application</Text>
            {keyDetails.map((d, i) => (
              <View key={i} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{d.label}</Text>
                <Text style={styles.detailValue}>{d.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* What happens next */}
        <View style={styles.nextCard}>
          <Text style={styles.sectionTitle}>What Happens Next</Text>
          <Text style={styles.nextText}>{nextSteps}</Text>
        </View>

        {/* CTAs */}
        <TouchableOpacity style={styles.primaryBtn} onPress={onViewActiveProducts}>
          <Ionicons name="wallet-outline" size={18} color={Colors.navy} />
          <Text style={styles.primaryBtnText}>View in Active Products</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onBrowseMore}>
          <Text style={styles.secondaryBtnText}>Browse more products</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.huge, paddingBottom: Spacing.xxl,
  },
  checkCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.xxl, ...Shadows.lg,
  },
  content: { width: '100%', alignItems: 'center' },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  typeBadge: {
    backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 3, marginBottom: 4,
  },
  typeBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textMuted, textTransform: 'capitalize' },
  productName: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xxl },
  refCard: {
    width: '100%', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.xxl,
  },
  refLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 4 },
  refValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gold, letterSpacing: 1 },
  detailsCard: {
    width: '100%', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.lg, marginBottom: Spacing.xxl,
  },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.cardBorder,
  },
  detailLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  detailValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  nextCard: {
    width: '100%', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.lg, marginBottom: Spacing.xxl,
  },
  nextText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.gold, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, width: '100%', gap: Spacing.sm, ...Shadows.gold, marginBottom: Spacing.md,
  },
  primaryBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.navy },
  secondaryBtn: {
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.cardBorder,
    paddingVertical: Spacing.md, width: '100%', alignItems: 'center',
  },
  secondaryBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
});
