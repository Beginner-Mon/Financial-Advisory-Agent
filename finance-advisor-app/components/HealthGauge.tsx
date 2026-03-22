import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface HealthGaugeProps {
  score: number;
}

export default function HealthGauge({ score }: HealthGaugeProps) {
  // Determine color based on score
  let scoreColor = Colors.scoreRed;
  if (score >= 70) scoreColor = Colors.scoreGreen;
  else if (score >= 40) scoreColor = Colors.scoreYellow;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="pulse" size={20} color={Colors.textSecondary} />
        <Text style={styles.title}>Financial Health Score</Text>
      </View>
      <View style={styles.gaugeContainer}>
        {/* Simple implementation of a gauge for now */}
        <View style={[styles.circle, { borderColor: scoreColor }]}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>{score}</Text>
          <Text style={styles.maxText}>/ 100</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  scoreText: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  maxText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: -4,
  },
});
