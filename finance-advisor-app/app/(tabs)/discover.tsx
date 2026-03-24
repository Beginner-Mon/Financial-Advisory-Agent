/**
 * AI Guide Tab — Chat UI + AI-assisted Browse Products (✨).
 * Views: home | chat | aiProductList | productDetail | aiAutoFill | result
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput, FlatList, KeyboardAvoidingView, Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import {
  getProducts, getProductDetail, getAdvice, traditionalApply,
  Product, StructuredReport, Recommendation,
} from '../../services/api';
import { useSessionStore } from '../../store/session';
import BrowseProductsGrid from '../../components/products/BrowseProductsGrid';
import CardDetail from '../../components/products/CardDetail';
import SavingsDetail from '../../components/products/SavingsDetail';
import LoanDetail from '../../components/products/LoanDetail';
import InsuranceDetail from '../../components/products/InsuranceDetail';
import InvestmentDetail from '../../components/products/InvestmentDetail';
import ResultCard, { KeyDetail } from '../../components/shared/ResultCard';

type DiscoverView = 'home' | 'chat' | 'aiProductList' | 'productDetail' | 'aiAutoFill' | 'result';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  recommendations?: Recommendation[];
}

export default function DiscoverScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = useSessionStore((s) => s.userId);
  const profile = useSessionStore((s) => s.profile);

  const [view, setView] = useState<DiscoverView>('home');
  const [loading, setLoading] = useState(false);

  // ── AI Product List ──
  const [activeCategory, setActiveCategory] = useState('');
  const [aiProducts, setAiProducts] = useState<Product[]>([]);
  const [aiNote, setAiNote] = useState('');
  const [aiListLoading, setAiListLoading] = useState(false);

  // ── Product Detail ──
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailSource, setDetailSource] = useState<DiscoverView>('aiProductList');

  // ── AI Auto-Fill ──
  const [filledForm, setFilledForm] = useState<Record<string, any>>({});
  const [aiRationale, setAiRationale] = useState('');
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Result ──
  const [resultData, setResultData] = useState<{
    productName: string; productType: string; referenceNo: string;
    keyDetails: KeyDetail[]; nextSteps: string;
  } | null>(null);

  // ── Chat ──
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'assistant', text: 'Hello! I\'m your AI Financial Advisor. How can I help you today?', timestamp: new Date() },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatScrollRef = useRef<FlatList>(null);

  // ── Navigation ──
  const goBack = () => {
    if (view === 'aiProductList') setView('home');
    else if (view === 'productDetail') setView(detailSource);
    else if (view === 'aiAutoFill') setView('productDetail');
    else if (view === 'result') { setView('home'); setResultData(null); }
    else if (view === 'chat') setView('home');
    else setView('home');
  };

  // ── AI Category Tap: fetch and sort recommended products ──
  const openAiCategory = async (catKey: string) => {
    setActiveCategory(catKey);
    setAiListLoading(true);
    setView('aiProductList');
    try {
      // Fetch all products in category
      const res = await getProducts(catKey, 1, 50);
      let fetched = res.products;

      // Sort by relevance to profile
      if (profile) {
        fetched = fetched.map(p => {
          let score = 0;
          // Risk match
          if (profile.risk_tolerance === 'low' && p.risk_level === 'low') score += 2;
          if (profile.risk_tolerance === 'medium' && p.risk_level === 'moderate') score += 2;
          if (profile.risk_tolerance === 'high' && p.risk_level === 'high') score += 2;
          // Goals match
          if (p.eligible_goals) {
            profile.goals.forEach(g => {
              if (p.eligible_goals!.includes(g)) score += 1;
            });
          }
          return { ...p, _score: score };
        })
        .sort((a: any, b: any) => b._score - a._score)
        .map((p: any, idx) => {
          // Top 3 matches get the AI Recommended badge
          if (idx < 3 && p._score > 0) {
            p.isAiRecommended = true;
          }
          delete p._score;
          return p as Product;
        });
      }

      setAiProducts(fetched);
      setAiNote(`Based on your profile, here are the best ${catKey} options for you.`);
    } catch {
      setAiProducts([]);
      setAiNote('');
    } finally {
      setAiListLoading(false);
    }
  };

  // ── Product detail ──
  const openDetail = async (productId: string, source: DiscoverView = 'aiProductList') => {
    setDetailSource(source);
    setDetailLoading(true);
    setView('productDetail');
    try {
      const prod = await getProductDetail(productId);
      setDetailProduct(prod);
    } catch { setDetailProduct(null); }
    finally { setDetailLoading(false); }
  };

  // ── AI Purchase: auto-fill form ──
  const startAiPurchase = async () => {
    if (!detailProduct) return;
    setAutoFillLoading(true);
    setOtpValue('');
    setView('aiAutoFill');
    try {
      // Auto-generate form data from user profile
      const userName = profile?.name || 'Alex Johnson';
      const filled: Record<string, any> = {
        full_name: userName,
        email: `${userName.toLowerCase().replace(/\s/g, '.')}@email.com`,
        mobile: '+1 (555) 000-1234',
        id_number: 'S1234567A',
        dob: '1990-06-15',
        job_stability: 'Stable',
        employer: 'Demo Corp',
        income: '85000',
        monthly_income: '7083',
      };

      // Product-specific fields
      if (detailProduct.product_type === 'card') {
        filled.credit_limit = '$5,000';
        filled.statement_cycle = '1st of month';
        filled.autopay = 'Full balance';
      } else if (detailProduct.product_type === 'savings') {
        filled.account_nickname = `AI Savings ${new Date().toLocaleDateString()}`;
        filled.initial_deposit = '1000';
        filled.funding_account = 'Main Checking';
      } else if (detailProduct.product_type === 'loan' || detailProduct.product_type === 'home_loan') {
        filled.loan_amount = '10000';
        filled.loan_tenure = '24 months';
        filled.loan_purpose = 'Education';
      } else if (detailProduct.product_type === 'insurance') {
        filled.coverage_tier = 'Standard';
        filled.coverage_amount = '50000';
        filled.payment_frequency = 'Monthly';
      } else if (detailProduct.product_type === 'investment') {
        filled.investment_amount = '5000';
        filled.funding_account = 'Main Checking';
      }

      setFilledForm(filled);
      setAiRationale(`AI has selected optimal values based on your income ($${filled.income}/year), risk profile, and financial goals.`);
    } catch {
      setAiRationale('Failed to auto-fill. Please try again.');
    } finally {
      setAutoFillLoading(false);
    }
  };

  // ── Submit AI auto-filled form ──
  const submitAiForm = async () => {
    if (!detailProduct || otpValue.length < 6) return;
    setSubmitting(true);
    try {
      const res = await traditionalApply({
        product_id: detailProduct.id,
        product_type: detailProduct.product_type,
        form_data: { ...filledForm, otp: otpValue, terms: true },
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
    } catch (e: any) {
      setAiRationale(`Submission failed: ${e.message || 'Please try again.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Chat Send ──
  const sendChatMessage = async (initialMessage?: string | any) => {
    const text = (typeof initialMessage === 'string' ? initialMessage : undefined) || chatInput.trim();
    if (!text || chatSending) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text, timestamp: new Date() };
    setChatMessages((prev) => [...prev, userMsg]);
    if (typeof initialMessage !== 'string') setChatInput('');
    setChatSending(true);
    try {
      const report: StructuredReport = await getAdvice(text);
      const reply = [report.agent_commentary, report.report_markdown].filter(Boolean).join('\n\n') || 'I\'m here to help with your finances.';
      setChatMessages((prev) => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: reply,
        timestamp: new Date(),
        recommendations: report.recommendations?.length ? report.recommendations : undefined,
      }]);
    } catch {
      setChatMessages((prev) => [...prev, { id: `e-${Date.now()}`, role: 'assistant', text: 'Sorry, I encountered an error. Please try again.', timestamp: new Date() }]);
    } finally {
      setChatSending(false);
    }
  };

  // ── Handle incoming query params from Home chips ──
  useEffect(() => {
    if (params.initialPrompt && typeof params.initialPrompt === 'string') {
      setView('chat');
      // Delay slightly to prevent ref updates during strict mode render cycle
      setTimeout(() => {
        sendChatMessage(params.initialPrompt as string);
        router.setParams({ initialPrompt: '' });
      }, 0);
    }
  }, [params.initialPrompt]);

  // ══════════════════════════════════════════════
  // VIEW: RESULT
  // ══════════════════════════════════════════════
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

  // ══════════════════════════════════════════════
  // VIEW: AI AUTO-FILL (user only types OTP)
  // ══════════════════════════════════════════════
  if (view === 'aiAutoFill' && detailProduct) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={goBack}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>AI Auto-Fill</Text>
          <View style={styles.aiBadgeSmall}>
            <Ionicons name="sparkles" size={12} color={Colors.gold} />
          </View>
        </View>

        {autoFillLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.gold} />
            <Text style={styles.mutedText}>AI is filling your application...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.autoFillContent}>
            {/* AI rationale */}
            <View style={styles.rationaleCard}>
              <Ionicons name="sparkles" size={16} color={Colors.gold} />
              <Text style={styles.rationaleText}>{aiRationale}</Text>
            </View>

            {/* Pre-filled fields (editable) */}
            <Text style={styles.formSectionTitle}>Application Details</Text>
            <Text style={styles.editHint}>AI filled these for you — tap any field to edit</Text>
            {Object.entries(filledForm).map(([key, value]) => (
              <View key={key} style={styles.filledRow}>
                <Text style={styles.filledLabel}>{key.replace(/_/g, ' ')}</Text>
                <TextInput
                  style={styles.filledInput}
                  value={String(value)}
                  onChangeText={(text) => setFilledForm((prev) => ({ ...prev, [key]: text }))}
                />
                <Ionicons name="sparkles" size={14} color={Colors.gold} />
              </View>
            ))}

            {/* OTP — the only thing user types */}
            <View style={styles.otpSection}>
              <Text style={styles.formSectionTitle}>Verification</Text>
              <Text style={styles.otpHint}>Enter the 6-digit OTP sent to your registered mobile</Text>
              <TextInput
                style={styles.otpInput}
                placeholder="• • • • • •"
                placeholderTextColor={Colors.textMuted}
                value={otpValue}
                onChangeText={(t) => setOtpValue(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, (otpValue.length < 6 || submitting) && styles.submitBtnDisabled]}
              onPress={submitAiForm}
              disabled={otpValue.length < 6 || submitting}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.navy} />
              ) : (
                <>
                  <Ionicons name="sparkles" size={16} color={Colors.navy} />
                  <Text style={styles.submitBtnText}>Confirm & Submit</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    );
  }

  // ══════════════════════════════════════════════
  // VIEW: PRODUCT DETAIL
  // ══════════════════════════════════════════════
  if (view === 'productDetail') {
    if (detailLoading || !detailProduct) {
      return (
        <View style={styles.container}>
          <View style={styles.subHeader}>
            <TouchableOpacity onPress={goBack}>
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
        default: return CardDetail;
      }
    })();

    return (
      <View style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={goBack}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle} numberOfLines={1}>{detailProduct.name}</Text>
          <View style={styles.aiBadgeSmall}>
            <Ionicons name="sparkles" size={12} color={Colors.gold} />
          </View>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <DetailComponent product={detailProduct} />
        </ScrollView>
        {/* AI Purchase CTA */}
        <View style={styles.ctaBar}>
          <TouchableOpacity style={styles.aiPurchaseBtn} onPress={startAiPurchase} activeOpacity={0.8}>
            <Ionicons name="sparkles" size={18} color={Colors.navy} />
            <Text style={styles.aiPurchaseBtnText}>Purchase with AI</Text>
          </TouchableOpacity>
          <Text style={styles.ctaSubtext}>AI fills everything — you only type OTP</Text>
        </View>
      </View>
    );
  }

  // ══════════════════════════════════════════════
  // VIEW: AI PRODUCT LIST
  // ══════════════════════════════════════════════
  if (view === 'aiProductList') {
    const catLabel = activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);
    return (
      <View style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={goBack}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>{catLabel}</Text>
          <View style={styles.aiBadgeSmall}>
            <Ionicons name="sparkles" size={12} color={Colors.gold} />
          </View>
        </View>

        {aiListLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.gold} />
            <Text style={styles.mutedText}>AI is finding the best products for you…</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent}>
            {/* AI note */}
            {aiNote ? (
              <View style={styles.rationaleCard}>
                <Ionicons name="sparkles" size={16} color={Colors.gold} />
                <Text style={styles.rationaleText}>{aiNote}</Text>
              </View>
            ) : null}

            {aiProducts.length === 0 ? (
              <Text style={styles.mutedText}>No products found</Text>
            ) : (
              aiProducts.map((p, idx) => (
                <TouchableOpacity key={p.id} style={styles.productCard} onPress={() => openDetail(p.id)} activeOpacity={0.7}>
                  {idx < 3 && (
                    <View style={styles.aiPickTag}>
                      <Ionicons name="sparkles" size={10} color={Colors.gold} />
                      <Text style={styles.aiPickText}>AI Recommended</Text>
                    </View>
                  )}
                  <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.productSub}>{p.sub_type || p.category}</Text>
                  {p.summary?.interest_rate && <Text style={styles.productMetric}>{p.summary.interest_rate}</Text>}
                  {p.summary?.projected_return && <Text style={styles.productMetric}>{p.summary.projected_return}</Text>}
                  <Text style={styles.productTagline} numberOfLines={2}>{p.detail?.tagline || ''}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </View>
    );
  }

  // ══════════════════════════════════════════════
  // VIEW: CHAT
  // ══════════════════════════════════════════════
  if (view === 'chat') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>AI Financial Advisor</Text>
          <View style={{ width: 22 }} />
        </View>

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
                {/* Recommendation cards */}
                {item.recommendations && item.recommendations.length > 0 && (
                  <View style={styles.recCardsWrap}>
                    <Text style={styles.recCardsTitle}>Recommended Products</Text>
                    {item.recommendations.map((rec: any, idx: number) => (
                      <View key={idx} style={styles.recCard}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.recCardName}>{rec.name}</Text>
                          <Text style={styles.recCardType}>{rec.type}{rec.return_pct ? ` • ${rec.return_pct}% return` : ''}</Text>
                          <Text style={styles.recCardRationale} numberOfLines={2}>{rec.rationale}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.recPurchaseBtn}
                          activeOpacity={0.7}
                          onPress={() => {
                            // Find product by name and open detail
                            openAiCategory(rec.type === 'investment' ? 'investments' : rec.type === 'card' ? 'cards' : rec.type + 's');
                          }}
                        >
                          <Ionicons name="sparkles" size={12} color={Colors.navy} />
                          <Text style={styles.recPurchaseBtnText}>Browse</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                <Text style={styles.chatTime}>
                  {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          )}
        />

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
  // VIEW: HOME (AI Guide landing)
  // ══════════════════════════════════════════════
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false}>
      {/* Chat CTA */}
      <TouchableOpacity style={styles.chatCta} onPress={() => setView('chat')} activeOpacity={0.8}>
        <View style={styles.chatCtaIcon}>
          <Ionicons name="sparkles" size={22} color={Colors.gold} />
        </View>
        <View style={styles.chatCtaText}>
          <Text style={styles.chatCtaTitle}>AI Financial Advisor</Text>
          <Text style={styles.chatCtaSub}>Ask me anything about your finances</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      {/* Browse Products ✨ */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="sparkles" size={16} color={Colors.gold} />
          <Text style={styles.sectionTitle}>Browse Products</Text>
        </View>
        <Text style={styles.sectionSub}>AI helps you choose and auto-fills the application</Text>
        <BrowseProductsGrid aiMode={true} onCategoryTap={openAiCategory} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  homeContent: { padding: Spacing.lg, paddingBottom: Spacing.huge },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.lg },
  mutedText: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center' },

  // Sub-header
  subHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.cardBorder,
  },
  subHeaderTitle: { flex: 1, textAlign: 'center', fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  aiBadgeSmall: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(201,168,76,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Chat CTA
  chatCta: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.cardBorder,
    padding: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.xxl, ...Shadows.sm,
  },
  chatCtaIcon: {
    width: 48, height: 48, borderRadius: BorderRadius.md, backgroundColor: 'rgba(201,168,76,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  chatCtaText: { flex: 1 },
  chatCtaTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  chatCtaSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  // Section
  section: { marginBottom: Spacing.xxl },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 2 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  sectionSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.md },

  // Product list
  listContent: { padding: Spacing.lg },
  productCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.cardBorder,
    padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.sm,
  },
  aiPickTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(201,168,76,0.12)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm, alignSelf: 'flex-start', marginBottom: Spacing.sm,
  },
  aiPickText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.gold, letterSpacing: 0.5 },
  productName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 4 },
  productSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.sm },
  productMetric: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.accent, marginBottom: 2 },
  productTagline: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 16 },

  // CTA bar
  ctaBar: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.cardBorder, backgroundColor: Colors.surface,
  },
  aiPurchaseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.gold, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, gap: Spacing.sm, ...Shadows.gold,
  },
  aiPurchaseBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.navy },
  ctaSubtext: { fontSize: 10, color: Colors.textMuted, textAlign: 'center', marginTop: 4 },

  // AI rationale card
  rationaleCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: 'rgba(201,168,76,0.08)', borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.xxl,
  },
  rationaleText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  // Auto-fill form
  autoFillContent: { padding: Spacing.lg },
  formSectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  filledRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.cardBorder,
  },
  filledLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textTransform: 'capitalize', width: '35%' },
  filledInput: {
    flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textPrimary,
    backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  editHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.md, fontStyle: 'italic' },

  // OTP
  otpSection: { marginTop: Spacing.xxl },
  otpHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.md },
  otpInput: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.cardBorder,
    padding: Spacing.lg, fontSize: FontSize.xl, fontWeight: FontWeight.bold,
    color: Colors.textPrimary, letterSpacing: 8,
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.gold, borderRadius: BorderRadius.md, paddingVertical: Spacing.lg,
    gap: Spacing.sm, marginTop: Spacing.xxl, ...Shadows.gold,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.navy },

  // Chat view
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
  chatSendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.gold, justifyContent: 'center', alignItems: 'center' },
  // Recommendation Cards in Chat
  recCardsWrap: { marginTop: Spacing.sm, gap: Spacing.sm },
  recCardsTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textMuted, marginBottom: 2 },
  recCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.cardBorder, gap: Spacing.md
  },
  recCardName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: 2 },
  recCardType: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 4, textTransform: 'capitalize' },
  recCardRationale: { fontSize: FontSize.sm, color: Colors.textSecondary },
  recPurchaseBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, gap: 4
  },
  recPurchaseBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.navy },

  chatSendDisabled: { backgroundColor: Colors.surfaceLight },
});
