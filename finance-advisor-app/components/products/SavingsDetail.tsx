/**
 * SavingsDetail — Savings/deposit product detail view.
 * Shows: interest rate hero, account type badge, rate tiers, lock-in, deposit insurance.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { Product } from '../../services/api';

interface Props { product: Product; }

export default function SavingsDetail({ product }: Props) {
  const d = product.detail || {};
  const s = product.summary || {};
  const benefits: string[] = d.benefits || s.benefits || [];
  const rateTiers: { tier: string; rate: string }[] = d.rate_tiers || [];

  return (
    <View style={styles.container}>
      {/* Hero rate */}
      <View style={styles.rateHero}>
        <Text style={styles.rateLabel}>Interest Rate</Text>
        <Text style={styles.rateValue}>{s.interest_rate || s.rate || d.interest_rate || '—'}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{product.sub_type || 'savings'}</Text>
        </View>
      </View>

      {d.tagline && <Text style={styles.tagline}>{d.tagline}</Text>}

      {/* Key metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Ionicons name="lock-closed" size={18} color={Colors.textMuted} />
          <Text style={styles.metricValue}>{d.lock_in_period || s.lock_in_period || 'None'}</Text>
          <Text style={styles.metricLabel}>Lock-in</Text>
        </View>
        <View style={styles.metric}>
          <Ionicons name="cash-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.metricValue}>{d.min_deposit || s.min_deposit || '$0'}</Text>
          <Text style={styles.metricLabel}>Min Deposit</Text>
        </View>
        <View style={styles.metric}>
          <Ionicons name="shield-checkmark" size={18} color={Colors.success} />
          <Text style={styles.metricValue}>{d.deposit_insurance ? 'Yes' : 'PDIC'}</Text>
          <Text style={styles.metricLabel}>Insured</Text>
        </View>
      </View>

      {/* Rate tiers */}
      {rateTiers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rate Tiers</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableHeaderText}>Balance Tier</Text>
              <Text style={styles.tableHeaderText}>Rate</Text>
            </View>
            {rateTiers.map((t, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                <Text style={styles.tableKey}>{t.tier}</Text>
                <Text style={styles.tableValueGold}>{t.rate}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Benefits */}
      {benefits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benefits</Text>
          {benefits.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.savings} />
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>
      )}

      {d.terms_summary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms</Text>
          <Text style={styles.bodyText}>{d.terms_summary}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.lg },
  rateHero: {
    alignItems: 'center', paddingVertical: Spacing.xxxl,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, marginVertical: Spacing.xxl,
  },
  rateLabel: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.sm },
  rateValue: { fontSize: 48, fontWeight: FontWeight.extrabold, color: Colors.savings },
  typeBadge: {
    marginTop: Spacing.md, backgroundColor: 'rgba(0,212,170,0.12)',
    paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.sm,
  },
  typeBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.savings, textTransform: 'capitalize' },
  tagline: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xxl },
  metricsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, paddingVertical: Spacing.lg, marginBottom: Spacing.xxl,
  },
  metric: { alignItems: 'center', gap: 4 },
  metricValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  metricLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  section: { marginBottom: Spacing.xxl },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  table: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden' },
  tableHeader: { backgroundColor: Colors.surfaceLight },
  tableHeaderText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  tableRowAlt: { backgroundColor: 'rgba(255,255,255,0.02)' },
  tableKey: { fontSize: FontSize.sm, color: Colors.textSecondary },
  tableValueGold: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.savings },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  benefitText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  bodyText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
});
