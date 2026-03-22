import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { setBaseUrl, checkHealth, loadBaseUrl } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [status, setStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('api_base_url');
      if (stored) setApiUrl(stored);
    })();
  }, []);

  const saveUrl = async () => {
    const url = apiUrl.trim().replace(/\/+$/, '');
    await setBaseUrl(url);
    setApiUrl(url);
    testConnection(url);
  };

  const testConnection = async (url?: string) => {
    setStatus('unknown');
    setStatusMsg('Testing connection...');
    try {
      if (url) await setBaseUrl(url);
      const health = await checkHealth();
      setStatus('connected');
      setStatusMsg(
        `Connected ✓\nDB: ${health.db_connected ? '✓' : '✗'}  Catalog: ${health.catalog_loaded ? '✓' : '✗'}`
      );
    } catch (e: any) {
      setStatus('error');
      setStatusMsg(`Failed: ${e.message}`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Backend URL */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backend Connection</Text>
        <Text style={styles.sectionDesc}>
          Enter the URL of your FastAPI backend server
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="http://localhost:8000"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.saveBtn} onPress={saveUrl}>
            <Ionicons name="save" size={16} color="#fff" />
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.testBtn} onPress={() => testConnection()}>
            <Ionicons name="pulse" size={16} color={Colors.primary} />
            <Text style={styles.testBtnText}>Test</Text>
          </TouchableOpacity>
        </View>

        {statusMsg ? (
          <View style={[
            styles.statusBox,
            status === 'connected' && styles.statusOk,
            status === 'error' && styles.statusErr,
          ]}>
            <Ionicons
              name={status === 'connected' ? 'checkmark-circle' : status === 'error' ? 'close-circle' : 'ellipsis-horizontal'}
              size={18}
              color={status === 'connected' ? Colors.success : status === 'error' ? Colors.error : Colors.textMuted}
            />
            <Text style={styles.statusText}>{statusMsg}</Text>
          </View>
        ) : null}
      </View>

      {/* Quick Setup Guide */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Setup</Text>
        <View style={styles.codeBlock}>
          <Text style={styles.codeText}>
            {`# Start the backend server\ncd finance-advisor\n.venv\\Scripts\\activate\nuvicorn api:app --host 0.0.0.0 --port 8000`}
          </Text>
        </View>
        <Text style={styles.sectionDesc}>
          For Android emulator, use: http://10.0.2.2:8000{'\n'}
          For iOS simulator, use: http://localhost:8000{'\n'}
          For physical device, use your computer's IP address
        </Text>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.sectionDesc}>
          Agentic AI Financial Advisory System{'\n'}
          Powered by Google Gemini + FastAPI{'\n'}
          Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, gap: Spacing.lg },
  section: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  sectionTitle: {
    fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sectionDesc: {
    fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20,
    marginBottom: Spacing.md,
  },
  inputRow: { marginBottom: Spacing.md },
  input: {
    backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    color: Colors.textPrimary, fontSize: FontSize.md,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  buttonRow: { flexDirection: 'row', gap: Spacing.sm },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md,
    paddingVertical: 10, borderRadius: BorderRadius.md,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  testBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  testBtnText: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm },
  statusBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    marginTop: Spacing.md, padding: Spacing.md,
    backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.sm,
  },
  statusOk: { borderLeftWidth: 3, borderLeftColor: Colors.success },
  statusErr: { borderLeftWidth: 3, borderLeftColor: Colors.error },
  statusText: { color: Colors.textSecondary, fontSize: FontSize.sm, flex: 1, lineHeight: 20 },
  codeBlock: {
    backgroundColor: Colors.background, borderRadius: BorderRadius.sm,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: FontSize.xs, color: Colors.accent, lineHeight: 18,
  },
});

import { Platform } from 'react-native';
