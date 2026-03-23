/**
 * LoanDetail — Loan product detail view.
 * Shows: loan type badge, interest range, loan calculator, docs checklist, eligibility.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { Product } from '../../services/api';

interface Props { product: Product; }

export default function LoanDetail({ product }: Props) {
  const d = product.detail || {};
  const s = product.summary || {};
  const benefits: string[] = d.benefits || s.benefits || [];
  const docs: string[] = d.document_checklist || d.docs || [];
  const [loanAmount, setLoanAmount] = useState(50000);
  const [tenure, setTenure] = useState(36);

  const rate = parseFloat(String(s.interest_rate || d.interest_rate || '8').replace(/[^0-9.]/g, '')) || 8;
  const monthlyRate = rate / 100 / 12;
  const monthly = monthlyRate > 0
    ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1)
    : loanAmount / tenure;

  return (
    <View style={styles.container}>
      {/* Type badge + rate */}
      <View style={styles.heroSection}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{product.sub_type || 'personal'} loan</Text>
        </View>
        <Text style={styles.rateLabel}>Interest from</Text>
        <Text style={styles.rateValue}>{s.interest_rate || d.interest_rate || '—'}</Text>
      </View>

      {d.tagline && <Text style={styles.tagline}>{d.tagline}</Text>}

      {/* Loan calculator */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loan Calculator</Text>
        <View style={styles.calcCard}>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Loan Amount</Text>
            <Text style={styles.calcValue}>${loanAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${(loanAmount / 200000) * 100}%` }]} />
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>$5,000</Text>
            <Text style={styles.sliderLabel}>$200,000</Text>
          </View>

          <View style={[styles.calcRow, { marginTop: Spacing.lg }]}>
            <Text style={styles.calcLabel}>Tenure</Text>
            <Text style={styles.calcValue}>{tenure} months</Text>
          </View>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${(tenure / 84) * 100}%` }]} />
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>6 mo</Text>
            <Text style={styles.sliderLabel}>84 mo</Text>
          </View>

          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Estimated Monthly</Text>
            <Text style={styles.resultValue}>${Math.round(monthly).toLocaleString()}</Text>
            <Text style={styles.resultNote}>at {rate}% p.a.</Text>
          </View>
        </View>
      </View>

      {/* Documents checklist */}
      {docs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents Required</Text>
          {docs.map((doc, i) => (
            <View key={i} style={styles.docRow}>
              <View style={styles.docIcon}>
                <Ionicons name="document-text-outline" size={16} color={Colors.loan} />
              </View>
              <Text style={styles.docText}>{doc}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Benefits */}
      {benefits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          {benefits.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.loan} />
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>
      )}

      {d.eligibility && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eligibility</Text>
          <Text style={styles.bodyText}>{typeof d.eligibility === 'string' ? d.eligibility : JSON.stringify(d.eligibility)}</Text>
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
  typeBadge: {
    backgroundColor: 'rgba(255,163,102,0.12)',
    paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.sm, marginBottom: Spacing.md,
  },
  typeBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.loan, textTransform: 'capitalize' },
  rateLabel: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: 4 },
  rateValue: { fontSize: 42, fontWeight: FontWeight.extrabold, color: Colors.loan },
  tagline: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xxl },
  section: { marginBottom: Spacing.xxl },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  calcCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.lg,
  },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  calcLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  calcValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  sliderTrack: { height: 4, backgroundColor: Colors.cardBorder, borderRadius: 2, marginBottom: 4 },
  sliderFill: { height: 4, backgroundColor: Colors.loan, borderRadius: 2 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  resultBox: {
    alignItems: 'center', marginTop: Spacing.xl,
    paddingVertical: Spacing.lg, backgroundColor: 'rgba(255,163,102,0.08)',
    borderRadius: BorderRadius.md,
  },
  resultLabel: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: 4 },
  resultValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.loan },
  resultNote: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  docIcon: {
    width: 32, height: 32, borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255,163,102,0.12)', justifyContent: 'center', alignItems: 'center',
  },
  docText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  benefitText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  bodyText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
});
