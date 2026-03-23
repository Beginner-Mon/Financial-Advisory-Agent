/**
 * InvestmentDetail — Investment/fund product detail view.
 * Shows: fund type, risk rating visual (1-7), historical returns, min investment, platform fee.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { Product } from '../../services/api';

interface Props { product: Product; }

const RISK_LEVELS = [1, 2, 3, 4, 5, 6, 7];

export default function InvestmentDetail({ product }: Props) {
  const d = product.detail || {};
  const s = product.summary || {};
  const benefits: string[] = d.benefits || s.benefits || [];
  const returns = d.historical_returns || {};
  const [returnPeriod, setReturnPeriod] = useState<'1y' | '3y' | '5y'>('1y');

  const riskNum = d.risk_rating || (product.risk_level === 'low' ? 2 : product.risk_level === 'moderate' ? 4 : 6);

  return (
    <View style={styles.container}>
      {/* Fund type + hero */}
      <View style={styles.heroSection}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{product.sub_type || 'mutual fund'}</Text>
        </View>
        <Text style={styles.returnLabel}>Projected Return</Text>
        <Text style={styles.returnValue}>{s.projected_return || s.return_rate || d.projected_return || '—'}</Text>
      </View>

      {d.tagline && <Text style={styles.tagline}>{d.tagline}</Text>}

      {/* Risk rating */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Risk Rating</Text>
        <View style={styles.riskCard}>
          <View style={styles.riskBar}>
            {RISK_LEVELS.map((level) => (
              <View
                key={level}
                style={[
                  styles.riskBlock,
                  {
                    backgroundColor: level <= riskNum
                      ? level <= 2 ? Colors.success : level <= 4 ? Colors.warning : Colors.error
                      : Colors.surfaceLight,
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.riskLabels}>
            <Text style={styles.riskLabel}>Low</Text>
            <Text style={styles.riskLabel}>Moderate</Text>
            <Text style={styles.riskLabel}>High</Text>
          </View>
        </View>
      </View>

      {/* Historical returns */}
      {Object.keys(returns).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historical Returns</Text>
          <View style={styles.returnsCard}>
            <View style={styles.periodTabs}>
              {(['1y', '3y', '5y'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodTab, returnPeriod === p && styles.periodTabActive]}
                  onPress={() => setReturnPeriod(p)}
                >
                  <Text style={[styles.periodTabText, returnPeriod === p && styles.periodTabTextActive]}>{p.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.returnsValue}>{returns[returnPeriod] || returns['1y'] || '—'}</Text>
            <Text style={styles.returnsNote}>Past performance does not guarantee future results</Text>
          </View>
        </View>
      )}

      {/* Key metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Min Investment</Text>
          <Text style={styles.metricValue}>{d.min_investment || s.min_investment || '$100'}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Platform Fee</Text>
          <Text style={styles.metricValue}>{d.platform_fee || s.platform_fee || '—'}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Lock-in</Text>
          <Text style={styles.metricValue}>{d.lock_in || s.lock_in || 'None'}</Text>
        </View>
      </View>

      {/* Benefits */}
      {benefits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          {benefits.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.investment} />
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>
      )}

      {d.terms_summary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prospectus Summary</Text>
          <Text style={styles.bodyText}>{d.terms_summary}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.lg },
  heroSection: {
    alignItems: 'center', paddingVertical: Spacing.xxxl,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, marginVertical: Spacing.xxl,
  },
  typeBadge: {
    backgroundColor: 'rgba(79,140,255,0.12)',
    paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.sm, marginBottom: Spacing.md,
  },
  typeBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.investment, textTransform: 'capitalize' },
  returnLabel: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: 4 },
  returnValue: { fontSize: 42, fontWeight: FontWeight.extrabold, color: Colors.investment },
  tagline: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xxl },
  section: { marginBottom: Spacing.xxl },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  riskCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.lg,
  },
  riskBar: { flexDirection: 'row', gap: 4, marginBottom: Spacing.sm },
  riskBlock: { flex: 1, height: 8, borderRadius: 4 },
  riskLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  riskLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  returnsCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.lg, alignItems: 'center',
  },
  periodTabs: { flexDirection: 'row', backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.sm, overflow: 'hidden', marginBottom: Spacing.lg },
  periodTab: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  periodTabActive: { backgroundColor: Colors.investment },
  periodTabText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textMuted },
  periodTabTextActive: { color: Colors.white },
  returnsValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.investment, marginBottom: 4 },
  returnsNote: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', fontStyle: 'italic' },
  metricsRow: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, paddingVertical: Spacing.lg, marginBottom: Spacing.xxl,
  },
  metric: { flex: 1, alignItems: 'center' },
  metricLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 4 },
  metricValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  metricDivider: { width: 1, backgroundColor: Colors.cardBorder },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  benefitText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  bodyText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
});
