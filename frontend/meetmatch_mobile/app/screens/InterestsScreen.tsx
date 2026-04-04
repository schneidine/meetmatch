import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from '../styles';
import type { Interest } from '../types';

type InterestsScreenProps = {
  interests: Interest[];
  selectedInterestIds: number[];
  topInterestIds: number[];
  selectedSet: Set<number>;
  topSet: Set<number>;
  isLoadingInterests: boolean;
  isSavingInterests: boolean;
  interestsMessage: string;
  interestsError: string;
  onToggleInterest: (interestId: number) => void;
  onToggleTopInterest: (interestId: number) => void;
  onSaveInterests: () => void;
};

export function InterestsScreen({
  interests,
  selectedInterestIds,
  topInterestIds,
  selectedSet,
  topSet,
  isLoadingInterests,
  isSavingInterests,
  interestsMessage,
  interestsError,
  onToggleInterest,
  onToggleTopInterest,
  onSaveInterests,
}: InterestsScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Select Interests</Text>
          <Text style={styles.subtitle}>Choose your interests, then choose your top 3.</Text>

          {isLoadingInterests ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={styles.sectionHeading}>All Interests ({selectedInterestIds.length} selected)</Text>
              <View style={styles.pillContainer}>
                {interests.map((interest) => {
                  const isSelected = selectedSet.has(interest.id);
                  return (
                    <Pressable
                      key={interest.id}
                      onPress={() => onToggleInterest(interest.id)}
                      style={[styles.pill, isSelected && styles.pillSelected]}>
                      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{interest.name}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.sectionHeading}>Top 3 ({topInterestIds.length}/3)</Text>
              <View style={styles.pillContainer}>
                {interests
                  .filter((interest) => selectedSet.has(interest.id))
                  .map((interest) => {
                    const isTop = topSet.has(interest.id);
                    return (
                      <Pressable
                        key={`top-${interest.id}`}
                        onPress={() => onToggleTopInterest(interest.id)}
                        style={[styles.pill, isTop && styles.topPillSelected]}>
                        <Text style={[styles.pillText, isTop && styles.topPillTextSelected]}>{interest.name}</Text>
                      </Pressable>
                    );
                  })}
              </View>

              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
                onPress={onSaveInterests}
                disabled={isSavingInterests}>
                <Text style={styles.primaryButtonText}>{isSavingInterests ? 'Saving...' : 'Save Interests'}</Text>
              </Pressable>

              {interestsMessage ? <Text style={styles.successText}>{interestsMessage}</Text> : null}
              {interestsError ? <Text style={styles.errorText}>{interestsError}</Text> : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
