import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface HistoryItem {
  id: string;
  query: string;
  report: any;
  timestamp: string;
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadHistory = async () => {
    const data = JSON.parse(await AsyncStorage.getItem('advisory_history') || '[]');
    setHistory(data);
  };

  useFocusEffect(
    useCallback(() => { loadHistory(); }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const clearHistory = async () => {
    await AsyncStorage.removeItem('advisory_history');
    setHistory([]);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return Colors.scoreGreen;
    if (score >= 50) return Colors.scoreYellow;
    return Colors.scoreRed;
  };

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const isExpanded = expandedId === item.id;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(item.report.health_score) + '20' }]}>
              <Text style={[styles.scoreText, { color: getScoreColor(item.report.health_score) }]}>
                {Math.round(item.report.health_score)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.query} numberOfLines={isExpanded ? undefined : 2}>
                {item.query}
              </Text>
              <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={Colors.textMuted}
          />
        </View>

        {isExpanded && (
          <View style={styles.expanded}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Risk Profile</Text>
              <Text style={[styles.detailValue, { textTransform: 'capitalize' }]}>
                {item.report.risk_profile}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Goals</Text>
              <Text style={styles.detailValue}>
                {item.report.goals?.join(', ') || 'N/A'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Products</Text>
              <Text style={styles.detailValue}>
                {item.report.recommendations?.length || 0} recommended
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {history.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No History Yet</Text>
          <Text style={styles.emptySubtitle}>
            Your advisory reports will appear here
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.headerText}>{history.length} report{history.length !== 1 ? 's' : ''}</Text>
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.clearBtn}>Clear All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
              />
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  empty: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: Spacing.xl, gap: Spacing.md,
  },
  emptyTitle: { fontSize: FontSize.xl, color: Colors.textPrimary, fontWeight: '700' },
  emptySubtitle: { fontSize: FontSize.md, color: Colors.textSecondary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  headerText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  clearBtn: { color: Colors.error, fontSize: FontSize.sm, fontWeight: '600' },
  list: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  scoreBadge: {
    width: 40, height: 40, borderRadius: BorderRadius.sm,
    justifyContent: 'center', alignItems: 'center',
  },
  scoreText: { fontSize: FontSize.md, fontWeight: '800' },
  query: { color: Colors.textPrimary, fontSize: FontSize.sm, lineHeight: 20 },
  timestamp: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  expanded: {
    marginTop: Spacing.md, paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.cardBorder,
    gap: Spacing.sm,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { color: Colors.textMuted, fontSize: FontSize.sm },
  detailValue: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600' },
});
