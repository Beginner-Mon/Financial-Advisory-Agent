/**
 * AccountCard — Pill card with account type, masked number, balance.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../../constants/theme';

interface Props {
  accountId: string;
  type: string;
  accountNo: string;
  balance: number;
  currency?: string;
  isActive?: boolean;
  onPress?: () => void;
}

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  checking: 'wallet-outline',
  savings: 'shield-checkmark-outline',
  investment: 'trending-up-outline',
  credit: 'card-outline',
};

const TYPE_COLORS: Record<string, string> = {
  checking: Colors.primary,
  savings: Colors.accent,
  investment: Colors.investment,
  credit: Colors.gold,
};

export default function AccountCard({
  accountId,
  type,
  accountNo,
  balance,
  currency = 'USD',
  isActive = false,
  onPress,
}: Props) {
  const icon = TYPE_ICONS[type] || 'wallet-outline';
  const color = TYPE_COLORS[type] || Colors.primary;
  const masked = `••${accountNo.slice(-4)}`;
  const formatted = balance.toLocaleString('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });

  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.cardActive, { borderColor: isActive ? color : Colors.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.type}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
        <Text style={styles.accountNo}>{masked}</Text>
      </View>
      <Text style={styles.balance}>{formatted}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginRight: Spacing.md,
    minWidth: 220,
    ...Shadows.sm,
  },
  cardActive: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1.5,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  type: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  accountNo: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  balance: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
});
