/**
 * ProductChip — Inline product card for AI Guide section on Home screen.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';

interface Props {
  id: string;
  name: string;
  productType: string;
  riskLevel?: string;
  metric?: string;
  tagline?: string;
}

export default function ProductChip({ id, name, productType, riskLevel, metric, tagline }: Props) {
  const router = useRouter();

  const riskColor = riskLevel === 'low' ? Colors.accent
    : riskLevel === 'high' ? Colors.error
    : Colors.warning;

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/(tabs)/discover', params: { productId: id } })}
    >
      <View style={styles.header}>
        {riskLevel && (
          <View style={[styles.riskBadge, { backgroundColor: `${riskColor}18` }]}>
            <Text style={[styles.riskText, { color: riskColor }]}>{riskLevel} risk</Text>
          </View>
        )}
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
      </View>
      {metric && <Text style={styles.metric}>{metric}</Text>}
      {tagline && <Text style={styles.tagline} numberOfLines={1}>{tagline}</Text>}
      <View style={styles.ctaRow}>
        <Text style={styles.ctaText}>View details</Text>
        <Ionicons name="arrow-forward" size={12} color={Colors.gold} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  riskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  riskText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    textTransform: 'capitalize',
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  metric: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: FontWeight.medium,
    marginBottom: 2,
  },
  tagline: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ctaText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.gold,
  },
});
