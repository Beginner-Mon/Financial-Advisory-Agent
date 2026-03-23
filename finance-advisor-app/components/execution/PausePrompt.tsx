/**
 * PausePrompt — Renders per-input_type UI during execution pauses.
 * Types: otp, biometric, user_choice, clarification, document_upload
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../../constants/theme';

interface Props {
  inputType: string;
  prompt: string | null;
  options: string[] | null;
  onSubmit: (value: string) => void;
}

export default function PausePrompt({ inputType, prompt, options, onSubmit }: Props) {
  const [value, setValue] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    if (inputType === 'otp' && resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [inputType, resendTimer]);

  const handleSubmit = () => {
    if (inputType === 'user_choice') onSubmit(selected || '');
    else if (inputType === 'biometric') onSubmit('biometric_confirmed');
    else onSubmit(value);
  };

  // OTP input
  if (inputType === 'otp') {
    return (
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="key-outline" size={32} color={Colors.gold} />
        </View>
        <Text style={styles.title}>Verification Required</Text>
        <Text style={styles.subtitle}>{prompt || 'Enter the 6-digit OTP sent to your phone'}</Text>
        <TextInput
          style={styles.otpInput}
          value={value}
          onChangeText={setValue}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor={Colors.textMuted}
        />
        <TouchableOpacity
          style={[styles.submitBtn, value.length !== 6 && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={value.length !== 6}
        >
          <Text style={styles.submitBtnText}>Verify & Continue</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setResendTimer(60)}
          disabled={resendTimer > 0}
          style={styles.resendBtn}
        >
          <Text style={[styles.resendText, resendTimer === 0 && styles.resendTextActive]}>
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Biometric
  if (inputType === 'biometric') {
    return (
      <View style={styles.container}>
        <View style={styles.biometricCircle}>
          <Ionicons name="finger-print" size={48} color={Colors.accent} />
        </View>
        <Text style={styles.title}>Biometric Verification</Text>
        <Text style={styles.subtitle}>{prompt || 'Touch the sensor to continue'}</Text>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Ionicons name="finger-print" size={20} color={Colors.navy} />
          <Text style={styles.submitBtnText}>Simulate Touch</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fallbackBtn} onPress={() => onSubmit('pin_fallback')}>
          <Text style={styles.fallbackText}>Use PIN instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // User choice (radio list)
  if (inputType === 'user_choice' && options) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{prompt || 'Please select an option'}</Text>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.radioRow, selected === opt && styles.radioRowSelected]}
            onPress={() => setSelected(opt)}
          >
            <View style={[styles.radio, selected === opt && styles.radioActive]}>
              {selected === opt && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.radioText}>{opt}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.submitBtn, !selected && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!selected}
        >
          <Text style={styles.submitBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Document upload placeholder
  if (inputType === 'document_upload') {
    return (
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="cloud-upload-outline" size={32} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Document Required</Text>
        <Text style={styles.subtitle}>{prompt || 'Please upload the required document'}</Text>
        <View style={styles.uploadArea}>
          <Ionicons name="document-attach-outline" size={32} color={Colors.textMuted} />
          <Text style={styles.uploadText}>Tap to select file</Text>
        </View>
        <TouchableOpacity style={styles.submitBtn} onPress={() => onSubmit('upload_later')}>
          <Text style={styles.submitBtnText}>Upload Later</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Default / clarification
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{prompt || 'Additional information needed'}</Text>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={setValue}
        placeholder="Type your response..."
        placeholderTextColor={Colors.textMuted}
        multiline
      />
      <TouchableOpacity
        style={[styles.submitBtn, !value.trim() && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={!value.trim()}
      >
        <Text style={styles.submitBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, alignItems: 'center' },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(201,168,76,0.12)', justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  biometricCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(0,212,170,0.12)', justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xxl },
  otpInput: {
    width: 200, height: 56, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.cardBorder,
    textAlign: 'center', fontSize: FontSize.xxl, fontWeight: FontWeight.bold,
    color: Colors.gold, letterSpacing: 12, marginBottom: Spacing.xxl,
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.gold, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxxl,
    gap: Spacing.sm, width: '100%', ...Shadows.gold,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.navy },
  resendBtn: { marginTop: Spacing.lg },
  resendText: { fontSize: FontSize.sm, color: Colors.textMuted },
  resendTextActive: { color: Colors.gold, fontWeight: FontWeight.semibold },
  fallbackBtn: { marginTop: Spacing.lg },
  fallbackText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  radioRow: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.cardBorder,
    padding: Spacing.lg, marginBottom: Spacing.sm,
  },
  radioRowSelected: { borderColor: Colors.gold, backgroundColor: 'rgba(201,168,76,0.06)' },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.textMuted,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  radioActive: { borderColor: Colors.gold },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.gold },
  radioText: { fontSize: FontSize.md, color: Colors.textPrimary, flex: 1 },
  uploadArea: {
    width: '100%', height: 120,
    borderWidth: 2, borderColor: Colors.cardBorder, borderStyle: 'dashed',
    borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center',
    gap: Spacing.sm, marginBottom: Spacing.xxl,
  },
  uploadText: { fontSize: FontSize.sm, color: Colors.textMuted },
  textInput: {
    width: '100%', minHeight: 80, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.cardBorder,
    padding: Spacing.lg, fontSize: FontSize.md, color: Colors.textPrimary,
    textAlignVertical: 'top', marginBottom: Spacing.xxl,
  },
});
