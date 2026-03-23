/**
 * CardVisual — Animated navy/gold card with network logo, last 4 digits.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { LinearGradient } from '../../utils/LinearGradient';

interface Props {
  type: string;
  lastFour: string;
  network: string;
  status: string;
  spendLimit?: number;
}

export default function CardVisual({ type, lastFour, network, status, spendLimit }: Props) {
  const isFrozen = status === 'frozen';
  const isCredit = type === 'credit';

  return (
    <View style={[styles.card, isFrozen && styles.cardFrozen]}>
      {/* Gradient overlay effect */}
      <View style={styles.gradientOverlay} />
      <View style={styles.shineEffect} />

      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.chipContainer}>
          <View style={styles.chip} />
          <View style={styles.chipLines} />
        </View>
        <View style={styles.networkBadge}>
          <Text style={styles.networkText}>{network.toUpperCase()}</Text>
        </View>
      </View>

      {/* Card number */}
      <View style={styles.numberRow}>
        <Text style={styles.dots}>••••</Text>
        <Text style={styles.dots}>••••</Text>
        <Text style={styles.dots}>••••</Text>
        <Text style={styles.lastFour}>{lastFour}</Text>
      </View>

      {/* Bottom row */}
      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.labelSmall}>{isCredit ? 'CREDIT CARD' : 'DEBIT CARD'}</Text>
          <Text style={styles.cardHolder}>DEMO USER</Text>
        </View>
        <View style={styles.rightInfo}>
          {spendLimit && (
            <Text style={styles.limitText}>
              Limit: ${(spendLimit / 1000).toFixed(0)}K
            </Text>
          )}
          {isFrozen && (
            <View style={styles.frozenBadge}>
              <Ionicons name="snow-outline" size={12} color={Colors.primary} />
              <Text style={styles.frozenText}>FROZEN</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 1.586, // Standard card ratio
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...Shadows.gold,
  },
  cardFrozen: {
    opacity: 0.7,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '60%',
    height: '100%',
    backgroundColor: 'rgba(201, 168, 76, 0.08)',
    borderTopLeftRadius: 200,
    borderBottomLeftRadius: 200,
  },
  shineEffect: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(201, 168, 76, 0.06)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    width: 36,
    height: 26,
    borderRadius: 4,
    backgroundColor: Colors.gold,
    marginRight: 4,
  },
  chipLines: {
    width: 8,
    height: 26,
    borderRadius: 2,
    backgroundColor: Colors.goldDark,
  },
  networkBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  networkText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.goldLight,
    letterSpacing: 2,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  dots: {
    fontSize: FontSize.lg,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  lastFour: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.gold,
    letterSpacing: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  labelSmall: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  cardHolder: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  rightInfo: {
    alignItems: 'flex-end',
    gap: 4,
  },
  limitText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  frozenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(79, 140, 255, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  frozenText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    letterSpacing: 1,
  },
});
