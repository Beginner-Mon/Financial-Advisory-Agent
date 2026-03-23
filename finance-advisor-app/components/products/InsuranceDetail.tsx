/**
 * InsuranceDetail — Insurance product detail view.
 * Shows: coverage summary, premium estimate toggle, exclusions, claim process.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { Product } from '../../services/api';

interface Props { product: Product; }

export default function InsuranceDetail({ product }: Props) {
  const d = product.detail || {};
  const s = product.summary || {};
  const benefits: string[] = d.benefits || s.benefits || [];
  const exclusions: string[] = d.exclusions || [];
  const claimSteps: string[] = d.claim_process || d.claim_steps || [];
  const [premiumMode, setPremiumMode] = useState<'monthly' | 'annual'>('monthly');
  const [expandedExclusions, setExpandedExclusions] = useState(false);

  const monthlyPremium = s.premium_monthly || d.premium_monthly || s.premium || '—';
  const annualPremium = s.premium_annual || d.premium_annual || '—';

  return (
    <View style={styles.container}>
      {/* Coverage hero */}
      <View style={styles.heroSection}>
        <Ionicons name="umbrella" size={40} color={Colors.insurance} />
        <Text style={styles.coverageLabel}>Coverage up to</Text>
        <Text style={styles.coverageValue}>{s.coverage || d.coverage || s.sum_assured || '—'}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{product.sub_type || 'life'} insurance</Text>
        </View>
      </View>

      {d.tagline && <Text style={styles.tagline}>{d.tagline}</Text>}

      {/* Premium estimate */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Premium Estimate</Text>
        <View style={styles.premiumCard}>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, premiumMode === 'monthly' && styles.toggleActive]}
              onPress={() => setPremiumMode('monthly')}
            >
              <Text style={[styles.toggleText, premiumMode === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, premiumMode === 'annual' && styles.toggleActive]}
              onPress={() => setPremiumMode('annual')}
            >
              <Text style={[styles.toggleText, premiumMode === 'annual' && styles.toggleTextActive]}>Annual</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.premiumValue}>
            {premiumMode === 'monthly' ? monthlyPremium : annualPremium}
          </Text>
          <Text style={styles.premiumNote}>Actual premium may vary based on health assessment</Text>
        </View>
      </View>

      {/* Benefits */}
      {benefits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's Covered</Text>
          {benefits.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.insurance} />
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Exclusions accordion */}
      {exclusions.length > 0 && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setExpandedExclusions(!expandedExclusions)}
          >
            <Text style={styles.sectionTitle}>Exclusions</Text>
            <Ionicons name={expandedExclusions ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          {expandedExclusions && exclusions.map((ex, i) => (
            <View key={i} style={styles.exclusionRow}>
              <Ionicons name="close-circle" size={16} color={Colors.error} />
              <Text style={styles.exclusionText}>{ex}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Claim process */}
      {claimSteps.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Claim Process</Text>
          {claimSteps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
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
  heroSection: {
    alignItems: 'center', paddingVertical: Spacing.xxxl,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, marginVertical: Spacing.xxl,
  },
  coverageLabel: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.md, marginBottom: 4 },
  coverageValue: { fontSize: 42, fontWeight: FontWeight.extrabold, color: Colors.insurance },
  typeBadge: {
    marginTop: Spacing.md, backgroundColor: 'rgba(199,125,255,0.12)',
    paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.sm,
  },
  typeBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.insurance, textTransform: 'capitalize' },
  tagline: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xxl },
  section: { marginBottom: Spacing.xxl },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  premiumCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.lg, alignItems: 'center',
  },
  toggleRow: { flexDirection: 'row', backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.sm, overflow: 'hidden', marginBottom: Spacing.lg },
  toggleBtn: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  toggleActive: { backgroundColor: Colors.insurance },
  toggleText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textMuted },
  toggleTextActive: { color: Colors.white },
  premiumValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.insurance, marginBottom: 4 },
  premiumNote: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  benefitText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exclusionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  exclusionText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.md },
  stepNumber: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.insurance, justifyContent: 'center', alignItems: 'center',
  },
  stepNumberText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.white },
  stepText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  bodyText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
});
