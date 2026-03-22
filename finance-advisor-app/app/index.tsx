import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { getAdvice, StructuredReport, loadBaseUrl } from '../services/api';
import HealthGauge from '../components/HealthGauge';
import ReportCard from '../components/ReportCard';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  report?: StructuredReport;
  timestamp: Date;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadBaseUrl();
  }, []);

  useEffect(() => {
    if (loading) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: input.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const report = await getAdvice(userMsg.text);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: report.agent_commentary || 'Here is your financial advisory report:',
        report,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);

      // Save to history
      const history = JSON.parse(await AsyncStorage.getItem('advisory_history') || '[]');
      history.unshift({
        id: aiMsg.id,
        query: userMsg.text,
        report,
        timestamp: new Date().toISOString(),
      });
      await AsyncStorage.setItem('advisory_history', JSON.stringify(history.slice(0, 20)));
    } catch (error: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: `❌ Error: ${error.message}\n\nMake sure the backend is running:\nuvicorn api:app --host 0.0.0.0 --port 8000`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.heroEmoji}>💰</Text>
          <Text style={styles.heroTitle}>AI Financial Advisor</Text>
          <Text style={styles.heroSubtitle}>
            Describe your financial situation and goals{'\n'}to get a personalized advisory report.
          </Text>
          <View style={styles.suggestions}>
            {[
              "I'm 28, earn 60k, credit 680, want to buy a house",
              "I'm 42, income 120k, planning for retirement",
              "Self-employed, variable income, need emergency fund",
            ].map((s, i) => (
              <TouchableOpacity
                key={i}
                style={styles.suggestionChip}
                onPress={() => setInput(s)}
              >
                <Ionicons name="sparkles" size={14} color={Colors.primary} />
                <Text style={styles.suggestionText} numberOfLines={1}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.type === 'user' ? styles.userBubble : styles.aiBubble,
              ]}
            >
              {msg.type === 'ai' && (
                <View style={styles.aiHeader}>
                  <Ionicons name="sparkles" size={14} color={Colors.accent} />
                  <Text style={styles.aiLabel}>AI Advisor</Text>
                </View>
              )}
              <Text style={[
                styles.messageText,
                msg.type === 'user' ? styles.userText : styles.aiText,
              ]}>
                {msg.text}
              </Text>
              {msg.report && (
                <View style={styles.reportContainer}>
                  <HealthGauge score={msg.report.health_score} />
                  <ReportCard report={msg.report} />
                </View>
              )}
            </View>
          ))}
          {loading && (
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <Animated.View style={{ opacity: pulseAnim, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color={Colors.accent} size="small" />
                <Text style={styles.loadingText}>Analyzing your finances...</Text>
              </Animated.View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Describe your financial goals..."
          placeholderTextColor={Colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          onSubmitEditing={sendMessage}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  emptyState: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl,
  },
  heroEmoji: { fontSize: 64, marginBottom: Spacing.md },
  heroTitle: {
    fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center',
    lineHeight: 22, marginBottom: Spacing.xl,
  },
  suggestions: { width: '100%', gap: Spacing.sm },
  suggestionChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  suggestionText: { flex: 1, color: Colors.textSecondary, fontSize: FontSize.sm },
  messageList: { flex: 1 },
  messageContent: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xl },
  messageBubble: {
    maxWidth: '92%', padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  aiHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: Spacing.sm,
  },
  aiLabel: { fontSize: FontSize.xs, color: Colors.accent, fontWeight: '700' },
  messageText: { fontSize: FontSize.md, lineHeight: 22 },
  userText: { color: '#fff' },
  aiText: { color: Colors.textPrimary },
  reportContainer: { marginTop: Spacing.md, gap: Spacing.md },
  loadingText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.cardBorder,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1, backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    color: Colors.textPrimary, fontSize: FontSize.md,
    maxHeight: 100, minHeight: 44,
  },
  sendButton: {
    width: 44, height: 44, borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary, justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },
});
