import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ChatThreadSummary = {
  id: string;
  title: string;
  lastMessage: string;
};

type Props = {
  threads: ChatThreadSummary[];
  onOpenThread: (threadId: string) => void;
};

export default function ChatThreadList({ threads, onOpenThread }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat</Text>
      <Text style={styles.subtitle}>Start conversations with your matches.</Text>

      <View style={styles.list}>
        {threads.map((t) => (
          <Pressable
            key={t.id}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            onPress={() => onOpenThread(t.id)}
          >
            <Text style={styles.itemTitle}>{t.title}</Text>
            <Text style={styles.itemText} numberOfLines={1}>
              {t.lastMessage}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const PURPLE_100 = '#f3e8ff';
const PURPLE_200 = '#ddd6fe';
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
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: PURPLE_700,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#5b5670',
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  item: {
    backgroundColor: PURPLE_100,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PURPLE_200,
  },
  pressed: {
    opacity: 0.75,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PURPLE_700,
    marginBottom: 4,
  },
  itemText: {
    fontSize: 14,
    color: '#4b5563',
  },
});