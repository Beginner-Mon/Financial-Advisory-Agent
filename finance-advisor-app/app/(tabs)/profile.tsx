/**
 * Profile Tab — Personal info, quick links, settings.
 * Placeholder for Phase 11, showing basic profile info now.
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { useSessionStore } from '../../store/session';

type IoniconsName = keyof typeof Ionicons.glyphMap;

const MENU_ITEMS: { icon: IoniconsName; label: string; color: string; description: string }[] = [
  { icon: 'briefcase-outline', label: 'Active Products', color: Colors.primary, description: 'View your applications' },
  { icon: 'flag-outline', label: 'Goals', color: Colors.accent, description: 'Track your financial goals' },
  { icon: 'time-outline', label: 'Agent History', color: Colors.gold, description: 'Past AI agent actions' },
  { icon: 'settings-outline', label: 'Settings', color: Colors.textSecondary, description: 'App preferences' },
];

export default function ProfileScreen() {
  const userId = useSessionStore((s) => s.userId);
  const profile = useSessionStore((s) => s.profile);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.name || 'Demo User').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.name || 'Demo User'}</Text>
        <Text style={styles.userId}>{userId}</Text>
      </View>

      {/* Info cards */}
      <View style={styles.infoRow}>
        <View style={styles.infoCard}>
          <Ionicons name="mail-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.infoValue}>demo@bank.com</Text>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name="call-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.infoValue}>+1-555-***-3456</Text>
        </View>
      </View>

      {/* Menu items */}
      <View style={styles.menuContainer}>
        {MENU_ITEMS.map((item, i) => (
          <TouchableOpacity key={i} style={styles.menuItem} activeOpacity={0.7}>
            <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuDesc}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Security section */}
      <View style={styles.securitySection}>
        <Text style={styles.securityTitle}>Security</Text>
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={[styles.menuIcon, { backgroundColor: 'rgba(0, 212, 170, 0.12)' }]}>
            <Ionicons name="finger-print-outline" size={20} color={Colors.accent} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuLabel}>Biometric Login</Text>
            <Text style={styles.menuDesc}>Use fingerprint or face to login</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={[styles.menuIcon, { backgroundColor: 'rgba(79, 140, 255, 0.12)' }]}>
            <Ionicons name="key-outline" size={20} color={Colors.primary} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuLabel}>Change PIN</Text>
            <Text style={styles.menuDesc}>Update your security PIN</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={{ height: Spacing.huge * 2 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  userId: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  infoRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  infoValue: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  menuContainer: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.cardBorder,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuInfo: {
    flex: 1,
  },
  menuLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  menuDesc: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  securitySection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xxl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  securityTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
