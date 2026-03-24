/**
 * ProductShell — Shared wrapper for all product detail screens.
 * Provides: back nav header, scrollable body, dual CTA (AI Guide + Apply manually).
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../../constants/theme';

interface Props {
  title: string;
  ctaLabel: string;
  onBack: () => void;
  onCta: () => void;
  onChat?: () => void;
  onTraditional?: () => void;
  children: React.ReactNode;
}

export default function ProductShell({ title, ctaLabel, onBack, onCta, onChat, onTraditional, children }: Props) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Body */}
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>

      {/* Bottom bar — dual CTA */}
      <View style={styles.bottomBar}>
        {onChat && (
          <TouchableOpacity style={styles.chatBtn} onPress={onChat} activeOpacity={0.7}>
            <Ionicons name="chatbubble-ellipses" size={20} color={Colors.gold} />
          </TouchableOpacity>
        )}
        <View style={styles.ctaColumn}>
          {/* Primary: AI Guide */}
          <TouchableOpacity style={styles.ctaButton} onPress={onCta} activeOpacity={0.8}>
            <Ionicons name="sparkles" size={16} color={Colors.navy} />
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          </TouchableOpacity>
          <Text style={styles.ctaSub}>Agent handles everything</Text>

          {/* Secondary: Traditional */}
          {onTraditional && (
            <>
              <TouchableOpacity style={styles.ctaSecondary} onPress={onTraditional} activeOpacity={0.7}>
                <Text style={styles.ctaSecondaryText}>Apply manually</Text>
              </TouchableOpacity>
              <Text style={styles.ctaSubSecondary}>Step-by-step, you're in control</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.cardBorder,
  },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  body: { flex: 1 },
  bodyContent: { paddingBottom: Spacing.huge },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.cardBorder,
    backgroundColor: Colors.surface,
    gap: Spacing.md,
  },
  chatBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(201, 168, 76, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  ctaColumn: { flex: 1 },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.gold,
  },
  ctaText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },
  ctaSub: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  ctaSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  ctaSecondaryText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  ctaSubSecondary: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
});
