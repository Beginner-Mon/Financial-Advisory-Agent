/**
 * ExecutionScreen — Multi-step agent execution wizard.
 * States: working (spinner), paused (input required), done (summary).
 * Calls POST /execute/start on mount, auto-advances "done" steps.
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import {
  startExecution, resumeExecution, cancelExecution,
  ExecutionStepResult,
} from '../../services/api';
import { useSessionStore } from '../../store/session';
import PausePrompt from './PausePrompt';
import SummaryCard from './SummaryCard';

interface Props {
  productId: string;
  productType: string;
  productName: string;
  sessionId?: string;
  onCancel: () => void;
  onComplete: () => void;
  onViewProducts: () => void;
}

type Phase = 'working' | 'paused' | 'done' | 'error';

export default function ExecutionScreen({
  productId, productType, productName, sessionId: initialSessionId,
  onCancel, onComplete, onViewProducts,
}: Props) {
  const userId = useSessionStore((s) => s.userId);
  const storeStartExecution = useSessionStore((s) => s.startExecution);
  const updateExecution = useSessionStore((s) => s.updateExecution);
  const clearExecution = useSessionStore((s) => s.clearExecution);

  const [phase, setPhase] = useState<Phase>('working');
  const [stepResult, setStepResult] = useState<ExecutionStepResult | null>(null);
  const [sessionId, setSessionId] = useState(initialSessionId || '');
  const [error, setError] = useState('');

  // Step progress animation
  const progressAnim = useRef(new Animated.Value(0)).current;

  const animateProgress = (stepIndex: number, totalSteps: number) => {
    Animated.timing(progressAnim, {
      toValue: (stepIndex + 1) / totalSteps,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const processResult = useCallback((result: ExecutionStepResult) => {
    setStepResult(result);
    animateProgress(result.step_index, result.total_steps);

    // Save to store
    updateExecution({
      stepIndex: result.step_index,
      totalSteps: result.total_steps,
      agentLog: result.agent_log || [],
    });

    if (result.complete) {
      setPhase('done');
      clearExecution();
      return;
    }

    if (result.status === 'paused') {
      setPhase('paused');
      return;
    }

    // Auto-advance "done" steps after 500ms
    if (result.status === 'done') {
      setPhase('working');
      setTimeout(async () => {
        try {
          const next = await resumeExecution({
            session_id: result.session_id || sessionId,
            input_type: '',
            value: null,
          });
          processResult(next);
        } catch (e: any) {
          setError(e.message || 'Failed to advance step');
          setPhase('error');
        }
      }, 500);
    }
  }, [sessionId, updateExecution, clearExecution]);

  // Start execution on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await startExecution({
          product_id: productId,
          product_type: productType,
          user_id: userId,
          session_id: initialSessionId || undefined,
        });
        if (cancelled) return;

        const sid = result.session_id || initialSessionId || '';
        setSessionId(sid);

        // Save to store
        storeStartExecution({
          sessionId: sid,
          productId,
          productType,
          productName,
          stepIndex: 0,
          totalSteps: result.total_steps,
          filledData: {},
          agentLog: result.agent_log || [],
        });

        processResult(result);
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || 'Failed to start execution');
          setPhase('error');
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handlePauseSubmit = async (value: string) => {
    setPhase('working');
    try {
      const result = await resumeExecution({
        session_id: sessionId,
        input_type: stepResult?.input_type || '',
        value,
      });
      processResult(result);
    } catch (e: any) {
      setError(e.message || 'Failed to submit');
      setPhase('error');
    }
  };

  const handleCancel = async () => {
    try {
      if (sessionId) {
        await cancelExecution(sessionId);
      }
    } catch {}
    // Keep inProgressProduct in store for resume banner
    onCancel();
  };

  // Done / Summary
  if (phase === 'done' && stepResult) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <SummaryCard
          productName={productName}
          referenceNo={stepResult.reference_no || 'N/A'}
          agentLog={stepResult.agent_log || []}
          onViewProducts={onViewProducts}
          onBackToDiscover={onComplete}
        />
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{productName}</Text>
          {stepResult && (
            <Text style={styles.headerStep}>
              Step {(stepResult.step_index || 0) + 1} of {stepResult.total_steps || '?'}
            </Text>
          )}
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Content */}
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* Error */}
        {phase === 'error' && (
          <View style={styles.errorCard}>
            <Ionicons name="warning" size={32} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={onCancel}>
              <Text style={styles.retryBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Working */}
        {phase === 'working' && (
          <View style={styles.workingContainer}>
            <View style={styles.spinnerRow}>
              <View style={styles.dot1} />
              <View style={styles.dot2} />
              <View style={styles.dot3} />
            </View>
            <Text style={styles.workingTitle}>Agent is working...</Text>
            <Text style={styles.workingSubtitle}>
              {stepResult?.step?.replace(/_/g, ' ') || 'Processing your application'}
            </Text>
            {stepResult?.agent_log_entry && (
              <View style={styles.logPreview}>
                <Ionicons name="sparkles" size={14} color={Colors.gold} />
                <Text style={styles.logPreviewText}>{stepResult.agent_log_entry}</Text>
              </View>
            )}
          </View>
        )}

        {/* Paused */}
        {phase === 'paused' && stepResult && (
          <PausePrompt
            inputType={stepResult.input_type || 'clarification'}
            prompt={stepResult.prompt}
            options={stepResult.options}
            onSubmit={handlePauseSubmit}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.cardBorder,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  headerStep: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  progressTrack: { height: 3, backgroundColor: Colors.surfaceLight },
  progressFill: { height: 3, backgroundColor: Colors.gold },
  body: { flex: 1 },
  bodyContent: { flexGrow: 1, justifyContent: 'center' },
  // Working state
  workingContainer: { alignItems: 'center', padding: Spacing.xxxl },
  spinnerRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.xxl },
  dot1: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.gold, opacity: 0.3 },
  dot2: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.gold, opacity: 0.6 },
  dot3: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.gold, opacity: 1 },
  workingTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  workingSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textTransform: 'capitalize', marginBottom: Spacing.xxl },
  logPreview: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, maxWidth: '90%',
  },
  logPreviewText: { fontSize: FontSize.sm, color: Colors.textMuted, flex: 1 },
  // Error
  errorCard: { alignItems: 'center', padding: Spacing.xxxl, gap: Spacing.lg },
  errorText: { fontSize: FontSize.md, color: Colors.error, textAlign: 'center' },
  retryBtn: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.cardBorder,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxxl,
  },
  retryBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
});
