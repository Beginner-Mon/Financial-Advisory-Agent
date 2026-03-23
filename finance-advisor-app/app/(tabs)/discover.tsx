/**
 * Discover Tab — Product browsing & AI advisor entry.
 * Placeholder with category grid, will be expanded in Phase 9.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { getProducts, getPromotions, Product } from '../../services/api';
import { useSessionStore } from '../../store/session';

type IoniconsName = keyof typeof Ionicons.glyphMap;

const CATEGORIES: { key: string; label: string; icon: IoniconsName; color: string }[] = [
  { key: 'cards', label: 'Cards', icon: 'card', color: Colors.gold },
  { key: 'savings', label: 'Savings', icon: 'shield-checkmark', color: Colors.savings },
  { key: 'loans', label: 'Loans', icon: 'cash', color: Colors.loan },
  { key: 'insurance', label: 'Insurance', icon: 'umbrella', color: Colors.insurance },
  { key: 'investments', label: 'Investments', icon: 'trending-up', color: Colors.investment },
  { key: 'promotions', label: 'Promos', icon: 'gift', color: Colors.scoreYellow },
];

export default function DiscoverScreen() {
  const inProgressProduct = useSessionStore((s) => s.inProgressProduct);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [promos, setPromos] = useState<Product[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [prods, prs] = await Promise.all([getProducts(), getPromotions()]);
        setProducts(prods);
        setPromos(prs);
      } catch (e) {
        console.warn('Discover fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Resume banner */}
      {inProgressProduct && (
        <TouchableOpacity style={styles.resumeBanner} activeOpacity={0.8}>
          <Ionicons name="play-circle" size={24} color={Colors.gold} />
          <View style={styles.resumeInfo}>
            <Text style={styles.resumeTitle}>Continue: {inProgressProduct.productName}</Text>
            <Text style={styles.resumeSubtitle}>Your application is in progress</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* Recommended for you */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended for You</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendedStrip}>
          {products.slice(0, 3).map((p) => (
            <TouchableOpacity key={p.id} style={styles.recommendedCard} activeOpacity={0.7}>
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={10} color={Colors.gold} />
                <Text style={styles.aiBadgeText}>AI Pick</Text>
              </View>
              <Text style={styles.recommendedName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.recommendedType}>{p.product_type}</Text>
              <TouchableOpacity style={styles.recommendedCta}>
                <Text style={styles.recommendedCtaText}>{p.cta_label || 'Learn More'}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Category grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse Products</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.key} style={styles.categoryTile} activeOpacity={0.7}>
              <View style={[styles.categoryIcon, { backgroundColor: `${cat.color}18` }]}>
                <Ionicons name={cat.icon} size={24} color={cat.color} />
              </View>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Promotions */}
      {promos.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Promotions</Text>
          {promos.map((p) => (
            <TouchableOpacity key={p.id} style={styles.promoCard} activeOpacity={0.7}>
              <View style={styles.promoIcon}>
                <Ionicons name="gift" size={22} color={Colors.scoreYellow} />
              </View>
              <View style={styles.promoInfo}>
                <Text style={styles.promoName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.promoDesc} numberOfLines={2}>
                  {p.summary?.tagline || p.detail?.tagline || 'Special offer available'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* AI Chat entry */}
      <TouchableOpacity style={styles.chatBar} activeOpacity={0.8}>
        <Ionicons name="chatbubble-ellipses" size={20} color={Colors.gold} />
        <Text style={styles.chatBarText}>Ask the AI Advisor anything...</Text>
        <Ionicons name="arrow-forward-circle" size={22} color={Colors.gold} />
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
  loader: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  // Resume banner
  resumeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
    borderWidth: 1,
    borderColor: Colors.goldDark,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  resumeInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  resumeTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gold,
  },
  resumeSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Recommended strip
  recommendedStrip: {
    paddingRight: Spacing.lg,
  },
  recommendedCard: {
    width: 180,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginRight: Spacing.md,
    ...Shadows.sm,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(201, 168, 76, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  recommendedName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  recommendedType: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'capitalize',
    marginBottom: Spacing.md,
  },
  recommendedCta: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  recommendedCtaText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.gold,
  },
  // Category grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  categoryTile: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  // Promos
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  promoIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 217, 61, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  promoInfo: {
    flex: 1,
  },
  promoName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  promoDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  // Chat bar
  chatBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  chatBarText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
});
