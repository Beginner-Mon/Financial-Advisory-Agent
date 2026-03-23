/**
 * Profile Tab — Personal info, active products, goals tracker, agent history.
 * Phase 11 — Full expansion with internal sub-views.
 *
 * Views: home | products | goals | history | settings
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useSessionStore } from '../../store/session';
import {
  getOrders, getGoals, createGoal, deleteGoal, getAgentHistory,
  Order, Goal,
} from '../../services/api';
import GoalBar from '../../components/bank/GoalBar';

type IoniconsName = keyof typeof Ionicons.glyphMap;
type ProfileView = 'home' | 'products' | 'goals' | 'history' | 'settings';

const MENU_ITEMS: { icon: IoniconsName; label: string; color: string; description: string; target: ProfileView }[] = [
  { icon: 'briefcase-outline', label: 'Active Products', color: Colors.primary, description: 'View your applications', target: 'products' },
  { icon: 'flag-outline', label: 'Goals', color: Colors.accent, description: 'Track your financial goals', target: 'goals' },
  { icon: 'time-outline', label: 'Agent History', color: Colors.gold, description: 'Past AI agent actions', target: 'history' },
  { icon: 'settings-outline', label: 'Settings', color: Colors.textSecondary, description: 'App preferences', target: 'settings' },
];

const STATUS_COLORS: Record<string, string> = {
  submitted: Colors.warning,
  approved: Colors.success,
  rejected: Colors.error,
  pending: Colors.primary,
  completed: Colors.success,
  cancelled: Colors.textMuted,
};

export default function ProfileScreen() {
  const userId = useSessionStore((s) => s.userId);
  const profile = useSessionStore((s) => s.profile);

  const [view, setView] = useState<ProfileView>('home');

  // Products
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Goals
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');

  // Agent history
  const [history, setHistory] = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  // ──────────────────────────────────────────────
  // Data fetchers
  // ──────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const data = await getOrders(userId);
      setOrders(data);
    } catch { setOrders([]); }
    finally { setOrdersLoading(false); }
  }, [userId]);

  const fetchGoals = useCallback(async () => {
    setGoalsLoading(true);
    try {
      const data = await getGoals(userId);
      setGoals(data);
    } catch { setGoals([]); }
    finally { setGoalsLoading(false); }
  }, [userId]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await getAgentHistory(userId);
      setHistory(data);
    } catch { setHistory([]); }
    finally { setHistoryLoading(false); }
  }, [userId]);

  useEffect(() => {
    if (view === 'products') fetchOrders();
    if (view === 'goals') fetchGoals();
    if (view === 'history') fetchHistory();
  }, [view]);

  // ──────────────────────────────────────────────
  // Goal handlers
  // ──────────────────────────────────────────────
  const handleAddGoal = async () => {
    if (!newGoalName.trim() || !newGoalAmount.trim()) return;
    try {
      await createGoal({
        user_id: userId,
        name: newGoalName.trim(),
        target_amount: parseFloat(newGoalAmount),
        deadline: newGoalDeadline || undefined,
      });
      setNewGoalName('');
      setNewGoalAmount('');
      setNewGoalDeadline('');
      setShowAddGoal(false);
      fetchGoals();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create goal');
    }
  };

  const handleDeleteGoal = (goalId: string, goalName: string) => {
    Alert.alert('Delete Goal', `Are you sure you want to delete "${goalName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGoal(goalId);
            fetchGoals();
          } catch {}
        },
      },
    ]);
  };

  // ──────────────────────────────────────────────
  // Sub-header
  // ──────────────────────────────────────────────
  const SubHeader = ({ title }: { title: string }) => (
    <View style={styles.subHeader}>
      <TouchableOpacity onPress={() => setView('home')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.subHeaderTitle}>{title}</Text>
      <View style={{ width: 22 }} />
    </View>
  );

  // ══════════════════════════════════════════════
  // VIEW: ACTIVE PRODUCTS
  // ══════════════════════════════════════════════
  if (view === 'products') {
    // Group orders by product_type
    const grouped: Record<string, Order[]> = {};
    orders.forEach((o) => {
      const type = o.product_type || 'other';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(o);
    });

    return (
      <View style={styles.container}>
        <SubHeader title="Active Products" />
        <ScrollView contentContainerStyle={styles.subContent}
          refreshControl={<RefreshControl refreshing={ordersLoading} onRefresh={fetchOrders} tintColor={Colors.gold} colors={[Colors.gold]} />}
        >
          {ordersLoading && orders.length === 0 ? (
            <View style={styles.emptyState}><ActivityIndicator size="large" color={Colors.gold} /></View>
          ) : orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No active products yet</Text>
              <Text style={styles.emptySubtext}>Browse products in the Discover tab to get started</Text>
            </View>
          ) : (
            Object.entries(grouped).map(([type, items]) => (
              <View key={type} style={styles.groupSection}>
                <Text style={styles.groupTitle}>{type.replace(/_/g, ' ')}</Text>
                {items.map((order) => (
                  <View key={order.order_id} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <Text style={styles.orderProduct}>{order.product_id}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[order.status] || Colors.textMuted}20` }]}>
                        <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] || Colors.textMuted }]}>
                          {order.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.orderRef}>Ref: {order.reference_no}</Text>
                    <Text style={styles.orderDate}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  // ══════════════════════════════════════════════
  // VIEW: GOALS
  // ══════════════════════════════════════════════
  if (view === 'goals') {
    return (
      <View style={styles.container}>
        <SubHeader title="Goals Tracker" />
        <ScrollView contentContainerStyle={styles.subContent}
          refreshControl={<RefreshControl refreshing={goalsLoading} onRefresh={fetchGoals} tintColor={Colors.gold} colors={[Colors.gold]} />}
        >
          {/* Add goal button */}
          <TouchableOpacity style={styles.addGoalBtn} onPress={() => setShowAddGoal(!showAddGoal)}>
            <Ionicons name={showAddGoal ? 'close-circle' : 'add-circle'} size={22} color={Colors.gold} />
            <Text style={styles.addGoalText}>{showAddGoal ? 'Cancel' : 'Add Goal'}</Text>
          </TouchableOpacity>

          {/* Add goal form */}
          {showAddGoal && (
            <View style={styles.addGoalForm}>
              <TextInput
                style={styles.goalInput}
                value={newGoalName}
                onChangeText={setNewGoalName}
                placeholder="Goal name (e.g., Emergency Fund)"
                placeholderTextColor={Colors.textMuted}
              />
              <TextInput
                style={styles.goalInput}
                value={newGoalAmount}
                onChangeText={setNewGoalAmount}
                placeholder="Target amount ($)"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.goalInput}
                value={newGoalDeadline}
                onChangeText={setNewGoalDeadline}
                placeholder="Deadline (YYYY-MM-DD, optional)"
                placeholderTextColor={Colors.textMuted}
              />
              <TouchableOpacity
                style={[styles.goalSubmitBtn, (!newGoalName.trim() || !newGoalAmount.trim()) && { opacity: 0.4 }]}
                onPress={handleAddGoal}
                disabled={!newGoalName.trim() || !newGoalAmount.trim()}
              >
                <Text style={styles.goalSubmitText}>Create Goal</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Goals list */}
          {goalsLoading && goals.length === 0 ? (
            <View style={styles.emptyState}><ActivityIndicator size="large" color={Colors.gold} /></View>
          ) : goals.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="flag-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No goals yet</Text>
              <Text style={styles.emptySubtext}>Set financial goals to track your progress</Text>
            </View>
          ) : (
            goals.map((goal) => (
              <View key={goal.goal_id} style={styles.goalCard}>
                <GoalBar
                  name={goal.name}
                  currentAmount={goal.current_amount || 0}
                  targetAmount={goal.target_amount}
                />
                <View style={styles.goalMeta}>
                  {goal.deadline && (
                    <View style={styles.goalDeadline}>
                      <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
                      <Text style={styles.goalDeadlineText}>{goal.deadline}</Text>
                    </View>
                  )}
                  <TouchableOpacity onPress={() => handleDeleteGoal(goal.goal_id, goal.name)}>
                    <Ionicons name="trash-outline" size={18} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  // ══════════════════════════════════════════════
  // VIEW: AGENT HISTORY
  // ══════════════════════════════════════════════
  if (view === 'history') {
    return (
      <View style={styles.container}>
        <SubHeader title="Agent History" />
        <ScrollView contentContainerStyle={styles.subContent}
          refreshControl={<RefreshControl refreshing={historyLoading} onRefresh={fetchHistory} tintColor={Colors.gold} colors={[Colors.gold]} />}
        >
          {historyLoading && history.length === 0 ? (
            <View style={styles.emptyState}><ActivityIndicator size="large" color={Colors.gold} /></View>
          ) : history.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No agent history yet</Text>
              <Text style={styles.emptySubtext}>Complete a product application to see history here</Text>
            </View>
          ) : (
            history.map((entry) => {
              const isExpanded = expandedHistory === entry.order_id;
              const agentLog = Array.isArray(entry.agent_log) ? entry.agent_log : [];
              return (
                <TouchableOpacity
                  key={entry.order_id}
                  style={styles.historyCard}
                  onPress={() => setExpandedHistory(isExpanded ? null : entry.order_id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.historyHeader}>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyProduct}>{entry.product_id}</Text>
                      <Text style={styles.historyDate}>{new Date(entry.created_at).toLocaleDateString()}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[entry.status] || Colors.textMuted}20` }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLORS[entry.status] || Colors.textMuted }]}>
                        {entry.status}
                      </Text>
                    </View>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} style={{ marginLeft: Spacing.sm }} />
                  </View>
                  <Text style={styles.historyRef}>Ref: {entry.reference_no}</Text>

                  {/* Expanded agent log */}
                  {isExpanded && agentLog.length > 0 && (
                    <View style={styles.historyLog}>
                      <Text style={styles.historyLogTitle}>Agent Log</Text>
                      {agentLog.map((log, i) => {
                        const isAuto = !log.startsWith('!');
                        return (
                          <View key={i} style={styles.historyLogRow}>
                            <Ionicons
                              name={isAuto ? 'checkmark-circle' : 'alert-circle'}
                              size={14}
                              color={isAuto ? Colors.success : Colors.warning}
                            />
                            <Text style={styles.historyLogText}>{log.replace(/^[✓!]\s*/, '')}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  }

  // ══════════════════════════════════════════════
  // VIEW: SETTINGS (placeholder)
  // ══════════════════════════════════════════════
  if (view === 'settings') {
    return (
      <View style={styles.container}>
        <SubHeader title="Settings" />
        <View style={styles.emptyState}>
          <Ionicons name="settings-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Settings</Text>
          <Text style={styles.emptySubtext}>App preferences coming soon</Text>
        </View>
      </View>
    );
  }

  // ══════════════════════════════════════════════
  // VIEW: HOME (default)
  // ══════════════════════════════════════════════
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
          <TouchableOpacity key={i} style={styles.menuItem} activeOpacity={0.7} onPress={() => setView(item.target)}>
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
          <View style={[styles.menuIcon, { backgroundColor: 'rgba(0,212,170,0.12)' }]}>
            <Ionicons name="finger-print-outline" size={20} color={Colors.accent} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuLabel}>Biometric Login</Text>
            <Text style={styles.menuDesc}>Use fingerprint or face to login</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={[styles.menuIcon, { backgroundColor: 'rgba(79,140,255,0.12)' }]}>
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
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: { alignItems: 'center', paddingVertical: Spacing.xxxl, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.gold, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  avatarText: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.navy },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 4 },
  userId: { fontSize: FontSize.sm, color: Colors.textMuted },

  // Info
  infoRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.md, marginTop: Spacing.xxl, marginBottom: Spacing.xxl },
  infoCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.cardBorder,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
  },
  infoValue: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },

  // Menu
  menuContainer: {
    marginHorizontal: Spacing.lg, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.cardBorder,
  },
  menuIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  menuDesc: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  // Security
  securitySection: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.xxl, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden',
  },
  securityTitle: {
    fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textMuted,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surfaceLight,
    textTransform: 'uppercase', letterSpacing: 1,
  },

  // Sub-header
  subHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.cardBorder,
  },
  subHeaderTitle: { flex: 1, textAlign: 'center', fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subContent: { padding: Spacing.lg, paddingBottom: Spacing.huge },

  // Empty state
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing.huge, gap: Spacing.md },
  emptyText: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  emptySubtext: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.xxxl },

  // Orders
  groupSection: { marginBottom: Spacing.xxl },
  groupTitle: {
    fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md,
  },
  orderCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: Spacing.lg, marginBottom: Spacing.sm,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  orderProduct: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary, flex: 1 },
  orderRef: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 2 },
  orderDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Goals
  addGoalBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  addGoalText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.gold },
  addGoalForm: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: Spacing.lg, marginBottom: Spacing.xxl, gap: Spacing.md,
  },
  goalInput: {
    backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    fontSize: FontSize.md, color: Colors.textPrimary,
  },
  goalSubmitBtn: {
    backgroundColor: Colors.gold, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center', ...Shadows.gold,
  },
  goalSubmitText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.navy },
  goalCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: Spacing.lg, marginBottom: Spacing.md,
  },
  goalMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
  goalDeadline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  goalDeadlineText: { fontSize: FontSize.xs, color: Colors.textMuted },

  // Agent history
  historyCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: Spacing.lg, marginBottom: Spacing.md,
  },
  historyHeader: { flexDirection: 'row', alignItems: 'center' },
  historyInfo: { flex: 1 },
  historyProduct: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  historyDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  historyRef: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.sm },
  historyLog: {
    marginTop: Spacing.md, paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.cardBorder,
  },
  historyLogTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textMuted, marginBottom: Spacing.sm },
  historyLogRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  historyLogText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
});
