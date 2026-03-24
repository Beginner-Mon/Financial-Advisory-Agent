/**
 * BrowseProductsGrid — Shared 2×3 category grid used on Home (traditional) and AI Guide (AI-assisted).
 * When aiMode=true, each tile shows a ✨ sparkles icon top-right corner.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';

type IoniconsName = keyof typeof Ionicons.glyphMap;

export const PRODUCT_CATEGORIES: { key: string; label: string; icon: IoniconsName; color: string }[] = [
  { key: 'cards', label: 'Cards', icon: 'card', color: Colors.gold },
  { key: 'savings', label: 'Savings', icon: 'shield-checkmark', color: Colors.savings },
  { key: 'loans', label: 'Loans', icon: 'cash', color: Colors.loan },
  { key: 'insurance', label: 'Insurance', icon: 'umbrella', color: Colors.insurance },
  { key: 'investments', label: 'Investments', icon: 'trending-up', color: Colors.investment },
  { key: 'promotions', label: 'Promos', icon: 'gift', color: Colors.scoreYellow },
];

interface Props {
  aiMode?: boolean;
  onCategoryTap: (categoryKey: string) => void;
}

export default function BrowseProductsGrid({ aiMode = false, onCategoryTap }: Props) {
  return (
    <View style={styles.grid}>
      {PRODUCT_CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.key}
          style={styles.tile}
          activeOpacity={0.7}
          onPress={() => onCategoryTap(cat.key)}
        >
          {aiMode && (
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={10} color={Colors.gold} />
            </View>
          )}
          <View style={[styles.iconWrap, { backgroundColor: `${cat.color}18` }]}>
            <Ionicons name={cat.icon} size={24} color={cat.color} />
          </View>
          <Text style={styles.label}>{cat.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  tile: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    position: 'relative',
  },
  aiBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(201,168,76,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
});
