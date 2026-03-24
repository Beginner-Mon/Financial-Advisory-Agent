/**
 * HomeChat — Chips-only AI Guide section for Home screen.
 * No text input, no keyboard, no send button.
 * Chips always visible. Each chip tap replaces the response area.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { PRESET_CHIPS } from '../../constants/chatChips';
import { getAdvice, Product, StructuredReport } from '../../services/api';
import ProductChip from './ProductChip';

interface ChipResponse {
  reply: string;
  products: Product[];
  loading: boolean;
  error: boolean;
}

export default function HomeChat() {
  const router = useRouter();
  const [response, setResponse] = useState<ChipResponse | null>(null);

  const handleChipTap = async (chip: { label: string; message: string }) => {
    setResponse({ reply: '', products: [], loading: true, error: false });
    try {
      const report: StructuredReport = await getAdvice(chip.message);
      const reply = [report.agent_commentary, report.report_markdown].filter(Boolean).join('\n\n') || 'Here are my recommendations based on your profile.';
      setResponse({
        reply,
        products: report.recommendations?.map((r: any) => ({
          id: r.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
          name: r.name || 'Product',
          product_type: r.type || 'general',
          category: r.type || 'general',
          sub_type: '',
          agent_flow: '',
          cta_label: 'View',
          risk_level: '',
          eligible_goals: [],
          summary: { projected_return: r.return_pct ? `${r.return_pct}%` : undefined },
          detail: { tagline: r.rationale || '' },
        })) || [],
        loading: false,
        error: false,
      });
    } catch {
      setResponse({ reply: '', products: [], loading: false, error: true });
    }
  };

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.headerRow}>
        <Ionicons name="sparkles" size={18} color={Colors.gold} />
        <Text style={styles.headerTitle}>AI Guide</Text>
      </View>

      {/* Greeting bubble */}
      <View style={styles.greetingBubble}>
        <View style={styles.botAvatar}>
          <Ionicons name="sparkles" size={14} color={Colors.gold} />
        </View>
        <View style={styles.greetingTextBox}>
          <Text style={styles.greetingText}>Hi, how can I help you today?</Text>
        </View>
      </View>

      {/* Chips — always visible, horizontal scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {PRESET_CHIPS.map((chip) => (
          <TouchableOpacity
            key={chip.label}
            style={styles.chip}
            activeOpacity={0.7}
            onPress={() => handleChipTap(chip)}
          >
            <Text style={styles.chipText}>{chip.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Response area — hidden until chip tapped */}
      {response && (
        <View style={styles.responseArea}>
          {response.loading ? (
            <View style={styles.loadingRow}>
              <View style={styles.botAvatar}>
                <Ionicons name="sparkles" size={14} color={Colors.gold} />
              </View>
              <View style={styles.dotsRow}>
                <View style={[styles.dot, { opacity: 0.3 }]} />
                <View style={[styles.dot, { opacity: 0.6 }]} />
                <View style={[styles.dot, { opacity: 1 }]} />
              </View>
            </View>
          ) : response.error ? (
            <TouchableOpacity style={styles.errorBox} onPress={() => setResponse(null)}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>Couldn't load response. Tap to dismiss.</Text>
            </TouchableOpacity>
          ) : (
            <View>
              <View style={styles.replyBubble}>
                <View style={styles.botAvatar}>
                  <Ionicons name="sparkles" size={14} color={Colors.gold} />
                </View>
                <View style={styles.replyTextBox}>
                  <Text style={styles.replyText}>{response.reply}</Text>
                </View>
              </View>

              {/* Product chips */}
              {response.products.slice(0, 3).map((p, i) => (
                <ProductChip
                  key={i}
                  id={p.id}
                  name={p.name}
                  productType={p.product_type}
                  riskLevel={p.risk_level}
                  metric={p.summary?.projected_return || p.summary?.interest_rate || ''}
                  tagline={p.detail?.tagline || ''}
                />
              ))}

              {/* Ask more link */}
              <TouchableOpacity
                style={styles.askMoreRow}
                onPress={() => router.push('/(tabs)/discover')}
              >
                <Text style={styles.askMoreText}>Ask more about this →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  greetingBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(201,168,76,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  greetingTextBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    flex: 1,
  },
  greetingText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  chipsRow: {
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  responseArea: {
    marginTop: Spacing.md,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: BorderRadius.md,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.error,
  },
  replyBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  replyTextBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    flex: 1,
  },
  replyText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  askMoreRow: {
    marginTop: Spacing.md,
    alignItems: 'flex-end',
  },
  askMoreText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gold,
  },
});
