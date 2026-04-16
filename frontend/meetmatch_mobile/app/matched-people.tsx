import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal } from 'react-native';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';

import { styles, LIGHT_PURPLE_GRADIENT_START, LIGHT_PURPLE_GRADIENT_END, BLUSH_PINK, LIGHT_PINK } from './styles';

type MatchedPerson = {
  id: string;
  name: string;
  location: string;
  image: string;
  interestedEventNames?: string[];
};

export default function MatchedPeopleScreen() {
  // Modal state for event popup
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEvents, setModalEvents] = useState<string[]>([]);

  const handleShowMore = (events: string[]) => {
    setModalEvents(events);
    setModalVisible(true);
  };
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
              filteredPeople.map((person, idx) => {
                console.log('MatchedPerson:', person.name, person.interestedEventNames);
                return (
                <React.Fragment key={person.id}>
                  <View style={styles.profileHistoryCard}>
                    <Image source={{ uri: person.image }} style={styles.profileHistoryAvatar} contentFit="cover" />
                    <View style={styles.profileHistoryCardBody}>
                      <Text style={styles.profileHistoryCardTitle}>{person.name}</Text>
                      <Text style={styles.profileHistoryCardMeta}>{person.location}</Text>
                      {/* Show first event and +N more link */}
                      {person.interestedEventNames && person.interestedEventNames.length > 0 && (
                        <View style={styles.eventRow}>
                          <Text style={styles.eventName}>
                            {person.interestedEventNames[0]}
                          </Text>
                          {person.interestedEventNames.length > 1 && (
                            <Pressable onPress={() => handleShowMore(person.interestedEventNames!.slice(1))}>
                              <Text style={styles.moreLink}>
                                +{person.interestedEventNames.length - 1} more
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                  {idx < filteredPeople.length - 1 && (
                    <View style={styles.profileHistorySeparator} />
                  )}
                </React.Fragment>
                );
              })
            ) : (
              <Text style={styles.profileHistoryEmpty}>
                {matchedPeople.length > 0 ? 'No matched people match your search.' : 'No matched people yet.'}
              </Text>
            )}

      {/* Modal for more events */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, minWidth: 260, maxWidth: 340 }}>
            <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 12, color: '#e75480' }}>Other Events</Text>
            {modalEvents.map((event, idx) => (
              <Text key={idx} style={{ marginBottom: 6, color: '#1f2937' }}>{event}</Text>
            ))}
            <Pressable onPress={() => setModalVisible(false)}>
              <Text style={{ color: '#e75480', marginTop: 16, textAlign: 'right', fontWeight: '700' }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
