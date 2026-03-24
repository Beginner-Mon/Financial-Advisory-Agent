/**
 * Transfer Tab — Full 4-step transfer flow.
 * Step 8.1 + 8.2 — Transfer Home + New Transfer Flow
 *
 * Flow: Home → Recipient → Amount → Review → OTP → Success
 * Security rule: Agent never initiates transfers. Always manual.
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Animated, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { getAccounts, initiateTransfer, confirmTransfer, Account } from '../../services/api';
import { useSessionStore } from '../../store/session';

type IoniconsName = keyof typeof Ionicons.glyphMap;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type FlowStep = 'home' | 'recipient' | 'amount' | 'review' | 'otp' | 'success';

interface Payee {
  id: string;
  name: string;
  bank: string;
  accountNo: string;
  icon: IoniconsName;
}

// Mock saved payees
const SAVED_PAYEES: Payee[] = [
  { id: 'p1', name: 'Alice Johnson', bank: 'Chase Bank', accountNo: '****5678', icon: 'person-circle-outline' },
  { id: 'p2', name: 'Bob Smith', bank: 'Bank of America', accountNo: '****9012', icon: 'person-circle-outline' },
  { id: 'p3', name: 'Carol Davis', bank: 'Wells Fargo', accountNo: '****3456', icon: 'person-circle-outline' },
  { id: 'p4', name: 'David Lee', bank: 'Citibank', accountNo: '****7890', icon: 'person-circle-outline' },
];

export default function TransferScreen() {
  const userId = useSessionStore((s) => s.userId);

  // Flow state
  const [step, setStep] = useState<FlowStep>('home');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  // Transfer data
  const [selectedPayee, setSelectedPayee] = useState<Payee | null>(null);
  const [newPayeeName, setNewPayeeName] = useState('');
  const [newPayeeBank, setNewPayeeBank] = useState('');
  const [newPayeeAccount, setNewPayeeAccount] = useState('');
  const [showNewPayeeForm, setShowNewPayeeForm] = useState(false);
  const [payeeSearch, setPayeeSearch] = useState('');

  const [selectedFromAccount, setSelectedFromAccount] = useState<Account | null>(null);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');

  // OTP state
  const [transferId, setTransferId] = useState('');
  const [otpSentTo, setOtpSentTo] = useState('');
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [otpProcessing, setOtpProcessing] = useState(false);

  // Success state
  const [referenceNo, setReferenceNo] = useState('');
  const [successAmount, setSuccessAmount] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;

  // Fetch accounts on mount — only checking accounts allowed for transfers
  useEffect(() => {
    (async () => {
      try {
        const accs = await getAccounts(userId);
        const checkingOnly = accs.filter((a) => a.type === 'checking');
        setAccounts(checkingOnly);
        if (checkingOnly.length > 0) setSelectedFromAccount(checkingOnly[0]);
      } catch (e) {
        console.warn('Error fetching accounts:', e);
      }
    })();
  }, [userId]);

  // OTP countdown timer
  useEffect(() => {
    if (step !== 'otp' || otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  // Success animation
  useEffect(() => {
    if (step === 'success') {
      Animated.spring(checkmarkScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [step]);

  // Step transition
  const goToStep = (nextStep: FlowStep) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const goBack = () => {
    const backMap: Record<FlowStep, FlowStep> = {
      home: 'home',
      recipient: 'home',
      amount: 'recipient',
      review: 'amount',
      otp: 'review',
      success: 'home',
    };
    goToStep(backMap[step]);
  };

  const resetFlow = () => {
    setSelectedPayee(null);
    setNewPayeeName('');
    setNewPayeeBank('');
    setNewPayeeAccount('');
    setShowNewPayeeForm(false);
    setPayeeSearch('');
    setAmount('');
    setReference('');
    setOtp('');
    setOtpTimer(60);
    setTransferId('');
    setReferenceNo('');
    checkmarkScale.setValue(0);
    goToStep('home');
  };

  // Select payee from new form
  const confirmNewPayee = () => {
    if (!newPayeeName.trim() || !newPayeeAccount.trim()) return;
    setSelectedPayee({
      id: `new-${Date.now()}`,
      name: newPayeeName.trim(),
      bank: newPayeeBank.trim() || 'Other Bank',
      accountNo: newPayeeAccount.trim(),
      icon: 'person-add-outline',
    });
    setShowNewPayeeForm(false);
    goToStep('amount');
  };

  // Submit transfer for OTP
  const handleConfirmTransfer = async () => {
    if (!selectedFromAccount || !selectedPayee || !amount) return;
    setLoading(true);
    try {
      const result = await initiateTransfer({
        from_account: selectedFromAccount.account_id,
        to_account: selectedPayee.accountNo.replace(/\*/g, '0'),
        amount: parseFloat(amount),
        reference: reference || 'Transfer',
      });
      setTransferId(result.transfer_id);
      setOtpSentTo(result.otp_sent_to);
      setOtpTimer(60);
      setOtp('');
      goToStep('otp');
    } catch (e: any) {
      console.warn('Transfer initiation failed:', e.message);
    } finally {
      setLoading(false);
    }
  };

  // Confirm OTP
  const handleOtpSubmit = async () => {
    if (otp.length !== 6) return;
    setOtpProcessing(true);
    try {
      const result = await confirmTransfer(transferId, otp);
      setReferenceNo(result.reference_no);
      setSuccessAmount(result.amount);
      goToStep('success');
    } catch (e: any) {
      console.warn('OTP confirmation failed:', e.message);
    } finally {
      setOtpProcessing(false);
    }
  };

  const filteredPayees = payeeSearch
    ? SAVED_PAYEES.filter((p) =>
        p.name.toLowerCase().includes(payeeSearch.toLowerCase()) ||
        p.bank.toLowerCase().includes(payeeSearch.toLowerCase())
      )
    : SAVED_PAYEES;

  const parsedAmount = parseFloat(amount) || 0;

  // =========================================================================
  // RENDER STEPS
  // =========================================================================

  // ----- HOME -----
  const renderHome = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.heroSection}>
        <View style={styles.heroIconCircle}>
          <Ionicons name="swap-horizontal" size={40} color={Colors.gold} />
        </View>
        <Text style={styles.heroTitle}>Transfer Money</Text>
        <Text style={styles.heroSubtitle}>Send money securely with OTP verification</Text>
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.newTransferCta} onPress={() => goToStep('recipient')} activeOpacity={0.8}>
        <View style={styles.ctaIconCircle}>
          <Ionicons name="add" size={24} color={Colors.navy} />
        </View>
        <View style={styles.ctaInfo}>
          <Text style={styles.ctaTitle}>New Transfer</Text>
          <Text style={styles.ctaSubtitle}>Send to a new or saved payee</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
      </TouchableOpacity>

      {/* Saved Payees */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Saved Payees</Text>
        <View style={styles.payeesList}>
          {SAVED_PAYEES.map((payee) => (
            <TouchableOpacity
              key={payee.id}
              style={styles.payeeRow}
              onPress={() => {
                setSelectedPayee(payee);
                goToStep('amount');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.payeeAvatar}>
                <Text style={styles.payeeAvatarText}>{payee.name.charAt(0)}</Text>
              </View>
              <View style={styles.payeeInfo}>
                <Text style={styles.payeeName}>{payee.name}</Text>
                <Text style={styles.payeeBank}>{payee.bank} · {payee.accountNo}</Text>
              </View>
              <Ionicons name="arrow-forward-circle-outline" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Scheduled (placeholder) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scheduled Payments</Text>
        <View style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={32} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No scheduled payments</Text>
        </View>
      </View>

      <View style={{ height: Spacing.huge }} />
    </ScrollView>
  );

  // ----- RECIPIENT -----
  const renderRecipient = () => (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.stepHeader}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.stepTitle}>Select Recipient</Text>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>1/4</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarOuter}>
          <View style={[styles.progressBarFill, { width: '25%' }]} />
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search payees..."
            placeholderTextColor={Colors.textMuted}
            value={payeeSearch}
            onChangeText={setPayeeSearch}
          />
        </View>

        {/* New payee toggle */}
        <TouchableOpacity
          style={styles.newPayeeToggle}
          onPress={() => setShowNewPayeeForm(!showNewPayeeForm)}
          activeOpacity={0.7}
        >
          <View style={styles.newPayeeIcon}>
            <Ionicons name={showNewPayeeForm ? 'close' : 'person-add'} size={18} color={Colors.gold} />
          </View>
          <Text style={styles.newPayeeText}>
            {showNewPayeeForm ? 'Cancel' : '+ New Payee'}
          </Text>
        </TouchableOpacity>

        {/* New payee form */}
        {showNewPayeeForm && (
          <View style={styles.newPayeeForm}>
            <TextInput
              style={styles.formInput}
              placeholder="Payee name"
              placeholderTextColor={Colors.textMuted}
              value={newPayeeName}
              onChangeText={setNewPayeeName}
            />
            <TextInput
              style={styles.formInput}
              placeholder="Bank name"
              placeholderTextColor={Colors.textMuted}
              value={newPayeeBank}
              onChangeText={setNewPayeeBank}
            />
            <TextInput
              style={styles.formInput}
              placeholder="Account number"
              placeholderTextColor={Colors.textMuted}
              value={newPayeeAccount}
              onChangeText={setNewPayeeAccount}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[styles.primaryBtn, (!newPayeeName.trim() || !newPayeeAccount.trim()) && styles.primaryBtnDisabled]}
              onPress={confirmNewPayee}
              disabled={!newPayeeName.trim() || !newPayeeAccount.trim()}
            >
              <Text style={styles.primaryBtnText}>Continue with this payee</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Payees list */}
        {!showNewPayeeForm && (
          <View style={styles.payeesList}>
            {filteredPayees.map((payee) => (
              <TouchableOpacity
                key={payee.id}
                style={styles.payeeRow}
                onPress={() => {
                  setSelectedPayee(payee);
                  goToStep('amount');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.payeeAvatar}>
                  <Text style={styles.payeeAvatarText}>{payee.name.charAt(0)}</Text>
                </View>
                <View style={styles.payeeInfo}>
                  <Text style={styles.payeeName}>{payee.name}</Text>
                  <Text style={styles.payeeBank}>{payee.bank} · {payee.accountNo}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
            {filteredPayees.length === 0 && (
              <View style={styles.emptyCard}>
                <Ionicons name="search-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No payees found</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // ----- AMOUNT -----
  const renderAmount = () => (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.stepHeader}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.stepTitle}>Enter Amount</Text>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>2/4</Text>
          </View>
        </View>

        <View style={styles.progressBarOuter}>
          <View style={[styles.progressBarFill, { width: '50%' }]} />
        </View>

        {/* To payee card */}
        {selectedPayee && (
          <View style={styles.miniPayeeCard}>
            <Text style={styles.miniPayeeLabel}>Sending to</Text>
            <Text style={styles.miniPayeeName}>{selectedPayee.name}</Text>
            <Text style={styles.miniPayeeBank}>{selectedPayee.bank}</Text>
          </View>
        )}

        {/* Amount input */}
        <View style={styles.amountSection}>
          <Text style={styles.currencySign}>$</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={Colors.textMuted}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            autoFocus
          />
        </View>

        {/* Quick amounts */}
        <View style={styles.quickAmounts}>
          {[50, 100, 250, 500, 1000].map((val) => (
            <TouchableOpacity
              key={val}
              style={[styles.quickAmountBtn, parseFloat(amount) === val && styles.quickAmountBtnActive]}
              onPress={() => setAmount(String(val))}
            >
              <Text style={[styles.quickAmountText, parseFloat(amount) === val && styles.quickAmountTextActive]}>
                ${val}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* From account picker */}
        <View style={styles.fromAccountSection}>
          <Text style={styles.fromLabel}>From Account</Text>
          {accounts.map((acc) => (
            <TouchableOpacity
              key={acc.account_id}
              style={[styles.accountOption, selectedFromAccount?.account_id === acc.account_id && styles.accountOptionActive]}
              onPress={() => setSelectedFromAccount(acc)}
            >
              <View style={styles.accountOptionInfo}>
                <Text style={styles.accountOptionType}>
                  {acc.type.charAt(0).toUpperCase() + acc.type.slice(1)}
                </Text>
                <Text style={styles.accountOptionNo}>••{acc.account_no.slice(-4)}</Text>
              </View>
              <Text style={styles.accountOptionBalance}>
                ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
              {selectedFromAccount?.account_id === acc.account_id && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.gold} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Reference */}
        <View style={styles.referenceSection}>
          <Text style={styles.fromLabel}>Reference (optional)</Text>
          <TextInput
            style={styles.formInput}
            placeholder="What's this for?"
            placeholderTextColor={Colors.textMuted}
            value={reference}
            onChangeText={setReference}
          />
        </View>

        {/* Next button */}
        <TouchableOpacity
          style={[styles.primaryBtn, styles.primaryBtnLarge, parsedAmount <= 0 && styles.primaryBtnDisabled]}
          onPress={() => goToStep('review')}
          disabled={parsedAmount <= 0}
        >
          <Text style={styles.primaryBtnText}>Review Transfer</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.navy} />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // ----- REVIEW -----
  const renderReview = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.stepHeader}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepTitle}>Review & Confirm</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>3/4</Text>
        </View>
      </View>

      <View style={styles.progressBarOuter}>
        <View style={[styles.progressBarFill, { width: '75%' }]} />
      </View>

      {/* Summary card */}
      <View style={styles.reviewCard}>
        <View style={styles.reviewAmountSection}>
          <Text style={styles.reviewAmountLabel}>Amount</Text>
          <Text style={styles.reviewAmount}>
            ${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        <View style={styles.reviewDivider} />

        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>To</Text>
          <Text style={styles.reviewValue}>{selectedPayee?.name || '—'}</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Bank</Text>
          <Text style={styles.reviewValue}>{selectedPayee?.bank || '—'}</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Account</Text>
          <Text style={styles.reviewValue}>{selectedPayee?.accountNo || '—'}</Text>
        </View>

        <View style={styles.reviewDivider} />

        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>From</Text>
          <Text style={styles.reviewValue}>
            {selectedFromAccount
              ? `${selectedFromAccount.type.charAt(0).toUpperCase() + selectedFromAccount.type.slice(1)} ••${selectedFromAccount.account_no.slice(-4)}`
              : '—'}
          </Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Reference</Text>
          <Text style={styles.reviewValue}>{reference || 'Transfer'}</Text>
        </View>
      </View>

      {/* Security note */}
      <View style={styles.securityNote}>
        <Ionicons name="shield-checkmark" size={18} color={Colors.accent} />
        <Text style={styles.securityNoteText}>
          You'll receive a one-time password (OTP) to confirm this transfer.
        </Text>
      </View>

      {/* Confirm button */}
      <TouchableOpacity
        style={[styles.primaryBtn, styles.primaryBtnLarge, loading && styles.primaryBtnDisabled]}
        onPress={handleConfirmTransfer}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={Colors.navy} />
        ) : (
          <>
            <Ionicons name="lock-closed" size={16} color={Colors.navy} />
            <Text style={styles.primaryBtnText}>Confirm & Send OTP</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  // ----- OTP -----
  const renderOtp = () => (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.stepHeader}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.stepTitle}>Enter OTP</Text>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>4/4</Text>
          </View>
        </View>

        <View style={styles.progressBarOuter}>
          <View style={[styles.progressBarFill, { width: '100%' }]} />
        </View>

        {/* OTP section */}
        <View style={styles.otpSection}>
          <View style={styles.otpIconCircle}>
            <Ionicons name="chatbubble-outline" size={32} color={Colors.gold} />
          </View>
          <Text style={styles.otpTitle}>Verification Code</Text>
          <Text style={styles.otpSubtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.otpPhone}>{otpSentTo || '+1-555-***-3456'}</Text>
          </Text>

          {/* OTP input */}
          <TextInput
            style={styles.otpInput}
            placeholder="• • • • • •"
            placeholderTextColor={Colors.textMuted}
            value={otp}
            onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            textAlign="center"
          />

          {/* Timer / Resend */}
          <View style={styles.otpTimerRow}>
            {otpTimer > 0 ? (
              <Text style={styles.otpTimerText}>
                Resend code in <Text style={styles.otpTimerHighlight}>{otpTimer}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={() => {
                setOtpTimer(60);
                // Re-initiate transfer to get new OTP
                handleConfirmTransfer();
              }}>
                <Text style={styles.otpResendBtn}>Resend Code</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            styles.primaryBtnLarge,
            (otp.length !== 6 || otpProcessing) && styles.primaryBtnDisabled,
          ]}
          onPress={handleOtpSubmit}
          disabled={otp.length !== 6 || otpProcessing}
          activeOpacity={0.8}
        >
          {otpProcessing ? (
            <ActivityIndicator color={Colors.navy} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={18} color={Colors.navy} />
              <Text style={styles.primaryBtnText}>Verify & Transfer</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // ----- SUCCESS -----
  const renderSuccess = () => (
    <View style={styles.successContainer}>
      {/* Animated checkmark */}
      <Animated.View style={[styles.successCheckCircle, { transform: [{ scale: checkmarkScale }] }]}>
        <Ionicons name="checkmark" size={48} color={Colors.navy} />
      </Animated.View>

      <Text style={styles.successTitle}>Transfer Complete!</Text>
      <Text style={styles.successAmount}>
        ${successAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </Text>
      <Text style={styles.successTo}>
        sent to <Text style={styles.successToName}>{selectedPayee?.name}</Text>
      </Text>

      {/* Reference card */}
      <View style={styles.successRefCard}>
        <Text style={styles.successRefLabel}>Reference Number</Text>
        <Text style={styles.successRefValue}>{referenceNo}</Text>
      </View>

      {/* Save payee option */}
      <TouchableOpacity style={styles.savePayeeBtn} activeOpacity={0.7}>
        <Ionicons name="bookmark-outline" size={18} color={Colors.gold} />
        <Text style={styles.savePayeeText}>Save as Payee</Text>
      </TouchableOpacity>

      {/* CTAs */}
      <View style={styles.successActions}>
        <TouchableOpacity
          style={[styles.primaryBtn, styles.primaryBtnLarge]}
          onPress={resetFlow}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={18} color={Colors.navy} />
          <Text style={styles.primaryBtnText}>Done</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => {
            resetFlow();
            goToStep('recipient');
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="repeat" size={16} color={Colors.gold} />
          <Text style={styles.secondaryBtnText}>New Transfer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // =========================================================================
  // MAIN RENDER
  // =========================================================================
  const renderStep = () => {
    switch (step) {
      case 'home': return renderHome();
      case 'recipient': return renderRecipient();
      case 'amount': return renderAmount();
      case 'review': return renderReview();
      case 'otp': return renderOtp();
      case 'success': return renderSuccess();
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {renderStep()}
    </Animated.View>
  );
}

// ===========================================================================
// STYLES
// ===========================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // --- Hero ---
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
  },
  heroIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },

  // --- New Transfer CTA ---
  newTransferCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.gold,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
    ...Shadows.sm,
  },
  ctaIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  ctaInfo: { flex: 1 },
  ctaTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  ctaSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // --- Section ---
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

  // --- Payee rows ---
  payeesList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  payeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.cardBorder,
  },
  payeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  payeeAvatarText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.gold,
  },
  payeeInfo: { flex: 1 },
  payeeName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  payeeBank: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // --- Step header ---
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  stepTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  stepBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  stepBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.gold,
  },

  // --- Progress bar ---
  progressBarOuter: {
    height: 3,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: Spacing.lg,
    borderRadius: 2,
    marginBottom: Spacing.xxl,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },

  // --- Search ---
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    height: 44,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },

  // --- New payee ---
  newPayeeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  newPayeeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(201, 168, 76, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newPayeeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gold,
  },
  newPayeeForm: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  formInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },

  // --- Amount ---
  miniPayeeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  miniPayeeLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  miniPayeeName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  miniPayeeBank: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  currencySign: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    marginRight: Spacing.sm,
  },
  amountInput: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    minWidth: 100,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  quickAmountBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  quickAmountBtnActive: {
    backgroundColor: 'rgba(201, 168, 76, 0.12)',
    borderColor: Colors.gold,
  },
  quickAmountText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  quickAmountTextActive: {
    color: Colors.gold,
  },
  fromAccountSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  fromLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  accountOptionActive: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(201, 168, 76, 0.06)',
  },
  accountOptionInfo: { flex: 1 },
  accountOptionType: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  accountOptionNo: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  accountOptionBalance: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  referenceSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
  },

  // --- Buttons ---
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
  },
  primaryBtnLarge: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    marginHorizontal: Spacing.lg,
  },
  secondaryBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gold,
  },

  // --- Review ---
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
    overflow: 'hidden',
  },
  reviewAmountSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    backgroundColor: 'rgba(201, 168, 76, 0.06)',
  },
  reviewAmountLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  reviewAmount: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.gold,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.cardBorder,
  },
  reviewLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  reviewValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'right',
    maxWidth: '60%',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(0, 212, 170, 0.08)',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  securityNoteText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.accent,
    lineHeight: 18,
  },

  // --- OTP ---
  otpSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
  },
  otpIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  otpTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  otpSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xxl,
  },
  otpPhone: {
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  otpInput: {
    width: 220,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    paddingVertical: Spacing.lg,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: 12,
  },
  otpTimerRow: {
    marginTop: Spacing.xxl,
  },
  otpTimerText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  otpTimerHighlight: {
    fontWeight: FontWeight.bold,
    color: Colors.gold,
  },
  otpResendBtn: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.gold,
  },

  // --- Success ---
  successContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  successCheckCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  successTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  successAmount: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.success,
    marginBottom: Spacing.xs,
  },
  successTo: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  successToName: {
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  successRefCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.xxl,
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  successRefLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  successRefValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.gold,
    letterSpacing: 1,
  },
  savePayeeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xxxl,
  },
  savePayeeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gold,
  },
  successActions: {
    width: '100%',
    gap: Spacing.md,
  },

  // --- Empty ---
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
