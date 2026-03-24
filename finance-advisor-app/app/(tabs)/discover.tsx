/**
 * Discover Tab — Full product browsing, detail, compare, AI chat, and execution.
 * Phase 9 + 10 — Internal views managed via state (same pattern as transfer.tsx).
 *
 * Views: home | category | detail | compare | chat | execution
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import {
  getProducts, getPromotions, getProductDetail, compareProducts, getAdvice,
  activatePromotion, Product, CompareResult, StructuredReport,
} from '../../services/api';
import { useSessionStore } from '../../store/session';
import ScoreRing from '../../components/bank/ScoreRing';
// Product detail components
import ProductShell from '../../components/products/ProductShell';
import CardDetail from '../../components/products/CardDetail';
import SavingsDetail from '../../components/products/SavingsDetail';
import LoanDetail from '../../components/products/LoanDetail';
import InsuranceDetail from '../../components/products/InsuranceDetail';
import InvestmentDetail from '../../components/products/InvestmentDetail';
import PromoDetail from '../../components/products/PromoDetail';
// Execution
import ExecutionScreen from '../../components/execution/ExecutionScreen';
import WizardShell from '../../components/traditional/WizardShell';
import { CARD_STEPS } from '../../components/traditional/steps/cards';
import { SAVINGS_STEPS } from '../../components/traditional/steps/savings';
import { LOAN_STEPS } from '../../components/traditional/steps/loans';
import { INSURANCE_STEPS } from '../../components/traditional/steps/insurance';
import { INVESTMENT_STEPS } from '../../components/traditional/steps/investments';
import { traditionalApply } from '../../services/api';

type IoniconsName = keyof typeof Ionicons.glyphMap;
type DiscoverView = 'home' | 'category' | 'detail' | 'compare' | 'chat' | 'execution' | 'traditional';

const CATEGORIES: { key: string; label: string; icon: IoniconsName; color: string }[] = [
  { key: 'cards', label: 'Cards', icon: 'card', color: Colors.gold },
  { key: 'savings', label: 'Savings', icon: 'shield-checkmark', color: Colors.savings },
  { key: 'loans', label: 'Loans', icon: 'cash', color: Colors.loan },
  { key: 'insurance', label: 'Insurance', icon: 'umbrella', color: Colors.insurance },
  { key: 'investments', label: 'Investments', icon: 'trending-up', color: Colors.investment },
  { key: 'promotions', label: 'Promos', icon: 'gift', color: Colors.scoreYellow },
];

// ──────────────────────────────────────────────
// Chat message type
// ──────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────
export default function DiscoverScreen() {
  const userId = useSessionStore((s) => s.userId);
  const inProgressProduct = useSessionStore((s) => s.inProgressProduct);

  // View state
  const [view, setView] = useState<DiscoverView>('home');
  const [navStack, setNavStack] = useState<DiscoverView[]>([]);

  // Data
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [promos, setPromos] = useState<Product[]>([]);
  const [healthScore, setHealthScore] = useState(72);

  // Category view
  const [activeCategory, setActiveCategory] = useState('');
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [subTypeFilter, setSubTypeFilter] = useState('All');
  const [compareSelection, setCompareSelection] = useState<string[]>([]);

  // Detail view
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Compare view
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // Chat view
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'assistant', text: 'Hello! I\'m your AI Financial Advisor. How can I help you today?', timestamp: new Date() },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatScrollRef = useRef<FlatList>(null);

  // Execution view
  const [execProductId, setExecProductId] = useState('');
  const [execProductType, setExecProductType] = useState('');
  const [execProductName, setExecProductName] = useState('');

  // ──────────────────────────────────────────────
  // Navigation helpers
  // ──────────────────────────────────────────────
  const navigateTo = (target: DiscoverView) => {
    setNavStack((prev) => [...prev, view]);
    setView(target);
  };

  const goBack = () => {
    const prev = [...navStack];
    const last = prev.pop() || 'home';
    setNavStack(prev);
    setView(last);
    // Reset compare selection when leaving category
    if (last === 'home') {
      setCompareSelection([]);
      setSubTypeFilter('All');
    }
  };

  // ──────────────────────────────────────────────
  // Fetch initial data
  // ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [prods, prs] = await Promise.all([getProducts(), getPromotions()]);
        setAllProducts(prods);
        setPromos(prs);
      } catch (e) {
        console.warn('Discover fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ──────────────────────────────────────────────
  // Category handlers
  // ──────────────────────────────────────────────
  const openCategory = async (catKey: string) => {
    setActiveCategory(catKey);
    setSubTypeFilter('All');
    setCompareSelection([]);
    try {
      const prods = await getProducts(catKey);
      setCategoryProducts(prods);
    } catch {
      setCategoryProducts([]);
    }
    navigateTo('category');
  };

  const filteredCategoryProducts = subTypeFilter === 'All'
    ? categoryProducts
    : categoryProducts.filter((p) => p.sub_type === subTypeFilter);

  const subTypes = ['All', ...Array.from(new Set(categoryProducts.map((p) => p.sub_type).filter(Boolean)))];

  const toggleCompare = (id: string) => {
    setCompareSelection((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  // ──────────────────────────────────────────────
  // Detail handler
  // ──────────────────────────────────────────────
  const openDetail = async (productId: string) => {
    setDetailLoading(true);
    navigateTo('detail');
    try {
      const prod = await getProductDetail(productId);
      setDetailProduct(prod);
    } catch {
      setDetailProduct(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // ──────────────────────────────────────────────
  // Compare handler
  // ──────────────────────────────────────────────
  const startCompare = async () => {
    if (compareSelection.length !== 2) return;
    setCompareLoading(true);
    navigateTo('compare');
    try {
      const result = await compareProducts(compareSelection);
      setCompareResult(result);
    } catch {
      setCompareResult(null);
    } finally {
      setCompareLoading(false);
    }
  };

  // ──────────────────────────────────────────────
  // Chat handler
  // ──────────────────────────────────────────────
  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatSending) return;
    setChatInput('');
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatSending(true);

    try {
      const report: StructuredReport = await getAdvice(text);
      const reply = [report.agent_commentary, report.report_markdown].filter(Boolean).join('\n\n---\n\n') || 'I analyzed your request. Check the recommendations in the Discover tab!';
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: reply,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, assistantMsg]);
      if (report.health_score) setHealthScore(report.health_score);
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: `Sorry, I encountered an error: ${e.message || 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatSending(false);
    }
  };

  // ──────────────────────────────────────────────
  // Execution handler
  // ──────────────────────────────────────────────
  const startExecutionFlow = (product: Product) => {
    setExecProductId(product.id);
    setExecProductType(product.agent_flow || product.product_type);
    setExecProductName(product.name);
    navigateTo('execution');
  };

  // ──────────────────────────────────────────────
  // Traditional wizard handler
  // ──────────────────────────────────────────────
  const startTraditionalFlow = (product: Product) => {
    setExecProductId(product.id);
    setExecProductType(product.agent_flow || product.product_type);
    setExecProductName(product.name);
    navigateTo('traditional');
  };

  const getTraditionalSteps = (productType: string) => {
    switch (productType) {
      case 'card': return CARD_STEPS;
      case 'savings': return SAVINGS_STEPS;
      case 'loan': case 'home_loan': return LOAN_STEPS;
      case 'insurance': return INSURANCE_STEPS;
      case 'investment': return INVESTMENT_STEPS;
      default: return CARD_STEPS;
    }
  };

  // ──────────────────────────────────────────────
  // Loading
  // ──────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  // ══════════════════════════════════════════════
  // VIEW: EXECUTION
  // ══════════════════════════════════════════════
  if (view === 'execution') {
    return (
      <ExecutionScreen
        productId={execProductId}
        productType={execProductType}
        productName={execProductName}
        onCancel={goBack}
        onComplete={() => { setView('home'); setNavStack([]); }}
        onViewProducts={() => { setView('home'); setNavStack([]); }}
      />
    );
  }

  // ══════════════════════════════════════════════
  // VIEW: TRADITIONAL WIZARD
  // ══════════════════════════════════════════════
  if (view === 'traditional') {
    const steps = getTraditionalSteps(execProductType);
    return (
      <WizardShell
        productName={execProductName}
        steps={steps}
        onCancel={goBack}
        onSubmit={async (formData) => {
          await traditionalApply({
            product_id: execProductId,
            product_type: execProductType,
            form_data: formData,
            session_id: userId,
          });
          setView('home');
          setNavStack([]);
        }}
      />
    );
  }

  // ══════════════════════════════════════════════
  // VIEW: CHAT
  // ══════════════════════════════════════════════
  if (view === 'chat') {
    return (
      <KeyboardAvoidingView style={styles.chatContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>AI Financial Advisor</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Messages */}
        <FlatList
          ref={chatScrollRef}
          data={chatMessages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.chatList}
          onContentSizeChange={() => chatScrollRef.current?.scrollToEnd()}
          renderItem={({ item }) => (
            <View style={[styles.chatBubble, item.role === 'user' ? styles.chatUser : styles.chatAssistant]}>
              {item.role === 'assistant' && (
                <View style={styles.chatAvatar}>
                  <Ionicons name="sparkles" size={14} color={Colors.gold} />
                </View>
              )}
              <View style={[styles.chatBubbleInner, item.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleBot]}>
                {item.role === 'user' ? (
                  <Text style={[styles.chatText, styles.chatTextUser]}>{item.text}</Text>
                ) : (
                  <Markdown style={{
                    body: { fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: 22 },
                    heading1: { fontSize: 18, fontWeight: 'bold', color: Colors.primary, marginTop: 12, marginBottom: 8 },
                    heading2: { fontSize: 16, fontWeight: 'bold', color: Colors.primary, marginTop: 12, marginBottom: 8 },
                    heading3: { fontSize: 15, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 8, marginBottom: 4 },
                    paragraph: { marginTop: 0, marginBottom: 8 },
                    list_item: { marginTop: 0, marginBottom: 4 },
                    strong: { fontWeight: 'bold', color: Colors.textPrimary },
                  }}>
                    {item.text}
                  </Markdown>
                )}
                <Text style={styles.chatTime}>
                  {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          )}
        />

        {/* Typing indicator */}
        {chatSending && (
          <View style={styles.typingRow}>
            <View style={styles.chatAvatar}>
              <Ionicons name="sparkles" size={14} color={Colors.gold} />
            </View>
            <View style={styles.typingDots}>
              <View style={[styles.typDot, { opacity: 0.3 }]} />
              <View style={[styles.typDot, { opacity: 0.6 }]} />
              <View style={[styles.typDot, { opacity: 1 }]} />
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.chatInputBar}>
          <TextInput
            style={styles.chatInputField}
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Ask anything..."
            placeholderTextColor={Colors.textMuted}
            multiline
            onSubmitEditing={sendChatMessage}
          />
          <TouchableOpacity
            style={[styles.chatSendBtn, (!chatInput.trim() || chatSending) && styles.chatSendDisabled]}
            onPress={sendChatMessage}
            disabled={!chatInput.trim() || chatSending}
          >
            <Ionicons name="send" size={18} color={chatInput.trim() && !chatSending ? Colors.navy : Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ══════════════════════════════════════════════
  // VIEW: COMPARE
  // ══════════════════════════════════════════════
  if (view === 'compare') {
    return (
      <View style={styles.fullContainer}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={goBack}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>Compare Products</Text>
          <View style={{ width: 22 }} />
        </View>
        {compareLoading ? (
          <View style={styles.loader}><ActivityIndicator size="large" color={Colors.gold} /></View>
        ) : compareResult ? (
          <ScrollView contentContainerStyle={styles.compareContent}>
            {/* Product headers */}
            <View style={styles.compareHeaderRow}>
              {compareResult.products.map((p) => (
                <View key={p.id} style={styles.compareHeaderCell}>
                  <Text style={styles.compareProductName} numberOfLines={2}>{p.name}</Text>
                  <Text style={styles.compareProductType}>{p.sub_type}</Text>
                </View>
              ))}
            </View>

            {/* Comparison rows */}
            {(() => {
              const keys = new Set<string>();
              compareResult.products.forEach((p) => {
                Object.keys(p.summary || {}).forEach((k) => keys.add(k));
              });
              return Array.from(keys).filter(k => !['id', 'name', 'product_type'].includes(k)).map((key) => {
                const vals = compareResult!.products.map((p) => String((p.summary || {} as any)[key] ?? '—'));
                const isBetter = vals[0] !== vals[1];
                return (
                  <View key={key} style={styles.compareRow}>
                    <Text style={styles.compareKey}>{key.replace(/_/g, ' ')}</Text>
                    <View style={styles.compareValuesRow}>
                      {vals.map((v, i) => (
                        <View key={i} style={[styles.compareValueCell, isBetter && i === 0 && styles.compareHighlight]}>
                          <Text style={styles.compareValue}>{v}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              });
            })()}

            {/* Agent note */}
            {compareResult.agent_note && (
              <View style={styles.agentNoteCard}>
                <Ionicons name="sparkles" size={16} color={Colors.gold} />
                <Text style={styles.agentNoteText}>{compareResult.agent_note}</Text>
              </View>
            )}

            {/* Apply CTAs */}
            <View style={styles.compareCtas}>
              {compareResult.products.map((p) => (
                <TouchableOpacity key={p.id} style={styles.compareCta} onPress={() => startExecutionFlow(p)}>
                  <Text style={styles.compareCtaText}>Apply for {p.name.split(' ')[0]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.loader}>
            <Text style={styles.errorText}>Failed to load comparison</Text>
          </View>
        )}
      </View>
    );
  }

  // ══════════════════════════════════════════════
  // VIEW: PRODUCT DETAIL
  // ══════════════════════════════════════════════
  if (view === 'detail') {
    if (detailLoading || !detailProduct) {
      return (
        <View style={styles.fullContainer}>
          <View style={styles.subHeader}>
            <TouchableOpacity onPress={goBack}>
              <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>Product Detail</Text>
            <View style={{ width: 22 }} />
          </View>
          <View style={styles.loader}>
            {detailLoading ? <ActivityIndicator size="large" color={Colors.gold} /> : <Text style={styles.errorText}>Product not found</Text>}
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

    const ctaLabel = detailProduct.product_type === 'promotion'
      ? 'Activate Now'
      : (detailProduct.cta_label || 'Apply Now');

    const handleCta = detailProduct.product_type === 'promotion'
      ? async () => {
          try {
            await activatePromotion(detailProduct.id, userId);
            goBack();
          } catch {}
        }
      : () => startExecutionFlow(detailProduct);

    return (
      <ProductShell
        title={detailProduct.name}
        ctaLabel={ctaLabel}
        onBack={goBack}
        onCta={handleCta}
        onChat={() => navigateTo('chat')}
        onTraditional={detailProduct.product_type !== 'promotion' ? () => startTraditionalFlow(detailProduct) : undefined}
      >
        <DetailComponent product={detailProduct} />
      </ProductShell>
    );
  }

  // ══════════════════════════════════════════════
  // VIEW: CATEGORY LISTING
  // ══════════════════════════════════════════════
  if (view === 'category') {
    const catMeta = CATEGORIES.find((c) => c.key === activeCategory);
    return (
      <View style={styles.fullContainer}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={goBack}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>{catMeta?.label || activeCategory}</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Sub-type filter pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterStrip} contentContainerStyle={styles.filterStripContent}>
          {subTypes.map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.filterPill, subTypeFilter === st && styles.filterPillActive]}
              onPress={() => setSubTypeFilter(st)}
            >
              <Text style={[styles.filterPillText, subTypeFilter === st && styles.filterPillTextActive]}>{st}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Product list */}
        <ScrollView contentContainerStyle={styles.categoryList}>
          {filteredCategoryProducts.map((p) => {
            const isSelected = compareSelection.includes(p.id);
            const isRecommended = allProducts.slice(0, 3).some((r) => r.id === p.id);
            return (
              <TouchableOpacity key={p.id} style={styles.productCard} onPress={() => openDetail(p.id)} activeOpacity={0.7}>
                {isRecommended && (
                  <View style={styles.aiPickBadge}>
                    <Ionicons name="sparkles" size={10} color={Colors.gold} />
                    <Text style={styles.aiPickText}>AI Pick</Text>
                  </View>
                )}
                <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.productMetric}>
                  {p.summary?.interest_rate || p.summary?.cashback_rate || p.summary?.rewards_rate || p.summary?.projected_return || p.summary?.coverage || p.sub_type || ''}
                </Text>
                <View style={styles.productActions}>
                  <TouchableOpacity
                    style={[styles.compareToggle, isSelected && styles.compareToggleActive]}
                    onPress={() => toggleCompare(p.id)}
                  >
                    <Ionicons name={isSelected ? 'checkmark-circle' : 'add-circle-outline'} size={16} color={isSelected ? Colors.gold : Colors.textMuted} />
                    <Text style={[styles.compareToggleText, isSelected && styles.compareToggleTextActive]}>Compare</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.productCta} onPress={() => startExecutionFlow(p)}>
                    <Text style={styles.productCtaText}>{p.cta_label || 'Apply'}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Compare floating button */}
        {compareSelection.length === 2 && (
          <TouchableOpacity style={styles.compareFloat} onPress={startCompare}>
            <Ionicons name="git-compare-outline" size={20} color={Colors.navy} />
            <Text style={styles.compareFloatText}>Compare ({compareSelection.length})</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ══════════════════════════════════════════════
  // VIEW: HOME (default)
  // ══════════════════════════════════════════════
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Resume banner */}
      {inProgressProduct && (
        <TouchableOpacity style={styles.resumeBanner} activeOpacity={0.8}
          onPress={() => {
            setExecProductId(inProgressProduct.productId);
            setExecProductType(inProgressProduct.productType);
            setExecProductName(inProgressProduct.productName);
            navigateTo('execution');
          }}
        >
          <Ionicons name="play-circle" size={24} color={Colors.gold} />
          <View style={styles.resumeInfo}>
            <Text style={styles.resumeTitle}>Continue: {inProgressProduct.productName}</Text>
            <Text style={styles.resumeSubtitle}>Your application is in progress</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* Score Ring */}
      <View style={styles.scoreSection}>
        <ScoreRing score={healthScore} size={130} />
        <Text style={styles.scoreCaption}>Your financial health is looking {healthScore >= 70 ? 'great!' : healthScore >= 40 ? 'okay' : 'concerning'}</Text>
      </View>

      {/* Recommended for you */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended for You</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendedStrip}>
          {allProducts.slice(0, 3).map((p) => (
            <TouchableOpacity key={p.id} style={styles.recommendedCard} activeOpacity={0.7} onPress={() => openDetail(p.id)}>
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={10} color={Colors.gold} />
                <Text style={styles.aiBadgeText}>AI Pick</Text>
              </View>
              <Text style={styles.recommendedName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.recommendedType}>{p.product_type}</Text>
              <TouchableOpacity style={styles.recommendedCta} onPress={() => startExecutionFlow(p)}>
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
            <TouchableOpacity key={cat.key} style={styles.categoryTile} activeOpacity={0.7} onPress={() => openCategory(cat.key)}>
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
            <TouchableOpacity key={p.id} style={styles.promoCard} activeOpacity={0.7} onPress={() => openDetail(p.id)}>
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
      <TouchableOpacity style={styles.chatBar} activeOpacity={0.8} onPress={() => navigateTo('chat')}>
        <Ionicons name="chatbubble-ellipses" size={20} color={Colors.gold} />
        <Text style={styles.chatBarText}>Ask the AI Advisor anything...</Text>
        <Ionicons name="arrow-forward-circle" size={22} color={Colors.gold} />
      </TouchableOpacity>

      <View style={{ height: Spacing.huge }} />
    </ScrollView>
  );
}

// ══════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  fullContainer: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: Colors.textMuted, fontSize: FontSize.md },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xxl },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },

  // Sub-header
  subHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.cardBorder,
  },
  subHeaderTitle: { flex: 1, textAlign: 'center', fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  // Score section
  scoreSection: { alignItems: 'center', paddingVertical: Spacing.xxl },
  scoreCaption: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.md },

  // Resume banner
  resumeBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1, borderColor: Colors.goldDark, borderRadius: BorderRadius.md,
    padding: Spacing.lg, marginHorizontal: Spacing.lg, marginTop: Spacing.lg, marginBottom: Spacing.xxl,
  },
  resumeInfo: { flex: 1, marginLeft: Spacing.md },
  resumeTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.gold },
  resumeSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  // Recommended strip
  recommendedStrip: { paddingRight: Spacing.lg },
  recommendedCard: {
    width: 180, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.lg, marginRight: Spacing.md, ...Shadows.sm,
  },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(201,168,76,0.12)', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: BorderRadius.sm, alignSelf: 'flex-start', marginBottom: Spacing.sm,
  },
  aiBadgeText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.gold, letterSpacing: 0.5 },
  recommendedName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: 4 },
  recommendedType: { fontSize: FontSize.xs, color: Colors.textMuted, textTransform: 'capitalize', marginBottom: Spacing.md },
  recommendedCta: { backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.sm, paddingVertical: Spacing.sm, alignItems: 'center' },
  recommendedCtaText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.gold },

  // Category grid
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.md },
  categoryTile: {
    width: '30%', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.cardBorder, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.sm,
  },
  categoryIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  categoryLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary },

  // Promos
  promoCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.lg, marginBottom: Spacing.sm,
  },
  promoIcon: {
    width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: 'rgba(255,217,61,0.12)',
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  promoInfo: { flex: 1 },
  promoName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: 2 },
  promoDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 16 },

  // Chat bar
  chatBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.lg, marginHorizontal: Spacing.lg, gap: Spacing.md,
  },
  chatBarText: { flex: 1, fontSize: FontSize.md, color: Colors.textMuted },

  // Category listing
  filterStrip: { maxHeight: 50, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.cardBorder },
  filterStripContent: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.sm },
  filterPill: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  filterPillActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  filterPillText: { fontSize: FontSize.sm, color: Colors.textSecondary, textTransform: 'capitalize' },
  filterPillTextActive: { color: Colors.navy, fontWeight: FontWeight.bold },
  categoryList: { padding: Spacing.lg, gap: Spacing.md },
  productCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: Spacing.lg,
  },
  aiPickBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(201,168,76,0.12)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm, alignSelf: 'flex-start', marginBottom: Spacing.sm,
  },
  aiPickText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.gold, letterSpacing: 0.5 },
  productName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: 4 },
  productMetric: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  productActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compareToggle: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  compareToggleActive: {},
  compareToggleText: { fontSize: FontSize.xs, color: Colors.textMuted },
  compareToggleTextActive: { color: Colors.gold },
  productCta: { backgroundColor: Colors.gold, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  productCtaText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.navy },
  compareFloat: {
    position: 'absolute', bottom: Spacing.xxl, left: Spacing.lg, right: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.gold, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md, ...Shadows.gold,
  },
  compareFloatText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.navy },

  // Compare view
  compareContent: { padding: Spacing.lg },
  compareHeaderRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xxl },
  compareHeaderCell: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.lg, alignItems: 'center',
  },
  compareProductName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  compareProductType: { fontSize: FontSize.xs, color: Colors.textMuted, textTransform: 'capitalize', marginTop: 4 },
  compareRow: {
    marginBottom: Spacing.sm, backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.md,
  },
  compareKey: { fontSize: FontSize.xs, color: Colors.textMuted, textTransform: 'capitalize', marginBottom: Spacing.sm },
  compareValuesRow: { flexDirection: 'row', gap: Spacing.sm },
  compareValueCell: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm },
  compareHighlight: { backgroundColor: 'rgba(0,230,138,0.08)' },
  compareValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  agentNoteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: 'rgba(201,168,76,0.08)', borderRadius: BorderRadius.md, padding: Spacing.lg, marginVertical: Spacing.lg,
  },
  agentNoteText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  compareCtas: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  compareCta: {
    flex: 1, backgroundColor: Colors.gold, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center', ...Shadows.gold,
  },
  compareCtaText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.navy },

  // Chat view
  chatContainer: { flex: 1, backgroundColor: Colors.background },
  chatList: { padding: Spacing.lg, paddingBottom: Spacing.md },
  chatBubble: { flexDirection: 'row', marginBottom: Spacing.md },
  chatUser: { justifyContent: 'flex-end' },
  chatAssistant: { justifyContent: 'flex-start' },
  chatAvatar: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(201,168,76,0.12)',
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm, marginTop: 2,
  },
  chatBubbleInner: { maxWidth: '75%', borderRadius: BorderRadius.lg, padding: Spacing.md },
  chatBubbleUser: { backgroundColor: Colors.gold, borderBottomRightRadius: 4 },
  chatBubbleBot: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder, borderBottomLeftRadius: 4 },
  chatText: { fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: 22 },
  chatTextUser: { color: Colors.navy },
  chatTime: { fontSize: 10, color: Colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  typingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  typingDots: { flexDirection: 'row', gap: 4, backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: BorderRadius.lg },
  typDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.gold },
  chatInputBar: {
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.cardBorder, backgroundColor: Colors.surface,
  },
  chatInputField: {
    flex: 1, minHeight: 40, maxHeight: 100, backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.textPrimary, marginRight: Spacing.sm,
  },
  chatSendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.gold,
    justifyContent: 'center', alignItems: 'center',
  },
  chatSendDisabled: { backgroundColor: Colors.surfaceLight },
});
