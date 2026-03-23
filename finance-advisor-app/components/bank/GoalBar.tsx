/**
 * GoalBar — Progress bar with goal name, current/target amounts.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';

interface Props {
  name: string;
  currentAmount: number;
  targetAmount: number;
  deadline?: string;
  currency?: string;
}

export default function GoalBar({ name, currentAmount, targetAmount, deadline, currency = 'USD' }: Props) {
  const progress = targetAmount > 0 ? Math.min(currentAmount / targetAmount, 1) : 0;
  const percentage = Math.round(progress * 100);

  const formatAmount = (val: number) =>
    val.toLocaleString('en-US', { style: 'currency', currency, minimumFractionDigits: 0 });

  const getColor = () => {
    if (percentage >= 80) return Colors.success;
    if (percentage >= 40) return Colors.primary;
    return Colors.gold;
  };

  const color = getColor();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.percentage}>{percentage}%</Text>
      </View>

      <View style={styles.trackOuter}>
        <View style={[styles.trackFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.amount}>
          {formatAmount(currentAmount)} <Text style={styles.amountMuted}>/ {formatAmount(targetAmount)}</Text>
        </Text>
        {deadline && (
          <Text style={styles.deadline}>
            Due {new Date(deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  percentage: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  trackOuter: {
    height: 6,
    backgroundColor: Colors.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  amountMuted: {
    color: Colors.textMuted,
  },
  deadline: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
