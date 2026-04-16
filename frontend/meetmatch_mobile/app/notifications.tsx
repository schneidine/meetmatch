import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from './styles';

type NotificationMatch = {
  id: string;
  name: string;
};

type NotificationThread = {
  id: string;
  title: string;
  lastMessage: string;
};

type NotificationEvent = {
  id: number;
  name: string;
  date_time: string;
  event_url?: string | null;
  category_names: string[];
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  url?: string | null;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { matches, threads, events } = useLocalSearchParams<{
    matches?: string;
    threads?: string;
    events?: string;
  }>();

  const matchedPeople = useMemo(() => {
    if (typeof matches !== 'string') {
      return [] as NotificationMatch[];
    }

    try {
      return JSON.parse(matches) as NotificationMatch[];
    } catch {
      return [] as NotificationMatch[];
    }
  }, [matches]);

  const chatThreads = useMemo(() => {
    if (typeof threads !== 'string') {
      return [] as NotificationThread[];
    }

    try {
      return JSON.parse(threads) as NotificationThread[];
    } catch {
      return [] as NotificationThread[];
    }
  }, [threads]);

  const savedEvents = useMemo(() => {
    if (typeof events !== 'string') {
      return [] as NotificationEvent[];
    }

    try {
      return JSON.parse(events) as NotificationEvent[];
    } catch {
      return [] as NotificationEvent[];
    }
  }, [events]);

  const notifications = useMemo(() => {
    const nextItems: NotificationItem[] = [];
    const now = Date.now();
    const twoDaysFromNow = now + 2 * 24 * 60 * 60 * 1000;
    const personToPing = matchedPeople[0]?.name ?? 'your match';

    if (matchedPeople.length > 0) {
      nextItems.push({
        id: `match-${matchedPeople[0].id}`,
        title: 'New match ready',
        message: `You matched with ${matchedPeople[0].name}. Send a quick hello and plan something fun.`,
      });
    }

    chatThreads.slice(0, 2).forEach((thread) => {
      nextItems.push({
        id: `thread-${thread.id}`,
        title: `Message from ${thread.title}`,
        message: thread.lastMessage,
      });
    });

    savedEvents
      .filter((event) => {
        const eventTime = new Date(event.date_time).getTime();
        return eventTime >= now && eventTime <= twoDaysFromNow;
      })
      .sort((left, right) => new Date(left.date_time).getTime() - new Date(right.date_time).getTime())
      .forEach((event) => {
        const whenLabel = new Date(event.date_time).toLocaleString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });

        nextItems.push({
          id: `event-${event.id}`,
          title: 'Upcoming event reminder',
          message: `Ping ${personToPing} about ${event.name} — it’s coming up ${whenLabel}.`,
          url: event.event_url,
        });
      });

    return nextItems;
  }, [chatThreads, matchedPeople, savedEvents]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#f4fffe', '#ecfeff', '#ddfbf4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.screenGradient}>
        <ScrollView contentContainerStyle={styles.containerTransparent}>
          <View style={styles.authShell}>
          <View style={styles.card}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>See recent match, message, and event reminders here.</Text>

            {notifications.length > 0 ? (
              <View style={styles.mainList}>
                {notifications.map((item) => (
                  <View key={item.id} style={styles.mainListItem}>
                    <Text style={styles.mainListTitle}>{item.title}</Text>
                    <Text style={styles.mainListText}>{item.message}</Text>
                    {item.url ? (
                      <Pressable onPress={() => Linking.openURL(item.url as string).catch(() => null)}>
                        <Text style={styles.eventFooterLink}>Open event link ↗</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.profileHistoryEmpty}>No new notifications right now.</Text>
            )}

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              onPress={() => router.back()}>
              <Text style={styles.primaryButtonText}>Back</Text>
            </Pressable>
          </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
