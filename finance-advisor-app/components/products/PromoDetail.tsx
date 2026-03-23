/**
 * PromoDetail — Promotion product detail view.
 * Shows: offer headline, expiry badge, eligibility, T&C accordion, activation steps.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { Product } from '../../services/api';

interface Props {
  product: Product;
  onActivate?: () => void;
}

export default function PromoDetail({ product, onActivate }: Props) {
  const d = product.detail || {};
  const s = product.summary || {};
  const steps: string[] = d.activation_steps || d.steps || [];
  const [expandedTerms, setExpandedTerms] = useState(false);

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={styles.heroSection}>
        <View style={styles.giftIcon}>
          <Ionicons name="gift" size={40} color={Colors.scoreYellow} />
        </View>
        <Text style={styles.offerName}>{product.name}</Text>
        <Text style={styles.offerTagline}>{d.tagline || s.tagline || 'Special promotion'}</Text>

        {/* Expiry badge */}
        {(s.expiry || d.expiry) && (
          <View style={styles.expiryBadge}>
            <Ionicons name="time-outline" size={14} color={Colors.warning} />
            <Text style={styles.expiryText}>Expires: {s.expiry || d.expiry}</Text>
          </View>
        )}
      </View>

      {/* Benefits / what you get */}
      {(d.benefits || s.benefits) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What You Get</Text>
          {(d.benefits || s.benefits || []).map((b: string, i: number) => (
            <View key={i} style={styles.benefitRow}>
              <Ionicons name="star" size={16} color={Colors.scoreYellow} />
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Eligibility */}
      {(d.eligibility || s.eligibility) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eligibility</Text>
          <View style={styles.eligibilityCard}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.eligibilityText}>
              {typeof (d.eligibility || s.eligibility) === 'string'
                ? (d.eligibility || s.eligibility)
                : 'You are eligible for this promotion'}
            </Text>
          </View>
        </View>
      )}

      {/* Activation steps */}
      {steps.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Activate</Text>
          {steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      )}

      {/* T&C accordion */}
      {d.terms_summary && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setExpandedTerms(!expandedTerms)}
          >
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            <Ionicons name={expandedTerms ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          {expandedTerms && <Text style={styles.bodyText}>{d.terms_summary}</Text>}
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
  giftIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,217,61,0.12)', justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  offerName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center', paddingHorizontal: Spacing.lg, marginBottom: 4 },
  offerTagline: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.lg },
  expiryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: Spacing.lg, backgroundColor: 'rgba(255,217,61,0.12)',
    paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.sm,
  },
  expiryText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.warning },
  section: { marginBottom: Spacing.xxl },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  benefitText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  eligibilityCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: 'rgba(0,230,138,0.08)', borderRadius: BorderRadius.md, padding: Spacing.lg,
  },
  eligibilityText: { flex: 1, fontSize: FontSize.sm, color: Colors.success },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.md },
  stepNumber: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.scoreYellow, justifyContent: 'center', alignItems: 'center',
  },
  stepNumberText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.navy },
  stepText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bodyText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
});
