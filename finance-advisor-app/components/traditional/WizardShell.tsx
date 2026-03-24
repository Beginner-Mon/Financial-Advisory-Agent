/**
 * WizardShell — Step-by-step wizard for traditional product applications.
 * Simplified: no confirm-each-field mechanic. User fills fields → Next → Submit.
 * Shows inline validation errors when fields are empty/invalid.
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
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const setValue = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear errors when user starts typing
    if (showErrors) setShowErrors(false);
  };

  // ── Validation ──
  const getFieldValue = (field: WizardField) => {
    return formData[field.key] ?? field.prefilled ?? '';
  };

  const isFieldValid = (field: WizardField) => {
    if (!field.required) return true;
    const val = getFieldValue(field);
    if (field.type === 'toggle') return val === true;
    if (field.type === 'otp') return (val || '').length === 6;
    if (field.type === 'date') {
      // Must be YYYY-MM-DD format
      return /^\d{4}-\d{2}-\d{2}$/.test(String(val));
    }
    return !!val && String(val).trim().length > 0;
  };

  const getFieldError = (field: WizardField): string | null => {
    if (!showErrors || !field.required) return null;
    const val = getFieldValue(field);
    if (field.type === 'toggle' && val !== true) return 'You must agree to continue';
    if (field.type === 'otp' && (val || '').length < 6) return 'Enter the 6-digit OTP';
    if (field.type === 'date') {
      if (!val) return `${field.label} is required`;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(val))) return 'Use format YYYY-MM-DD';
      return null;
    }
    if (!val || String(val).trim().length === 0) return `${field.label} is required`;
    return null;
  };

  const allFieldsValid = steps
    .flatMap((s) => s.fields)
    .filter((f) => f.required)
    .every(isFieldValid);

  const handleBack = () => {
    setShowErrors(false);
    if (Platform.OS === 'web') {
      if (confirm('Cancel application? Your progress will be lost.')) {
        onCancel();
      }
    } else {
      Alert.alert('Cancel application?', 'Your progress will be lost.', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: onCancel },
      ]);
    }
  };

  const handleSubmit = async () => {
    if (!allFieldsValid) {
      setShowErrors(true);
      return;
    }
    setSubmitting(true);
    try {
      // Make sure prefilled values are included in formData
      const finalData = { ...formData };
      steps.forEach((s) =>
        s.fields.forEach((f) => {
          if (f.prefilled && !(f.key in finalData)) {
            finalData[f.key] = f.prefilled;
          }
        })
      );
      await onSubmit(finalData);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: WizardField) => {
    const value = getFieldValue(field);
    const error = getFieldError(field);

    if (field.type === 'toggle') {
      return (
        <View key={field.key} style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          <Switch
            value={!!value}
            onValueChange={(v) => setValue(field.key, v)}
            trackColor={{ false: Colors.cardBorder, true: Colors.accent }}
            thumbColor={Colors.white}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      );
    }

    if (field.type === 'otp') {
      return (
        <View key={field.key} style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          <TextInput
            style={[styles.otpInput, error ? styles.inputError : null]}
            placeholder="• • • • • •"
            placeholderTextColor={Colors.textMuted}
            value={formData[field.key] || ''}
            onChangeText={(text) => {
              const digits = text.replace(/\D/g, '').slice(0, 6);
              setValue(field.key, digits);
            }}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
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
                style={[
                  styles.optionPill,
                  value === opt && styles.optionPillActive,
                  error && !value ? styles.optionPillError : null,
                ]}
                onPress={() => setValue(field.key, opt)}
              >
                <Text style={[styles.optionText, value === opt && styles.optionTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      );
    }

    if (field.type === 'date') {
      return (
        <View key={field.key} style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          <TextInput
            style={[styles.textInput, error ? styles.inputError : null]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.textMuted}
            value={formData[field.key] || field.prefilled || ''}
            onChangeText={(text) => {
              // Auto-format: add dashes after year and month
              let digits = text.replace(/[^\d-]/g, '');
              if (digits.length === 4 && !digits.includes('-')) digits += '-';
              if (digits.length === 7 && digits.split('-').length === 2) digits += '-';
              if (digits.length > 10) digits = digits.slice(0, 10);
              setValue(field.key, digits);
            }}
            keyboardType="number-pad"
            maxLength={10}
          />
          <Text style={styles.dateHint}>Format: YYYY-MM-DD</Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      );
    }

    // text / number
    return (
      <View key={field.key} style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{field.label}</Text>
        <TextInput
          style={[styles.textInput, error ? styles.inputError : null]}
          placeholder={`Enter ${field.label.toLowerCase()}`}
          placeholderTextColor={Colors.textMuted}
          value={String(value)}
          onChangeText={(text) => setValue(field.key, text)}
          keyboardType={field.type === 'number' ? 'numeric' : 'default'}
          editable={field.editable}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
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
        <Text style={styles.headerTitle} numberOfLines={1}>{productName}</Text>
      </View>

      {/* Fields */}
      <ScrollView style={styles.fieldsScroll} showsVerticalScrollIndicator={false}>
        {steps.map((stepGrp, index) => (
          <View key={index} style={styles.fieldset}>
            <Text style={styles.stepTitle}>{stepGrp.title}</Text>
            {stepGrp.fields.map(renderField)}
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.navy} />
          ) : (
            <Text style={styles.primaryBtnText}>Submit application</Text>
          )}
        </TouchableOpacity>
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
  headerTitle: { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  fieldset: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder,
    padding: Spacing.lg, marginBottom: Spacing.xl,
  },
  stepTitle: {
    fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.cardBorder,
    paddingBottom: Spacing.md, marginBottom: Spacing.lg,
  },
  fieldsScroll: { flex: 1, paddingHorizontal: Spacing.lg },

  // Fields
  fieldContainer: { marginBottom: Spacing.xxl },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm },
  fieldRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
    paddingVertical: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.cardBorder,
  },
  textInput: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.cardBorder,
    padding: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary,
  },
  inputError: { borderColor: Colors.error },
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
  optionPillError: { borderColor: Colors.error },
  optionText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  optionTextActive: { color: Colors.white, fontWeight: FontWeight.bold },
  errorText: { fontSize: FontSize.xs, color: Colors.error, marginTop: 4 },
  dateHint: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },

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
