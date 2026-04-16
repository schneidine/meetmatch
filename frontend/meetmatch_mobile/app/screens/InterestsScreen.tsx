import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PURPLE_500, styles, LIGHT_PURPLE_GRADIENT_START, LIGHT_PURPLE_GRADIENT_END, BLUSH_PINK, LIGHT_PINK } from '../styles';
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
      <LinearGradient
        colors={[LIGHT_PURPLE_GRADIENT_START, LIGHT_PURPLE_GRADIENT_END, BLUSH_PINK]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.screenGradient}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.authShell}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>👥</Text>
            </View>
            <Text style={styles.appTitle}>meetmatch</Text>
          </View>

          <View style={styles.heroPanelAlt}>
            <Text style={styles.eyebrow}>Profile setup</Text>
            <Text style={styles.heroTitle}>Choose what feels most like you.</Text>
            <Text style={styles.subtitle}>
              Select at least 3 interests, then lock in the top 3 that define your vibe best.
            </Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryPill}>
                <Text style={styles.summaryValue}>{selectedInterestIds.length}</Text>
                <Text style={styles.summaryLabel}>selected</Text>
              </View>
              <View style={styles.summaryPill}>
                <Text style={styles.summaryValue}>{topInterestIds.length}/3</Text>
                <Text style={styles.summaryLabel}>top picks</Text>
              </View>
              <View style={styles.summaryPill}>
                <Text style={styles.summaryValue}>{interests.length}</Text>
                <Text style={styles.summaryLabel}>available</Text>
              </View>
            </View>
          </View>

          <View
            style={[styles.mainCard, { backgroundColor: 'rgba(255,255,255,0.85)' }]}
          >
            {isLoadingInterests ? (
              <ActivityIndicator color={PURPLE_500} />
            ) : (
              <>
                <Text style={styles.sectionHeading}>All interests</Text>
                <Text style={styles.helperText}>Tap as many as you want. We&apos;ll use them to personalize matches and events.</Text>
                <View style={styles.pillContainer}>
                  {interests.map((interest) => {
                    const isSelected = selectedSet.has(interest.id);
                    return (
                      <Pressable
                        key={interest.id}
                        onPress={() => onToggleInterest(interest.id)}
                        style={[styles.pill, isSelected && { backgroundColor: LIGHT_PINK }]}>
                        <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{interest.name}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.sectionHeading}>Top 3</Text>
                <Text style={styles.helperText}>Choose the 3 interests you want people to notice first.</Text>
                <View style={styles.pillContainer}>
                  {interests
                    .filter((interest) => selectedSet.has(interest.id))
                    .map((interest) => {
                      const isTop = topSet.has(interest.id);
                      return (
                        <Pressable
                          key={`top-${interest.id}`}
                          onPress={() => onToggleTopInterest(interest.id)}
                          style={[styles.pill, isTop && { backgroundColor: LIGHT_PINK }]}>
                          <Text style={[styles.pillText, isTop && styles.topPillTextSelected]}>{interest.name}</Text>
                        </Pressable>
                      );
                    })}
                </View>

                <Pressable
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
                  onPress={onSaveInterests}
                  disabled={isSavingInterests}>
                  <Text style={styles.primaryButtonText}>{isSavingInterests ? 'Saving...' : 'Finish setup'}</Text>
                </Pressable>

                {interestsMessage ? <Text style={styles.successText}>{interestsMessage}</Text> : null}
                {interestsError ? <Text style={styles.errorText}>{interestsError}</Text> : null}
              </>
            )}
          </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
