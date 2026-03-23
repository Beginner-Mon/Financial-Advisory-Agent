/**
 * CardDetail — Credit/debit card product detail view.
 * Shows: card visual, annual fee, rewards rate, benefits, fees table, eligibility.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { Product } from '../../services/api';
import CardVisual from '../bank/CardVisual';

interface Props { product: Product; }

export default function CardDetail({ product }: Props) {
  const d = product.detail || {};
  const s = product.summary || {};
  const benefits: string[] = d.benefits || s.benefits || [];
  const fees = d.fees || {};
  const faqs: { q: string; a: string }[] = d.faqs || [];

  return (
    <View style={styles.container}>
      {/* Card visual */}
      <View style={styles.cardCenter}>
        <CardVisual
          lastFour={s.last_four || '0000'}
          network={s.network || 'VISA'}
          type={product.sub_type || 'credit'}
          status="active"
        />
      </View>

      {/* Tagline */}
      {d.tagline && <Text style={styles.tagline}>{d.tagline}</Text>}

      {/* Key metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{s.annual_fee ?? fees.annual_fee ?? '$0'}</Text>
          <Text style={styles.metricLabel}>Annual Fee</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{s.cashback_rate || s.rewards_rate || s.interest_rate || '—'}</Text>
          <Text style={styles.metricLabel}>Rewards Rate</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{product.risk_level || '—'}</Text>
          <Text style={styles.metricLabel}>Risk Level</Text>
        </View>
      </View>

      {/* Benefits */}
      {benefits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benefits</Text>
          {benefits.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Fees table */}
      {Object.keys(fees).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fees & Charges</Text>
          <View style={styles.table}>
            {Object.entries(fees).map(([key, value], i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                <Text style={styles.tableKey}>{key.replace(/_/g, ' ')}</Text>
                <Text style={styles.tableValue}>{String(value)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Eligibility */}
      {d.eligibility && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eligibility</Text>
          <Text style={styles.bodyText}>{typeof d.eligibility === 'string' ? d.eligibility : JSON.stringify(d.eligibility)}</Text>
        </View>
      )}

      {/* FAQs */}
      {faqs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FAQs</Text>
          {faqs.map((faq, i) => (
            <View key={i} style={styles.faqItem}>
              <Text style={styles.faqQ}>{faq.q}</Text>
              <Text style={styles.faqA}>{faq.a}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Terms */}
      {d.terms_summary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <Text style={styles.bodyText}>{d.terms_summary}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.lg },
  cardCenter: { alignItems: 'center', marginVertical: Spacing.xxl },
  tagline: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xxl, paddingHorizontal: Spacing.lg },
  metricsRow: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, paddingVertical: Spacing.lg, marginBottom: Spacing.xxl,
  },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gold, marginBottom: 4 },
  metricLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  metricDivider: { width: 1, backgroundColor: Colors.cardBorder },
  section: { marginBottom: Spacing.xxl },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  benefitText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  table: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  tableRowAlt: { backgroundColor: Colors.surfaceLight },
  tableKey: { fontSize: FontSize.sm, color: Colors.textSecondary, textTransform: 'capitalize', flex: 1 },
  tableValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  bodyText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  faqItem: { marginBottom: Spacing.lg },
  faqQ: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: 4 },
  faqA: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
});
