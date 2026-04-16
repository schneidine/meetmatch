import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles, LIGHT_PURPLE_GRADIENT_START, LIGHT_PURPLE_GRADIENT_END, BLUSH_PINK, LIGHT_PINK } from './styles';

type MatchedPerson = {
  id: string;
  name: string;
  location: string;
  image: string;
};

export default function MatchedPeopleScreen() {
  const router = useRouter();
  const { items } = useLocalSearchParams<{ items?: string }>();
  const [searchQuery, setSearchQuery] = useState('');

  const matchedPeople = useMemo(() => {
    if (typeof items !== 'string') {
      return [] as MatchedPerson[];
    }

    try {
      return JSON.parse(items) as MatchedPerson[];
    } catch {
      return [] as MatchedPerson[];
    }
  }, [items]);

  const filteredPeople = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return matchedPeople;
    }

    return matchedPeople.filter((person) => {
      const searchableText = `${person.name} ${person.location}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [matchedPeople, searchQuery]);

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
            <Text style={styles.title}>Matched People</Text>
            <Text style={styles.subtitle}>Search everyone you’ve matched with.</Text>

            <TextInput
              style={styles.historySearchInput}
              placeholder="Search by name or location"
              placeholderTextColor={LIGHT_PINK}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {filteredPeople.length > 0 ? (
              <View style={styles.profileHistoryList}>
                {filteredPeople.map((person, idx) => (
                  <>
                    <View key={person.id} style={styles.profileHistoryCard}>
                      <Image source={{ uri: person.image }} style={styles.profileHistoryAvatar} contentFit="cover" />
                      <View style={styles.profileHistoryCardBody}>
                        <Text style={styles.profileHistoryCardTitle}>{person.name}</Text>
                        <Text style={styles.profileHistoryCardMeta}>{person.location}</Text>
                      </View>
                    </View>
                    {idx < filteredPeople.length - 1 && (
                      <View style={styles.profileHistorySeparator} key={`sep-${person.id}`} />
                    )}
                  </>
                ))}
              </View>
            ) : (
              <Text style={styles.profileHistoryEmpty}>
                {matchedPeople.length > 0 ? 'No matched people match your search.' : 'No matched people yet.'}
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
