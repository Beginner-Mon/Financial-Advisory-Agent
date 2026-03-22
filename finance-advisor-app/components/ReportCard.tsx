import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { StructuredReport, Recommendation } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

interface ReportCardProps {
  report: StructuredReport;
}

export default function ReportCard({ report }: ReportCardProps) {
  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'conservative': return Colors.riskConservative;
      case 'aggressive': return Colors.riskAggressive;
      default: return Colors.riskModerate;
    }
  };

  return (
    <View style={styles.container}>
      {/* Risk Profile */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.sectionTitle}>Risk Profile</Text>
          <View style={[styles.badge, { backgroundColor: getRiskColor(report.risk_profile) + '30' }]}>
            <Text style={[styles.badgeText, { color: getRiskColor(report.risk_profile) }]}>
              {report.risk_profile || 'Moderate'}
            </Text>
          </View>
        </View>
      </View>

      {/* Goals */}
      {report.goals && report.goals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Goals</Text>
          {report.goals.map((goal, index) => (
            <View key={index} style={styles.listItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.accent} />
              <Text style={styles.listText}>{goal}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Plan */}
      {report.plan_steps && report.plan_steps.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Action Plan</Text>
          {report.plan_steps.map((step, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.listText}>{step}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Product Recommendations</Text>
          {report.recommendations.map((rec: Recommendation, index) => (
            <View key={index} style={styles.productCard}>
              <View style={styles.productHeader}>
                <Text style={styles.productName}>{rec.name}</Text>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{rec.type}</Text>
                </View>
              </View>
              <Text style={styles.returnText}>Return / Rate: {rec.return_pct}%</Text>
              <Text style={styles.rationaleText}>{rec.rationale}</Text>
              <Text style={styles.creditText}>Min Credit: {rec.min_credit}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  section: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: Spacing.sm,
  },
  lastSection: {
    borderBottomWidth: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  listText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: Colors.textPrimary,
    fontSize: FontSize.xs,
    fontWeight: 'bold',
  },
  productCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
    flex: 1,
  },
  typeBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  typeText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
  },
  returnText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  rationaleText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  creditText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
});
