/**
 * Home Screen — Greeting, balance, quick actions, Browse Products (traditional path).
 * View states: home | productList | productDetail | wizard | result
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import {
  getAccounts, getProducts, getPromotions, getProductDetail,
  traditionalApply, Account, Product, ProductListResponse,
} from '../../services/api';
import { useSessionStore } from '../../store/session';
import HomeChat from '../../components/HomeChat';
import BrowseProductsGrid from '../../components/products/BrowseProductsGrid';
import ProductShell from '../../components/products/ProductShell';
import CardDetail from '../../components/products/CardDetail';
import SavingsDetail from '../../components/products/SavingsDetail';
import LoanDetail from '../../components/products/LoanDetail';
import InsuranceDetail from '../../components/products/InsuranceDetail';
import InvestmentDetail from '../../components/products/InvestmentDetail';
import PromoDetail from '../../components/products/PromoDetail';
import WizardShell from '../../components/traditional/WizardShell';
import { CARD_STEPS } from '../../components/traditional/steps/cards';
import { SAVINGS_STEPS } from '../../components/traditional/steps/savings';
import { LOAN_STEPS } from '../../components/traditional/steps/loans';
import { INSURANCE_STEPS } from '../../components/traditional/steps/insurance';
import { INVESTMENT_STEPS } from '../../components/traditional/steps/investments';
import ResultCard, { KeyDetail } from '../../components/shared/ResultCard';

type IoniconsName = keyof typeof Ionicons.glyphMap;
type HomeView = 'home' | 'productList' | 'productDetail' | 'wizard' | 'result';

const QUICK_ACTIONS: { icon: IoniconsName; label: string; color: string; route?: string }[] = [
  { icon: 'swap-horizontal', label: 'Transfer', color: Colors.primary, route: '/(tabs)/transfer' },
  { icon: 'card', label: 'Pay', color: Colors.gold, route: '/(tabs)/transfer' },
  { icon: 'arrow-up-circle', label: 'Top-up', color: Colors.accent, route: '/(tabs)/transfer' },
  { icon: 'shield-checkmark', label: 'Cards', color: Colors.insurance, route: '/(tabs)/accounts' },
  { icon: 'ellipsis-horizontal', label: 'More', color: Colors.textMuted },
];

export default function HomeScreen() {
  const router = useRouter();
  const userId = useSessionStore((s) => s.userId);
  const profile = useSessionStore((s) => s.profile);

  // ── Home data ──
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [promos, setPromos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);

  // ── View state machine ──
  const [view, setView] = useState<HomeView>('home');

  // ── Product list ──
  const [activeCategory, setActiveCategory] = useState('');
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catPage, setCatPage] = useState(1);
  const [catTotal, setCatTotal] = useState(0);
  const [catLoadingMore, setCatLoadingMore] = useState(false);

  // ── Product detail ──
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Result ──
  const [resultData, setResultData] = useState<{
    productName: string; productType: string; referenceNo: string;
    keyDetails: KeyDetail[]; nextSteps: string;
  } | null>(null);

  // ── Fetch home data ──
  const fetchData = useCallback(async () => {
    try {
      const [accs, prs] = await Promise.all([getAccounts(userId), getPromotions()]);
      setAccounts(accs);
      setPromos(prs);
    } catch (e) { console.warn('HomeScreen fetch error:', e); }
    finally { setLoading(false); setRefreshing(false); }
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

  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, [fetchData]);

  // ── Navigation helpers ──
  const goBackFromView = () => {
    if (view === 'productList') setView('home');
    else if (view === 'productDetail') setView('productList');
    else if (view === 'wizard') setView('productDetail');
    else if (view === 'result') { setView('home'); setResultData(null); }
    else setView('home');
  };

  // ── Category tap → product list ──
  const openCategory = async (catKey: string) => {
    setActiveCategory(catKey);
    setCatLoading(true);
    setCatPage(1);
    setView('productList');
    try {
      const res = await getProducts(catKey, 1, 10);
      setCategoryProducts(res.products);
      setCatTotal(res.total);
    } catch { setCategoryProducts([]); setCatTotal(0); }
    finally { setCatLoading(false); }
  };

  const loadMoreProducts = async () => {
    const nextPage = catPage + 1;
    setCatLoadingMore(true);
    try {
      const res = await getProducts(activeCategory, nextPage, 10);
      setCategoryProducts((prev) => [...prev, ...res.products]);
      setCatPage(nextPage);
    } catch { /* ignore */ }
    finally { setCatLoadingMore(false); }
  };

  // ── Product tap → detail ──
  const openDetail = async (productId: string) => {
    setDetailLoading(true);
    setView('productDetail');
    try {
      const prod = await getProductDetail(productId);
      setDetailProduct(prod);
    } catch { setDetailProduct(null); }
    finally { setDetailLoading(false); }
  };

  // ── Traditional wizard steps by product type ──
  const getSteps = (productType: string) => {
    switch (productType) {
      case 'card': return CARD_STEPS;
      case 'savings': return SAVINGS_STEPS;
      case 'loan': case 'home_loan': return LOAN_STEPS;
      case 'insurance': return INSURANCE_STEPS;
      case 'investment': return INVESTMENT_STEPS;
      default: return CARD_STEPS;
    }
  };

  // ── Purchase → open wizard ──
  const startPurchase = () => { setView('wizard'); };

  // ══════════════════════════════════════════════════
  // VIEW: RESULT
  // ══════════════════════════════════════════════════
  if (view === 'result' && resultData) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
        <ResultCard
          productName={resultData.productName}
          productType={resultData.productType}
          referenceNo={resultData.referenceNo}
          keyDetails={resultData.keyDetails}
          nextSteps={resultData.nextSteps}
          onViewActiveProducts={() => { setView('home'); router.push('/(tabs)/profile'); }}
          onBrowseMore={() => { setView('home'); setResultData(null); }}
        />
      </ScrollView>
    );
  }

  // ══════════════════════════════════════════════════
  // VIEW: WIZARD (traditional step-by-step form)
  // ══════════════════════════════════════════════════
  if (view === 'wizard' && detailProduct) {
    const steps = getSteps(detailProduct.product_type);
    return (
      <WizardShell
        productName={detailProduct.name}
        steps={steps}
        onCancel={goBackFromView}
        onSubmit={async (formData) => {
          const res = await traditionalApply({
            product_id: detailProduct.id,
            product_type: detailProduct.product_type,
            form_data: formData,
            session_id: userId,
          });
          setResultData({
            productName: detailProduct.name,
            productType: detailProduct.product_type,
            referenceNo: res.reference_no,
            keyDetails: (res as any).key_details || [],
            nextSteps: res.next_steps,
          });
          setView('result');
        }}
      />
    );
  }

  // ══════════════════════════════════════════════════
  // VIEW: PRODUCT DETAIL
  // ══════════════════════════════════════════════════
  if (view === 'productDetail') {
    if (detailLoading || !detailProduct) {
      return (
        <View style={styles.fullScreen}>
          <View style={styles.subHeader}>
            <TouchableOpacity onPress={goBackFromView}>
              <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>Product Detail</Text>
            <View style={{ width: 22 }} />
          </View>
          <View style={styles.centered}>
            {detailLoading ? <ActivityIndicator size="large" color={Colors.gold} /> : <Text style={styles.mutedText}>Product not found</Text>}
          </View>
        </View>
      );
    }

    const DetailComponent = (() => {
      switch (detailProduct.product_type) {
        case 'card': return CardDetail;
        case 'savings': return SavingsDetail;
        case 'loan': case 'home_loan': return LoanDetail;
        case 'insurance': return InsuranceDetail;
        case 'investment': return InvestmentDetail;
        case 'promotion': return PromoDetail;
        default: return CardDetail;
      }
    })();

    return (
      <View style={styles.fullScreen}>
        {/* Header */}
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={goBackFromView}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle} numberOfLines={1}>{detailProduct.name}</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Body */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <DetailComponent product={detailProduct} />
        </ScrollView>

        {/* Purchase CTA — sticky bottom */}
        {detailProduct.product_type !== 'promotion' && (
          <View style={styles.ctaBar}>
            <TouchableOpacity style={styles.purchaseBtn} onPress={startPurchase} activeOpacity={0.8}>
              <Ionicons name="cart-outline" size={18} color={Colors.navy} />
              <Text style={styles.purchaseBtnText}>Purchase</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // ══════════════════════════════════════════════════
  // VIEW: PRODUCT LIST (by category)
  // ══════════════════════════════════════════════════
  if (view === 'productList') {
    const catLabel = activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);
    return (
      <View style={styles.fullScreen}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={goBackFromView}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>{catLabel}</Text>
          <View style={{ width: 22 }} />
        </View>

        {catLoading ? (
          <View style={styles.centered}><ActivityIndicator size="large" color={Colors.gold} /></View>
        ) : categoryProducts.length === 0 ? (
          <View style={styles.centered}><Text style={styles.mutedText}>No products found</Text></View>
        ) : (
          <ScrollView contentContainerStyle={styles.productListContent}>
            <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs, marginBottom: Spacing.md }}>
              Showing {categoryProducts.length} of {catTotal}
            </Text>
            {categoryProducts.map((p) => (
              <TouchableOpacity key={p.id} style={styles.productCard} onPress={() => openDetail(p.id)} activeOpacity={0.7}>
                <View style={styles.productCardHeader}>
                  <Text style={styles.productCardName} numberOfLines={1}>{p.name}</Text>
                  {p.risk_level && (
                    <View style={[styles.riskBadge, { backgroundColor: p.risk_level === 'low' ? `${Colors.accent}18` : p.risk_level === 'high' ? `${Colors.error}18` : `${Colors.warning}18` }]}>
                      <Text style={[styles.riskText, { color: p.risk_level === 'low' ? Colors.accent : p.risk_level === 'high' ? Colors.error : Colors.warning }]}>
                        {p.risk_level}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.productCardSub} numberOfLines={1}>{p.sub_type || p.category}</Text>
                {p.summary?.interest_rate && <Text style={styles.productCardMetric}>{p.summary.interest_rate}</Text>}
                {p.summary?.projected_return && <Text style={styles.productCardMetric}>{p.summary.projected_return}</Text>}
                <Text style={styles.productCardTagline} numberOfLines={2}>
                  {p.detail?.tagline || p.summary?.tagline || ''}
                </Text>
              </TouchableOpacity>
            ))}
            {categoryProducts.length < catTotal && (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={loadMoreProducts}
                disabled={catLoadingMore}
                activeOpacity={0.7}
              >
                {catLoadingMore ? (
                  <ActivityIndicator size="small" color={Colors.gold} />
                ) : (
                  <Text style={styles.loadMoreText}>Load More</Text>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </View>
    );
  }

  // ══════════════════════════════════════════════════
  // VIEW: HOME (default)
  // ══════════════════════════════════════════════════
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.gold} />
        <Text style={styles.mutedText}>Loading your finances...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} colors={[Colors.gold]} />}
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
              {balanceVisible ? `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$ * * * * . * *'}
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
            <TouchableOpacity key={idx} style={styles.quickAction} onPress={() => action.route && router.push(action.route as any)} activeOpacity={0.7}>
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}18` }]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Browse Products (traditional) ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse Products</Text>
        <BrowseProductsGrid aiMode={false} onCategoryTap={openCategory} />
      </View>

      {/* ── Current Promotions ── */}
      {promos.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current Promotions</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promoStrip}>
            {promos.slice(0, 5).map((p) => (
              <TouchableOpacity key={p.id} style={styles.promoCard} activeOpacity={0.7} onPress={() => openDetail(p.id)}>
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

      {/* ── AI Guide chips ── */}
      <HomeChat />
      <View style={{ height: Spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 20 },
  fullScreen: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.lg, backgroundColor: Colors.background },
  mutedText: { color: Colors.textSecondary, fontSize: FontSize.md },

  // Sub-header (for inner views)
  subHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.cardBorder,
  },
  subHeaderTitle: { flex: 1, textAlign: 'center', fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  // Header
  headerSection: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xxl },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.navy, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  avatarText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },
  greetingCol: { flex: 1 },
  greetingText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  userName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 4 },
  balanceAmount: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  eyeBtn: { padding: Spacing.sm },

  // Quick actions
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xxl },
  quickActionsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAction: { alignItems: 'center', flex: 1 },
  quickActionIcon: { width: 50, height: 50, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  quickActionLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },

  // Section header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },

  // Product list
  productListContent: { padding: Spacing.lg },
  productCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.cardBorder,
    padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.sm,
  },
  productCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  productCardName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, flex: 1 },
  riskBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm },
  riskText: { fontSize: 10, fontWeight: FontWeight.bold, textTransform: 'capitalize' },
  productCardSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.sm },
  productCardMetric: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.accent, marginBottom: 2 },
  productCardTagline: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 16 },

  // Purchase CTA bar
  ctaBar: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.cardBorder, backgroundColor: Colors.surface,
  },
  purchaseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.gold, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, gap: Spacing.sm,
    ...Shadows.gold,
  },
  purchaseBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.navy },

  // Load more
  loadMoreBtn: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md,
    borderWidth: 1, borderColor: Colors.gold, borderRadius: BorderRadius.md, marginTop: Spacing.sm,
  },
  loadMoreText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.gold },

  // Promos strip
  promoStrip: { paddingRight: Spacing.lg },
  promoCard: {
    width: 180, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.lg, marginRight: Spacing.md, ...Shadows.sm,
  },
  promoIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: 'rgba(245,158,11,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  promoName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: 4 },
  promoDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 16 },
});
