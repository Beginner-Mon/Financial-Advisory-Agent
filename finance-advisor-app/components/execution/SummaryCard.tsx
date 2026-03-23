/**
 * SummaryCard — Shown after execution flow completes.
 * Animated checkmark, product name, reference number, agent log, next steps.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../../constants/theme';

interface Props {
  productName: string;
  referenceNo: string;
  agentLog: string[];
  onViewProducts: () => void;
  onBackToDiscover: () => void;
}

export default function SummaryCard({ productName, referenceNo, agentLog, onViewProducts, onBackToDiscover }: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Animated checkmark */}
      <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
        <Ionicons name="checkmark" size={48} color={Colors.navy} />
      </Animated.View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.title}>Application Submitted!</Text>
        <Text style={styles.productName}>{productName}</Text>

        {/* Reference number */}
        <View style={styles.refCard}>
          <Text style={styles.refLabel}>Reference Number</Text>
          <Text style={styles.refValue}>{referenceNo}</Text>
        </View>

        {/* Agent log */}
        <View style={styles.logSection}>
          <Text style={styles.logTitle}>What the Agent Did</Text>
          {agentLog.map((entry, i) => {
            const isAuto = entry.startsWith('✓') || !entry.startsWith('!');
            const icon = isAuto ? 'checkmark-circle' : 'alert-circle';
            const color = isAuto ? Colors.success : Colors.warning;
            const text = entry.replace(/^[✓!]\s*/, '');
            return (
              <View key={i} style={styles.logRow}>
                <Ionicons name={icon} size={16} color={color} />
                <Text style={styles.logText}>{text}</Text>
              </View>
            );
          })}
        </View>

        {/* What happens next */}
        <View style={styles.nextSection}>
          <Text style={styles.nextTitle}>What Happens Next</Text>
          <View style={styles.nextItem}>
            <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.nextText}>Your application will be reviewed within 1-3 business days</Text>
          </View>
          <View style={styles.nextItem}>
            <Ionicons name="notifications-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.nextText}>You'll receive a notification once it's approved</Text>
          </View>
          <View style={styles.nextItem}>
            <Ionicons name="mail-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.nextText}>Confirmation email will be sent to your registered address</Text>
          </View>
        </View>

        {/* CTAs */}
        <TouchableOpacity style={styles.primaryBtn} onPress={onViewProducts}>
          <Ionicons name="briefcase-outline" size={18} color={Colors.navy} />
          <Text style={styles.primaryBtnText}>View in My Products</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onBackToDiscover}>
          <Text style={styles.secondaryBtnText}>Back to Discover</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.huge },
  checkCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.success, justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.xxl, ...Shadows.lg,
  },
  content: { width: '100%', alignItems: 'center' },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 4 },
  productName: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xxl },
  refCard: {
    width: '100%', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.xxl,
  },
  refLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 4 },
  refValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.gold, letterSpacing: 1 },
  logSection: { width: '100%', marginBottom: Spacing.xxl },
  logTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  logRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  logText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  nextSection: {
    width: '100%', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.lg, marginBottom: Spacing.xxl,
  },
  nextTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  nextItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.md },
  nextText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.gold, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, width: '100%', gap: Spacing.sm, ...Shadows.gold, marginBottom: Spacing.md,
  },
  primaryBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.navy },
  secondaryBtn: {
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.cardBorder,
    paddingVertical: Spacing.md, width: '100%', alignItems: 'center',
  },
  secondaryBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
});
