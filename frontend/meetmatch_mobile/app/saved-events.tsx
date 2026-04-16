import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LIGHT_PINK } from './styles';

import { PURPLE_500, styles } from './styles';
import { LIGHT_PURPLE_GRADIENT_START, LIGHT_PURPLE_GRADIENT_END, BLUSH_PINK } from './styles';

type SavedEvent = {
  id: number;
  name: string;
  date_time: string;
  category_names: string[];
};

const getEventEmoji = (categories: string[]) => {
  if (categories.includes('Music')) return '🎵';
  if (categories.includes('Coffee')) return '☕️';
  if (categories.includes('Food')) return '🍽️';
  if (categories.includes('Fitness')) return '💪';
  if (categories.includes('Art')) return '🎨';
  return '📍';
};

export default function SavedEventsScreen() {
  const router = useRouter();
  const { items } = useLocalSearchParams<{ items?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'latest' | 'upcoming' | 'attended'>('latest');

  const savedEvents = useMemo(() => {
    if (typeof items !== 'string') {
      return [] as SavedEvent[];
    }

    try {
      return JSON.parse(items) as SavedEvent[];
    } catch {
      return [] as SavedEvent[];
    }
  }, [items]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    let eventsToSort = [...savedEvents];

    if (sortMode === 'latest') {
      eventsToSort.reverse();
    } else if (sortMode === 'upcoming') {
      eventsToSort = eventsToSort
        .filter((event) => new Date(event.date_time).getTime() >= todayStart)
        .sort((left, right) => new Date(left.date_time).getTime() - new Date(right.date_time).getTime());
    } else {
      eventsToSort = eventsToSort
        .filter((event) => new Date(event.date_time).getTime() < todayStart)
        .sort((left, right) => new Date(right.date_time).getTime() - new Date(left.date_time).getTime());
    }

    if (!normalizedQuery) {
      return eventsToSort;
    }

    return eventsToSort.filter((event) => {
      const searchableText = `${event.name} ${event.category_names.join(' ')}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [savedEvents, searchQuery, sortMode]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[LIGHT_PURPLE_GRADIENT_START, LIGHT_PURPLE_GRADIENT_END, BLUSH_PINK]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.screenGradient}>
        <ScrollView contentContainerStyle={styles.containerTransparent}>
          <View style={styles.authShell}>
          <View style={styles.card}>
            <Text style={styles.title}>Saved Events</Text>
            <Text style={styles.subtitle}>Search and slide between your latest saved, upcoming, or attended events.</Text>

            <TextInput
              style={styles.historySearchInput}
              placeholder="Search by event or category"
              placeholderTextColor={LIGHT_PINK}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <View style={styles.historyToggleRow}>
              <Pressable
                style={[styles.historyToggleButton, sortMode === 'latest' && styles.historyToggleButtonActive]}
                onPress={() => setSortMode('latest')}>
                <Text
                  style={[styles.historyToggleText, sortMode === 'latest' && styles.historyToggleTextActive]}>
                  Latest
                </Text>
              </Pressable>
              <Pressable
                style={[styles.historyToggleButton, sortMode === 'upcoming' && styles.historyToggleButtonActive]}
                onPress={() => setSortMode('upcoming')}>
                <Text
                  style={[styles.historyToggleText, sortMode === 'upcoming' && styles.historyToggleTextActive]}>
                  Upcoming
                </Text>
              </Pressable>
              <Pressable
                style={[styles.historyToggleButton, sortMode === 'attended' && styles.historyToggleButtonActive]}
                onPress={() => setSortMode('attended')}>
                <Text
                  style={[styles.historyToggleText, sortMode === 'attended' && styles.historyToggleTextActive]}>
                  Gone to
                </Text>
              </Pressable>
            </View>

            {filteredEvents.length > 0 ? (
              <View style={styles.profileHistoryList}>
                {filteredEvents.map((event) => (
                  <View key={event.id} style={styles.profileHistoryCard}>
                    <View style={styles.profileHistoryEventIcon}>
                      <Text style={styles.profileHistoryEventIconText}>{getEventEmoji(event.category_names)}</Text>
                    </View>
                    <View style={styles.profileHistoryCardBody}>
                      <Text style={styles.profileHistoryCardTitle}>{event.name}</Text>
                      <Text style={styles.profileHistoryCardMeta}>
                        {new Date(event.date_time).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.profileHistoryEmpty}>
                {savedEvents.length === 0
                  ? 'No saved events yet.'
                  : sortMode === 'upcoming'
                    ? 'No upcoming events match this search.'
                    : sortMode === 'attended'
                      ? 'No past events match this search.'
                      : 'No saved events match your search.'}
              </Text>
            )}

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              onPress={() => router.back()}>
              <Text style={styles.primaryButtonText}>Back to Profile</Text>
            </Pressable>
          </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
