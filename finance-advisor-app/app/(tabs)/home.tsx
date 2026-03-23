/**
 * Home Screen — Balance summary, account pills, quick actions, recent transactions.
 * Step 7.7 — Home Screen
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { getAccounts, getTransactions, Account, Transaction } from '../../services/api';
import { useSessionStore } from '../../store/session';
import BalanceSummary from '../../components/bank/BalanceSummary';
import AccountCard from '../../components/bank/AccountCard';
import TransactionRow from '../../components/bank/TransactionRow';

type IoniconsName = keyof typeof Ionicons.glyphMap;

const QUICK_ACTIONS: { icon: IoniconsName; label: string; color: string; route?: string }[] = [
  { icon: 'swap-horizontal', label: 'Transfer', color: Colors.primary, route: '/(tabs)/transfer' },
  { icon: 'card', label: 'Cards', color: Colors.gold, route: '/(tabs)/accounts' },
  { icon: 'trending-up', label: 'Invest', color: Colors.accent, route: '/(tabs)/discover' },
  { icon: 'chatbubble-ellipses', label: 'AI Advisor', color: Colors.insurance, route: '/(tabs)/discover' },
];

export default function HomeScreen() {
  const router = useRouter();
  const userId = useSessionStore((s) => s.userId);
  const inProgressProduct = useSessionStore((s) => s.inProgressProduct);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const accs = await getAccounts(userId);
      setAccounts(accs);

      if (accs.length > 0) {
        const firstId = accs[0].account_id;
        if (!selectedAccount) setSelectedAccount(firstId);
        const txnData = await getTransactions(selectedAccount || firstId, { limit: 5 });
        setTransactions(txnData.transactions);
      }
    } catch (e) {
      console.warn('HomeScreen fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, selectedAccount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

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
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.gold}
          colors={[Colors.gold]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Balance */}
      <BalanceSummary totalBalance={totalBalance} trend={2.4} />

      {/* Resume Banner */}
      {inProgressProduct && (
        <TouchableOpacity
          style={styles.resumeBanner}
          onPress={() => router.push('/(tabs)/discover')}
          activeOpacity={0.8}
        >
          <View style={styles.resumeIcon}>
            <Ionicons name="play-circle" size={24} color={Colors.gold} />
          </View>
          <View style={styles.resumeInfo}>
            <Text style={styles.resumeTitle}>Continue Application</Text>
            <Text style={styles.resumeProduct}>{inProgressProduct.productName}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* Account Pills Strip */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Accounts</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/accounts')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountStrip}>
          {accounts.map((acc) => (
            <AccountCard
              key={acc.account_id}
              accountId={acc.account_id}
              type={acc.type}
              accountNo={acc.account_no}
              balance={acc.balance}
              isActive={acc.account_id === selectedAccount}
              onPress={() => {
                setSelectedAccount(acc.account_id);
                // Reload txns for selected account
                getTransactions(acc.account_id, { limit: 5 }).then((data) =>
                  setTransactions(data.transactions)
                );
              }}
            />
          ))}
        </ScrollView>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
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

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/accounts')}>
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.transactionsCard}>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No recent transactions</Text>
            </View>
          ) : (
            transactions.map((txn) => (
              <TransactionRow
                key={txn.txn_id}
                merchant={txn.merchant}
                amount={txn.amount}
                category={txn.category}
                date={txn.date}
                reference={txn.reference}
              />
            ))
          )}
        </View>
      </View>

      {/* AI Advisor Nudge */}
      <TouchableOpacity
        style={styles.advisorBanner}
        onPress={() => router.push('/(tabs)/discover')}
        activeOpacity={0.8}
      >
        <View style={styles.advisorGlow} />
        <Ionicons name="sparkles" size={24} color={Colors.gold} />
        <View style={styles.advisorInfo}>
          <Text style={styles.advisorTitle}>AI Financial Advisor</Text>
          <Text style={styles.advisorSubtitle}>Get personalized recommendations</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      <View style={{ height: Spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  seeAll: {
    fontSize: FontSize.sm,
    color: Colors.gold,
    fontWeight: FontWeight.semibold,
  },
  accountStrip: {
    paddingRight: Spacing.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  transactionsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.sm,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  resumeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
    borderWidth: 1,
    borderColor: Colors.goldDark,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  resumeIcon: {
    marginRight: Spacing.md,
  },
  resumeInfo: {
    flex: 1,
  },
  resumeTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gold,
  },
  resumeProduct: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  advisorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    overflow: 'hidden',
  },
  advisorGlow: {
    position: 'absolute',
    left: -20,
    top: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(201, 168, 76, 0.08)',
  },
  advisorInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  advisorTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  advisorSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
