/**
 * Home Screen — Greeting, hidden balance, quick actions, browse products, promos, AI Guide chips.
 * Refactored per phases-ui-refactor.md
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { getAccounts, getProducts, getPromotions, Account, Product } from '../../services/api';
import { useSessionStore } from '../../store/session';
import HomeChat from '../../components/HomeChat';

type IoniconsName = keyof typeof Ionicons.glyphMap;

const QUICK_ACTIONS: { icon: IoniconsName; label: string; color: string; route?: string }[] = [
  { icon: 'swap-horizontal', label: 'Transfer', color: Colors.primary, route: '/(tabs)/transfer' },
  { icon: 'card', label: 'Pay', color: Colors.gold, route: '/(tabs)/transfer' },
  { icon: 'arrow-up-circle', label: 'Top-up', color: Colors.accent, route: '/(tabs)/transfer' },
  { icon: 'shield-checkmark', label: 'Cards', color: Colors.insurance, route: '/(tabs)/accounts' },
  { icon: 'ellipsis-horizontal', label: 'More', color: Colors.textMuted },
];

const CATEGORIES: { key: string; label: string; icon: IoniconsName; color: string }[] = [
  { key: 'cards', label: 'Cards', icon: 'card', color: Colors.gold },
  { key: 'savings', label: 'Savings', icon: 'shield-checkmark', color: Colors.savings },
  { key: 'loans', label: 'Loans', icon: 'cash', color: Colors.loan },
  { key: 'insurance', label: 'Insurance', icon: 'umbrella', color: Colors.insurance },
  { key: 'investments', label: 'Investments', icon: 'trending-up', color: Colors.investment },
  { key: 'promotions', label: 'Promos', icon: 'gift', color: Colors.scoreYellow },
];

export default function HomeScreen() {
  const router = useRouter();
  const userId = useSessionStore((s) => s.userId);
  const profile = useSessionStore((s) => s.profile);
  const inProgressProduct = useSessionStore((s) => s.inProgressProduct);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [promos, setPromos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [accs, prods, prs] = await Promise.all([
        getAccounts(userId),
        getProducts(),
        getPromotions(),
      ]);
      setAccounts(accs);
      setProducts(prods);
      setPromos(prs);
    } catch (e) {
      console.warn('HomeScreen fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const userName = profile?.name || 'Alex';
  const initials = userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.gold} />
        <Text style={styles.loadingText}>Loading your finances...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} colors={[Colors.gold]} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header: avatar, greeting, hidden balance ── */}
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
          <View style={styles.greetingCol}>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Total balance</Text>
            <Text style={styles.balanceAmount}>
              {balanceVisible
                ? `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : '$ * * * * . * *'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)} style={styles.eyeBtn}>
            <Ionicons name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} size={22} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Quick actions ── */}
      <View style={styles.section}>
        <View style={styles.quickActionsGrid}>
          {QUICK_ACTIONS.map((action, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.quickAction}
              onPress={() => action.route && router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}18` }]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Resume banner (conditional) ── */}
      {inProgressProduct && (
        <TouchableOpacity
          style={styles.resumeBanner}
          onPress={() => router.push('/(tabs)/discover')}
          activeOpacity={0.8}
        >
          <Ionicons name="play-circle" size={24} color={Colors.gold} />
          <View style={styles.resumeInfo}>
            <Text style={styles.resumeTitle}>Resume application</Text>
            <Text style={styles.resumeProduct}>{inProgressProduct.productName}</Text>
          </View>
          <TouchableOpacity style={styles.resumeClose}>
            <Text style={styles.resumeCloseText}>Resume →</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* ── Browse Products (2×3 grid) ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse Products</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={styles.categoryTile}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/discover')}
            >
              <View style={[styles.categoryIcon, { backgroundColor: `${cat.color}18` }]}>
                <Ionicons name={cat.icon} size={24} color={cat.color} />
              </View>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Current Promotions ── */}
      {promos.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current Promotions</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/discover')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promoStrip}>
            {promos.slice(0, 5).map((p) => (
              <TouchableOpacity key={p.id} style={styles.promoCard} activeOpacity={0.7}>
                <View style={styles.promoIcon}>
                  <Ionicons name="gift" size={22} color={Colors.scoreYellow} />
                </View>
                <Text style={styles.promoName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.promoDesc} numberOfLines={2}>
                  {p.summary?.tagline || p.detail?.tagline || 'Special offer available'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── AI Guide section (chips only) ── */}
      <HomeChat />

      <View style={{ height: Spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 20 },
  loadingContainer: {
    flex: 1, backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center', gap: Spacing.lg,
  },
  loadingText: { color: Colors.textSecondary, fontSize: FontSize.md },

  // Header
  headerSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.navy,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white,
  },
  greetingCol: { flex: 1 },
  greetingText: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
  },
  userName: {
    fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary,
  },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  balanceRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 4,
  },
  balanceAmount: {
    fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary,
  },
  eyeBtn: { padding: Spacing.sm },

  // Quick actions
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xxl },
  quickActionsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAction: { alignItems: 'center', flex: 1 },
  quickActionIcon: {
    width: 50, height: 50, borderRadius: BorderRadius.lg,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm,
  },
  quickActionLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },

  // Resume banner
  resumeBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1, borderColor: Colors.goldDark, borderRadius: BorderRadius.md,
    padding: Spacing.lg, marginHorizontal: Spacing.lg, marginBottom: Spacing.xxl,
  },
  resumeInfo: { flex: 1, marginLeft: Spacing.md },
  resumeTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.gold },
  resumeProduct: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  resumeClose: {},
  resumeCloseText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.gold },

  // Section header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  seeAll: { fontSize: FontSize.sm, color: Colors.gold, fontWeight: FontWeight.semibold },

  // Browse Products grid
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.md },
  categoryTile: {
    width: '30%', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.cardBorder, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.sm,
  },
  categoryIcon: {
    width: 48, height: 48, borderRadius: BorderRadius.md,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm,
  },
  categoryLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary },

  // Promos strip
  promoStrip: { paddingRight: Spacing.lg },
  promoCard: {
    width: 180, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.lg, marginRight: Spacing.md,
    ...Shadows.sm,
  },
  promoIcon: {
    width: 40, height: 40, borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(245,158,11,0.12)',
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm,
  },
  promoName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: 4 },
  promoDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 16 },
});
