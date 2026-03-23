/**
 * BalanceSummary — Large balance display with trend indicator.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../../constants/theme';

interface Props {
  totalBalance: number;
  currency?: string;
  trend?: number; // percentage change, positive = up
}

export default function BalanceSummary({ totalBalance, currency = 'USD', trend }: Props) {
  const trendUp = (trend ?? 0) >= 0;
  const formattedBalance = totalBalance.toLocaleString('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Total Balance</Text>
      <Text style={styles.balance}>{formattedBalance}</Text>
      {trend !== undefined && (
        <View style={[styles.trendBadge, trendUp ? styles.trendUp : styles.trendDown]}>
          <Ionicons
            name={trendUp ? 'trending-up' : 'trending-down'}
            size={14}
            color={trendUp ? Colors.success : Colors.error}
          />
          <Text style={[styles.trendText, { color: trendUp ? Colors.success : Colors.error }]}>
            {trendUp ? '+' : ''}{trend.toFixed(1)}% this month
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  balance: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  trendUp: {
    backgroundColor: 'rgba(0, 230, 138, 0.12)',
  },
  trendDown: {
    backgroundColor: 'rgba(255, 71, 87, 0.12)',
  },
  trendText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
});
