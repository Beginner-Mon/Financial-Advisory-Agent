/**
 * HomeChat — Chips-only AI Guide section for Home screen.
 * No text input, no keyboard, no send button.
 * Chips always visible. Each chip tap replaces the response area.
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { PRESET_CHIPS } from '../../constants/chatChips';

export default function HomeChat() {
  const router = useRouter();

  const handleChipTap = (chip: { label: string; message: string }) => {
    router.push({
      pathname: '/(tabs)/discover',
      params: { initialPrompt: chip.message }
    });
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
  askMoreText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gold,
  },
});
