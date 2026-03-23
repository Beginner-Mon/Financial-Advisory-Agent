/**
 * Accounts Tab — Account list, transaction detail, cards management.
 * Step 7.8 — Accounts Tab
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, Switch, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import {
  getAccounts, getTransactions, getCards, freezeCard,
  Account, Transaction, TransactionListResponse, Card,
} from '../../services/api';
import { useSessionStore } from '../../store/session';
import AccountCard from '../../components/bank/AccountCard';
import TransactionRow from '../../components/bank/TransactionRow';
import CardVisual from '../../components/bank/CardVisual';

type ViewMode = 'accounts' | 'detail' | 'cards';
type TxnFilter = 'all' | 'in' | 'out';

export default function AccountsScreen() {
  const userId = useSessionStore((s) => s.userId);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('accounts');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Transaction filters
  const [txnFilter, setTxnFilter] = useState<TxnFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Transaction detail modal
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  // Cards state
  const [selectedCardIdx, setSelectedCardIdx] = useState(0);
  const [freezingCard, setFreezingCard] = useState(false);

  // Fetch accounts
  const fetchAccounts = useCallback(async () => {
    try {
      const accs = await getAccounts(userId);
      setAccounts(accs);
    } catch (e) {
      console.warn('Error fetching accounts:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  // Fetch transactions for selected account
  const fetchTransactions = useCallback(async (accountId: string) => {
    try {
      const params: Record<string, any> = { limit: 50 };
      if (searchQuery) params.search = searchQuery;
      const data = await getTransactions(accountId, params);
      let txns = data.transactions;

      if (txnFilter === 'in') txns = txns.filter((t) => t.amount >= 0);
      if (txnFilter === 'out') txns = txns.filter((t) => t.amount < 0);

      setTransactions(txns);
    } catch (e) {
      console.warn('Error fetching transactions:', e);
    }
  }, [searchQuery, txnFilter]);

  // Fetch cards
  const fetchCards = useCallback(async () => {
    try {
      const c = await getCards(userId);
      setCards(c);
    } catch (e) {
      console.warn('Error fetching cards:', e);
    }
  }, [userId]);

  useEffect(() => {
    fetchAccounts();
    fetchCards();
  }, [fetchAccounts, fetchCards]);

  useEffect(() => {
    if (selectedAccountId) {
      fetchTransactions(selectedAccountId);
    }
  }, [selectedAccountId, fetchTransactions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAccounts();
    fetchCards();
    if (selectedAccountId) fetchTransactions(selectedAccountId);
  }, [fetchAccounts, fetchCards, fetchTransactions, selectedAccountId]);

  const handleFreezeToggle = async (card: Card) => {
    setFreezingCard(true);
    try {
      const newFrozen = card.status !== 'frozen';
      await freezeCard(card.card_id, newFrozen);
      // Optimistic update
      setCards((prev) =>
        prev.map((c) =>
          c.card_id === card.card_id ? { ...c, status: newFrozen ? 'frozen' : 'active' } : c
        )
      );
    } catch (e) {
      console.warn('Error toggling freeze:', e);
    } finally {
      setFreezingCard(false);
    }
  };

  const selectedAccount = accounts.find((a) => a.account_id === selectedAccountId);

  // Group transactions by date
  const groupedTransactions = transactions.reduce<Record<string, Transaction[]>>((acc, txn) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let label = txn.date;
    if (txn.date === today) label = 'Today';
    else if (txn.date === yesterday) label = 'Yesterday';
    if (!acc[label]) acc[label] = [];
    acc[label].push(txn);
    return acc;
  }, {});

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  // ------ VIEWS ------

  // Accounts list view
  const renderAccountsList = () => (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} colors={[Colors.gold]} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Segment control: Accounts / Cards */}
      <View style={styles.segmentControl}>
        <TouchableOpacity
          style={[styles.segmentBtn, viewMode === 'accounts' && styles.segmentBtnActive]}
          onPress={() => setViewMode('accounts')}
        >
          <Text style={[styles.segmentText, viewMode === 'accounts' && styles.segmentTextActive]}>Accounts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, viewMode === 'cards' && styles.segmentBtnActive]}
          onPress={() => setViewMode('cards')}
        >
          <Text style={[styles.segmentText, viewMode === 'cards' && styles.segmentTextActive]}>Cards</Text>
        </TouchableOpacity>
      </View>

      {/* Account cards */}
      <View style={styles.accountsList}>
        {accounts.map((acc) => (
          <TouchableOpacity
            key={acc.account_id}
            style={styles.accountRow}
            onPress={() => {
              setSelectedAccountId(acc.account_id);
              setViewMode('detail');
            }}
            activeOpacity={0.7}
          >
            <AccountCard
              accountId={acc.account_id}
              type={acc.type}
              accountNo={acc.account_no}
              balance={acc.balance}
              onPress={() => {
                setSelectedAccountId(acc.account_id);
                setViewMode('detail');
              }}
            />
          </TouchableOpacity>
        ))}
        {accounts.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No accounts found</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  // Account detail + transactions view
  const renderAccountDetail = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => setViewMode('accounts')}>
        <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        <Text style={styles.backText}>Accounts</Text>
      </TouchableOpacity>

      {/* Account header */}
      {selectedAccount && (
        <View style={styles.detailHeader}>
          <Text style={styles.detailType}>
            {selectedAccount.type.charAt(0).toUpperCase() + selectedAccount.type.slice(1)} Account
          </Text>
          <Text style={styles.detailAccountNo}>••{selectedAccount.account_no.slice(-4)}</Text>
          <Text style={styles.detailBalance}>
            {selectedAccount.balance.toLocaleString('en-US', {
              style: 'currency',
              currency: selectedAccount.currency || 'USD',
            })}
          </Text>
        </View>
      )}

      {/* Filter pills */}
      <View style={styles.filterRow}>
        {(['all', 'in', 'out'] as TxnFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, txnFilter === f && styles.filterPillActive]}
            onPress={() => setTxnFilter(f)}
          >
            <Text style={[styles.filterText, txnFilter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f === 'in' ? '↓ In' : '↑ Out'}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
            }}
            onSubmitEditing={() => selectedAccountId && fetchTransactions(selectedAccountId)}
          />
        </View>
      </View>

      {/* Grouped transactions */}
      <View style={styles.transactionsContainer}>
        {Object.entries(groupedTransactions).map(([dateLabel, txns]) => (
          <View key={dateLabel}>
            <Text style={styles.dateHeader}>{dateLabel}</Text>
            {txns.map((txn) => (
              <TransactionRow
                key={txn.txn_id}
                merchant={txn.merchant}
                amount={txn.amount}
                category={txn.category}
                date={txn.date}
                reference={txn.reference}
                onPress={() => setSelectedTxn(txn)}
              />
            ))}
          </View>
        ))}
        {transactions.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        )}
      </View>

      {/* Transaction detail bottom sheet */}
      <Modal visible={!!selectedTxn} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setSelectedTxn(null)} activeOpacity={1}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            {selectedTxn && (
              <>
                <Text style={styles.sheetTitle}>{selectedTxn.merchant}</Text>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Amount</Text>
                  <Text style={[
                    styles.sheetValue,
                    { color: selectedTxn.amount >= 0 ? Colors.amountPositive : Colors.amountNegative },
                  ]}>
                    {selectedTxn.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </Text>
                </View>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Category</Text>
                  <Text style={styles.sheetValue}>{selectedTxn.category}</Text>
                </View>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Date</Text>
                  <Text style={styles.sheetValue}>{selectedTxn.date}</Text>
                </View>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Reference</Text>
                  <Text style={styles.sheetValue}>{selectedTxn.reference || '—'}</Text>
                </View>
                <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setSelectedTxn(null)}>
                  <Text style={styles.sheetCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={{ height: Spacing.huge }} />
    </ScrollView>
  );

  // Cards management view
  const renderCards = () => {
    const currentCard = cards[selectedCardIdx];

    return (
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} colors={[Colors.gold]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Segment control */}
        <View style={styles.segmentControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, viewMode === 'accounts' && styles.segmentBtnActive]}
            onPress={() => setViewMode('accounts')}
          >
            <Text style={[styles.segmentText, viewMode === 'accounts' && styles.segmentTextActive]}>Accounts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, viewMode === 'cards' && styles.segmentBtnActive]}
            onPress={() => setViewMode('cards')}
          >
            <Text style={[styles.segmentText, viewMode === 'cards' && styles.segmentTextActive]}>Cards</Text>
          </TouchableOpacity>
        </View>

        {cards.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No cards found</Text>
          </View>
        ) : (
          <>
            {/* Card carousel (simplified — dots navigation) */}
            <View style={styles.cardCarousel}>
              {currentCard && (
                <CardVisual
                  type={currentCard.type}
                  lastFour={currentCard.last_four}
                  network={currentCard.network}
                  status={currentCard.status}
                  spendLimit={currentCard.spend_limit}
                />
              )}
              {/* Dots */}
              <View style={styles.dots}>
                {cards.map((_, i) => (
                  <TouchableOpacity key={i} onPress={() => setSelectedCardIdx(i)}>
                    <View style={[styles.dot, i === selectedCardIdx && styles.dotActive]} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Card controls */}
            {currentCard && (
              <View style={styles.cardControls}>
                {/* Freeze toggle */}
                <View style={styles.controlRow}>
                  <View style={styles.controlInfo}>
                    <Ionicons name="snow-outline" size={20} color={Colors.primary} />
                    <View>
                      <Text style={styles.controlLabel}>Freeze Card</Text>
                      <Text style={styles.controlDesc}>Temporarily block all transactions</Text>
                    </View>
                  </View>
                  <Switch
                    value={currentCard.status === 'frozen'}
                    onValueChange={() => handleFreezeToggle(currentCard)}
                    disabled={freezingCard}
                    trackColor={{ false: Colors.cardBorder, true: Colors.primary }}
                    thumbColor={Colors.white}
                  />
                </View>

                {/* Monthly limit */}
                <View style={styles.controlRow}>
                  <View style={styles.controlInfo}>
                    <Ionicons name="speedometer-outline" size={20} color={Colors.gold} />
                    <View>
                      <Text style={styles.controlLabel}>Monthly Limit</Text>
                      <Text style={styles.controlDesc}>
                        ${currentCard.spend_limit?.toLocaleString() || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Online transactions */}
                <View style={styles.controlRow}>
                  <View style={styles.controlInfo}>
                    <Ionicons name="globe-outline" size={20} color={Colors.accent} />
                    <View>
                      <Text style={styles.controlLabel}>Online Transactions</Text>
                      <Text style={styles.controlDesc}>Enable for online purchases</Text>
                    </View>
                  </View>
                  <Switch
                    value={true}
                    trackColor={{ false: Colors.cardBorder, true: Colors.accent }}
                    thumbColor={Colors.white}
                  />
                </View>

                {/* Action buttons */}
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.cardActionBtn}>
                    <Ionicons name="eye-outline" size={18} color={Colors.textPrimary} />
                    <Text style={styles.cardActionText}>View PIN</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.cardActionBtn, styles.cardActionBtnDanger]}>
                    <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
                    <Text style={[styles.cardActionText, { color: Colors.error }]}>Report Lost</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        <View style={{ height: Spacing.huge }} />
      </ScrollView>
    );
  };

  // Render based on view mode
  if (viewMode === 'detail') return renderAccountDetail();
  if (viewMode === 'cards') return renderCards();
  return renderAccountsList();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loader: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Segment control
  segmentControl: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md - 2,
  },
  segmentBtnActive: {
    backgroundColor: Colors.surfaceLight,
  },
  segmentText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
  },
  segmentTextActive: {
    color: Colors.gold,
  },
  // Account list
  accountsList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  accountRow: {
    marginBottom: 0,
  },
  // Account detail
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  backText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  detailHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    marginBottom: Spacing.lg,
  },
  detailType: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    marginBottom: 4,
  },
  detailAccountNo: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  detailBalance: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },
  // Filters
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterPillActive: {
    backgroundColor: Colors.surfaceLight,
    borderColor: Colors.gold,
  },
  filterText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  filterTextActive: {
    color: Colors.gold,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: Spacing.sm,
    height: 36,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    height: '100%',
  },
  // Transactions
  transactionsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  dateHeader: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Transaction detail modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    paddingTop: Spacing.lg,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.cardBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.xxl,
  },
  sheetTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xxl,
  },
  sheetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.cardBorder,
  },
  sheetLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  sheetValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  sheetCloseBtn: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  sheetCloseBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  // Cards
  cardCarousel: {
    paddingHorizontal: Spacing.xxl,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.cardBorder,
  },
  dotActive: {
    backgroundColor: Colors.gold,
    width: 20,
  },
  cardControls: {
    marginTop: Spacing.xxl,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.cardBorder,
  },
  controlInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  controlLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  controlDesc: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
  },
  cardActionBtnDanger: {
    backgroundColor: 'rgba(255, 71, 87, 0.08)',
  },
  cardActionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  // Empty
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.huge,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
});
