/**
 * WizardShell — Shared step-by-step wizard wrapper for traditional product applications.
 * Fields are pre-filled from profile, user confirms each field with ✓ before proceeding.
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Switch, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';

// ── Exported types ──
export interface WizardField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'toggle' | 'otp';
  prefilled: string | null;
  required: boolean;
  editable: boolean;
  options?: string[];
}

export interface WizardStep {
  title: string;
  fields: WizardField[];
}

interface Props {
  productName: string;
  steps: WizardStep[];
  onSubmit: (formData: Record<string, any>) => Promise<void>;
  onCancel: () => void;
}

export default function WizardShell({ productName, steps, onSubmit, onCancel }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Record<string, string>>({});

  const step = steps[currentStep];
  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const setValue = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setConfirmed((prev) => ({ ...prev, [key]: false }));
  };

  const confirmField = (key: string) => {
    setConfirmed((prev) => ({ ...prev, [key]: true }));
  };

  const allFieldsConfirmed = step.fields
    .filter((f) => f.required)
    .every((f) => {
      if (f.type === 'toggle') return formData[f.key] === true;
      if (f.type === 'otp') return (formData[f.key] || '').length === 6;
      return !!formData[f.key] && confirmed[f.key];
    });

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      Alert.alert('Cancel application?', 'Your progress will be lost.', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: onCancel },
      ]);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isLastStep = currentStep === totalSteps - 1;

  const renderField = (field: WizardField) => {
    const value = formData[field.key];
    const isConfirmed = confirmed[field.key];

    if (field.type === 'toggle') {
      return (
        <View key={field.key} style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          <Switch
            value={!!value}
            onValueChange={(v) => {
              setValue(field.key, v);
              if (v) confirmField(field.key);
            }}
            trackColor={{ false: Colors.cardBorder, true: Colors.accent }}
            thumbColor={Colors.white}
          />
        </View>
      );
    }

    if (field.type === 'otp') {
      return (
        <View key={field.key} style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          <TextInput
            style={[styles.otpInput]}
            placeholder="• • • • • •"
            placeholderTextColor={Colors.textMuted}
            value={value || ''}
            onChangeText={(text) => {
              const digits = text.replace(/\D/g, '').slice(0, 6);
              setValue(field.key, digits);
              if (digits.length === 6) confirmField(field.key);
            }}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
          />
        </View>
      );
    }

    if (field.type === 'select') {
      return (
        <View key={field.key} style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          <View style={styles.optionsRow}>
            {field.options?.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.optionPill, value === opt && styles.optionPillActive]}
                onPress={() => {
                  setValue(field.key, opt);
                  confirmField(field.key);
                }}
              >
                <Text style={[styles.optionText, value === opt && styles.optionTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    // text / number / date
    return (
      <View key={field.key} style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{field.label}</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.textInput, isConfirmed && styles.textInputConfirmed]}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            placeholderTextColor={Colors.textMuted}
            value={value || field.prefilled || ''}
            onChangeText={(text) => setValue(field.key, text)}
            keyboardType={field.type === 'number' ? 'numeric' : 'default'}
            editable={field.editable}
          />
          {!isConfirmed && (value || field.prefilled) ? (
            <TouchableOpacity style={styles.confirmBtn} onPress={() => confirmField(field.key)}>
              <Ionicons name="checkmark" size={18} color={Colors.white} />
            </TouchableOpacity>
          ) : isConfirmed ? (
            <View style={styles.confirmedBadge}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Apply manually</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Step {currentStep + 1} of {totalSteps}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressOuter}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Step title */}
      <Text style={styles.stepTitle}>{step.title}</Text>

      {/* Fields */}
      <ScrollView style={styles.fieldsScroll} showsVerticalScrollIndicator={false}>
        {step.fields.map(renderField)}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        {isLastStep ? (
          <TouchableOpacity
            style={[styles.primaryBtn, (!allFieldsConfirmed || submitting) && styles.primaryBtnDisabled]}
            onPress={handleSubmit}
            disabled={!allFieldsConfirmed || submitting}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.navy} />
            ) : (
              <Text style={styles.primaryBtnText}>Submit application</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, !allFieldsConfirmed && styles.primaryBtnDisabled]}
            onPress={handleNext}
            disabled={!allFieldsConfirmed}
          >
            <Text style={styles.primaryBtnText}>Next step →</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.cardBorder,
  },
  backBtn: { marginRight: Spacing.md },
  headerTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  stepBadge: {
    backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
  },
  stepBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textMuted },
  progressOuter: {
    height: 4, backgroundColor: Colors.cardBorder, marginHorizontal: Spacing.lg, marginTop: Spacing.md,
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.navy, borderRadius: 2 },
  stepTitle: {
    fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.xxl, paddingBottom: Spacing.lg,
  },
  fieldsScroll: { flex: 1, paddingHorizontal: Spacing.lg },

  // Fields
  fieldContainer: { marginBottom: Spacing.xxl },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm },
  fieldRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.cardBorder,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  textInput: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.cardBorder,
    padding: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary,
  },
  textInputConfirmed: { borderColor: Colors.accent, backgroundColor: `${Colors.accent}08` },
  confirmBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.navy,
    justifyContent: 'center', alignItems: 'center',
  },
  confirmedBadge: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  otpInput: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.cardBorder,
    padding: Spacing.lg, fontSize: FontSize.xl, fontWeight: FontWeight.bold,
    color: Colors.textPrimary, letterSpacing: 8,
  },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  optionPill: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  optionPillActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  optionText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  optionTextActive: { color: Colors.white, fontWeight: FontWeight.bold },

  // Bottom
  bottomBar: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.cardBorder,
    backgroundColor: Colors.background,
  },
  primaryBtn: {
    backgroundColor: Colors.gold, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg, alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.navy },
});
