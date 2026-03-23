/**
 * TransactionRow — Merchant, amount (colour-coded +/-), category badge, date.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';

interface Props {
  merchant: string;
  amount: number;
  category: string;
  date: string;
  reference?: string;
  currency?: string;
  onPress?: () => void;
}

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  food: 'restaurant-outline',
  dining: 'restaurant-outline',
  transport: 'car-outline',
  shopping: 'bag-handle-outline',
  entertainment: 'game-controller-outline',
  utilities: 'flash-outline',
  transfer: 'swap-horizontal-outline',
  salary: 'cash-outline',
  subscription: 'repeat-outline',
  healthcare: 'medkit-outline',
  travel: 'airplane-outline',
  groceries: 'cart-outline',
  rent: 'home-outline',
};

const CATEGORY_COLORS: Record<string, string> = {
  food: '#FF9F43',
  dining: '#FF9F43',
  transport: '#54A0FF',
  shopping: '#FF6B6B',
  entertainment: '#C77DFF',
  utilities: '#FFD93D',
  transfer: '#4F8CFF',
  salary: '#00E68A',
  subscription: '#FF6B6B',
  healthcare: '#FF6B6B',
  travel: '#54A0FF',
  groceries: '#00D4AA',
  rent: '#FFA366',
};

export default function TransactionRow({
  merchant,
  amount,
  category,
  date,
  reference,
  currency = 'USD',
  onPress,
}: Props) {
  const isPositive = amount >= 0;
  const icon = CATEGORY_ICONS[category] || 'receipt-outline';
  const catColor = CATEGORY_COLORS[category] || Colors.textMuted;

  const formattedAmount = `${isPositive ? '+' : ''}${amount.toLocaleString('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  })}`;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconCircle, { backgroundColor: `${catColor}18` }]}>
        <Ionicons name={icon} size={18} color={catColor} />
      </View>
      <View style={styles.info}>
        <Text style={styles.merchant} numberOfLines={1}>{merchant}</Text>
        <View style={styles.meta}>
          <View style={[styles.categoryBadge, { backgroundColor: `${catColor}18` }]}>
            <Text style={[styles.categoryText, { color: catColor }]}>{category}</Text>
          </View>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
      </View>
      <Text style={[styles.amount, { color: isPositive ? Colors.amountPositive : Colors.amountNegative }]}>
        {formattedAmount}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.cardBorder,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  merchant: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textTransform: 'capitalize',
  },
  date: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  amount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginLeft: Spacing.sm,
  },
});
