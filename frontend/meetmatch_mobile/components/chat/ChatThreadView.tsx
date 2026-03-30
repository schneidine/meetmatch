import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export type ChatMessage = {
  id: string;
  sender: 'You' | 'Them';
  text: string;
  ts: number;
};

type Props = {
  threadTitle: string;
  messages: ChatMessage[];
  onBack: () => void;
  onSend: (text: string) => void;
};

export default function ChatThreadView({ threadTitle, messages, onBack, onSend }: Props) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView | null>(null);

  const sorted = useMemo(() => [...messages].sort((a, b) => a.ts - b.ts), [messages]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={onBack} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {threadTitle}
        </Text>
      </View>

      <ScrollView
        ref={(r) => {
          scrollRef.current = r;
        }}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {sorted.map((m) => {
          const isYou = m.sender === 'You';
          return (
            <View key={m.id} style={[styles.bubbleRow, isYou ? styles.right : styles.left]}>
              <View style={[styles.bubble, isYou ? styles.bubbleYou : styles.bubbleThem]}>
                <Text style={styles.bubbleSender}>{m.sender}</Text>
                <Text style={styles.bubbleText}>{m.text}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Type a message…"
          placeholderTextColor="#9ca3af"
          style={styles.input}
        />
        <Pressable
          onPress={() => {
            const trimmed = draft.trim();
            if (!trimmed) return;
            onSend(trimmed);
            setDraft('');
          }}
          style={({ pressed }) => [styles.sendBtn, pressed && styles.pressed]}
        >
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const PURPLE_100 = '#f3e8ff';
const PURPLE_500 = '#a855f7';
const PURPLE_700 = '#7e22ce';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    minHeight: 420,
    borderWidth: 1,
    borderColor: PURPLE_100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: PURPLE_100,
  },
  backText: {
    color: PURPLE_700,
    fontWeight: '700',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: PURPLE_700,
  },
  messages: {
    flexGrow: 0,
    maxHeight: 280,
    marginBottom: 12,
  },
  messagesContent: {
    gap: 10,
    paddingBottom: 8,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '80%',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  bubbleYou: {
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
  },
  bubbleThem: {
    backgroundColor: '#ffffff',
    borderColor: PURPLE_100,
  },
  bubbleSender: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 4,
  },
  bubbleText: {
    color: '#111827',
    fontSize: 14,
  },
  composer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: PURPLE_100,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  sendBtn: {
    backgroundColor: PURPLE_500,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sendText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
  },
});