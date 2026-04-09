import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PURPLE_500, PURPLE_700, styles } from '../styles';
import {
  MAIN_TABS,
  type ChatThread,
  type ChatView,
  type EventSummary,
  type MainTab,
  type MatchProfile,
  type SwipeAction,
  type UserSummary,
} from '../types';

const SWIPE_THRESHOLD = 110;

const EVENT_CATEGORY_EMOJIS: Record<string, string> = {
  Music: '🎵',
  Coffee: '☕️',
  Food: '🍽️',
  'Board Games': '🎲',
  Gaming: '🕹️',
  Hiking: '🥾',
  Fitness: '💪',
  Movies: '🎬',
  Reading: '📚',
  Yoga: '🧘',
  Running: '🏃',
  Photography: '📸',
  Art: '🎨',
  Dancing: '💃',
  Technology: '💻',
  Entrepreneurship: '🚀',
  Sports: '🏅',
  Volunteering: '🤝',
  Pets: '🐾',
};

const getEventEmoji = (categories: string[]) => {
  for (const category of categories) {
    if (EVENT_CATEGORY_EMOJIS[category]) {
      return EVENT_CATEGORY_EMOJIS[category];
    }
  }

  return '📍';
};

type MainScreenProps = {
  displayName: string;
  signedUpUser: UserSummary | null;
  loginIdentifier: string;
  mainTab: MainTab;
  mainPageWidth: number;
  profileLocation: string;
  profileRadius: string;
  profileMessage: string;
  events: EventSummary[];
  chatView: ChatView;
  activeThread: ChatThread | null;
  chatThreads: ChatThread[];
  matchProfiles: MatchProfile[];
  matchNotice: string;
  mainScrollRef: RefObject<ScrollView | null>;
  onMainContainerLayout: (event: LayoutChangeEvent) => void;
  onMainScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollToMainTab: (tab: MainTab) => void;
  onProfileLocationChange: (value: string) => void;
  onProfileRadiusChange: (value: string) => void;
  onSaveProfile: () => void;
  onEditInterests: () => void;
  onOpenThread: (threadId: string) => void;
  onBackToThreads: () => void;
  onSendChatMessage: (text: string) => void;
  onSwipeMatch: (action: SwipeAction, profile: MatchProfile) => void;
  onResetMatches: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
};

export function MainScreen({
  displayName,
  signedUpUser,
  loginIdentifier,
  mainTab,
  mainPageWidth,
  profileLocation,
  profileRadius,
  profileMessage,
  events,
  chatView,
  activeThread,
  chatThreads,
  matchProfiles,
  matchNotice,
  mainScrollRef,
  onMainContainerLayout,
  onMainScrollEnd,
  onScrollToMainTab,
  onProfileLocationChange,
  onProfileRadiusChange,
  onSaveProfile,
  onEditInterests,
  onOpenThread,
  onBackToThreads,
  onSendChatMessage,
  onSwipeMatch,
  onResetMatches,
  onOpenSettings,
  onLogout,
}: MainScreenProps) {
  const [draftMessage, setDraftMessage] = useState('');
  const topMatch = matchProfiles[0] ?? null;
  const cardPosition = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    setDraftMessage('');
  }, [activeThread?.id]);

  useEffect(() => {
    cardPosition.setValue({ x: 0, y: 0 });
  }, [topMatch?.id, cardPosition]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          Boolean(topMatch) && Math.abs(gestureState.dx) > 8,
        onMoveShouldSetPanResponderCapture: (_event, gestureState) =>
          Boolean(topMatch) && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 6,
        onPanResponderMove: Animated.event([null, { dx: cardPosition.x, dy: cardPosition.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_event, gestureState) => {
          if (!topMatch) {
            Animated.spring(cardPosition, {
              toValue: { x: 0, y: 0 },
              friction: 6,
              useNativeDriver: true,
            }).start();
            return;
          }

          if (gestureState.dx >= SWIPE_THRESHOLD) {
            Animated.timing(cardPosition, {
              toValue: { x: 420, y: 20 },
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              onSwipeMatch('like', topMatch);
              cardPosition.setValue({ x: 0, y: 0 });
            });
            return;
          }

          if (gestureState.dx <= -SWIPE_THRESHOLD) {
            Animated.timing(cardPosition, {
              toValue: { x: -420, y: 20 },
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              onSwipeMatch('pass', topMatch);
              cardPosition.setValue({ x: 0, y: 0 });
            });
            return;
          }

          Animated.spring(cardPosition, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            useNativeDriver: true,
          }).start();
        },
      }),
    [cardPosition, onSwipeMatch, topMatch]
  );

  const cardRotate = cardPosition.x.interpolate({
    inputRange: [-160, 0, 160],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = cardPosition.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const passOpacity = cardPosition.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const handleQuickSwipe = (action: SwipeAction) => {
    if (!topMatch) {
      return;
    }

    Animated.timing(cardPosition, {
      toValue: { x: action === 'like' ? 420 : -420, y: 12 },
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      onSwipeMatch(action, topMatch);
      cardPosition.setValue({ x: 0, y: 0 });
    });
  };

  const renderMatchCardContent = (profile: MatchProfile) => (
    <>
      <Image source={{ uri: profile.image }} style={styles.matchCardImage} contentFit="cover" />
      <View style={styles.matchCardBody}>
        <View style={styles.matchHeaderRow}>
          <View>
            <Text style={styles.matchName}>
              {profile.name}, {profile.age}
            </Text>
            <Text style={styles.matchMeta}>{profile.location}</Text>
          </View>
          <Text style={styles.matchReason}>{profile.matchReason}</Text>
        </View>

        <Text style={styles.matchBio}>{profile.bio}</Text>
        <Text style={styles.matchPrompt}>{profile.prompt}</Text>

        <View style={styles.matchChipRow}>
          {profile.interests.map((interest) => (
            <View key={`${profile.id}-${interest}`} style={styles.matchChip}>
              <Text style={styles.matchChipText}>{interest}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );

  const renderedMatchCards = matchProfiles
    .slice(0, 3)
    .map((profile, index) => {
      const isTop = index === 0;
      const stackStyle = isTop
        ? {
            transform: [...cardPosition.getTranslateTransform(), { rotate: cardRotate }],
            zIndex: 30,
          }
        : {
            top: index * 12,
            transform: [{ scale: 1 - index * 0.04 }],
            zIndex: 30 - index,
          };

      if (isTop) {
        return (
          <Animated.View
            key={profile.id}
            {...panResponder.panHandlers}
            style={[styles.matchCard, styles.matchCardTop, stackStyle]}>
            <Animated.View style={[styles.matchBadge, styles.matchBadgeLike, { opacity: likeOpacity }]}>
              <Text style={styles.matchBadgeText}>MATCH</Text>
            </Animated.View>
            <Animated.View style={[styles.matchBadge, styles.matchBadgePass, { opacity: passOpacity }]}>
              <Text style={styles.matchBadgeText}>PASS</Text>
            </Animated.View>
            {renderMatchCardContent(profile)}
          </Animated.View>
        );
      }

      return (
        <View key={profile.id} style={[styles.matchCard, styles.matchCardStacked, stackStyle]}>
          {renderMatchCardContent(profile)}
        </View>
      );
    })
    .reverse();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer} onLayout={onMainContainerLayout}>
        <View style={styles.mainHeader}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>👥</Text>
            </View>
            <Text style={styles.appTitle}>meetmatch</Text>
          </View>
          <Text style={styles.mainWelcome}>Hi, {displayName}</Text>
        </View>

        <ScrollView
          ref={mainScrollRef}
          style={styles.mainPages}
          horizontal
          pagingEnabled
          scrollEnabled={mainTab !== 'matches'}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMainScrollEnd}
          contentContainerStyle={styles.mainPagesContent}>
          <View style={[styles.mainPage, { width: mainPageWidth }]}> 
            <ScrollView
              style={styles.mainPageScroll}
              contentContainerStyle={styles.mainPageScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled>
              <View style={styles.mainCard}>
                <Text style={styles.mainCardTitle}>Chat</Text>
                <Text style={styles.mainCardText}>Your recent threads live here. Right swipes instantly become local demo chats.</Text>

                {chatView === 'thread' && activeThread ? (
                  <>
                    <Pressable style={styles.chatBackButton} onPress={onBackToThreads}>
                      <Text style={styles.chatBackText}>← Back to chats</Text>
                    </Pressable>
                    <Text style={styles.chatThreadName}>{activeThread.title}</Text>
                    <View style={styles.chatMessages}>
                      {activeThread.messages.map((message) => {
                        const sentByYou = message.sender === 'You';
                        return (
                          <View
                            key={message.id}
                            style={[
                              styles.chatBubble,
                              sentByYou ? styles.chatBubbleYou : styles.chatBubbleThem,
                            ]}>
                            <Text
                              style={sentByYou ? styles.chatBubbleTextYou : styles.chatBubbleTextThem}>
                              {message.text}
                            </Text>
                            <Text style={[styles.chatMetaText, sentByYou ? styles.chatMetaTextYou : styles.chatMetaTextThem]}>
                              {new Date(message.ts).toLocaleTimeString([], {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                    <View style={styles.chatComposer}>
                      <TextInput
                        style={styles.chatComposerInput}
                        placeholder="Send a message"
                        placeholderTextColor={PURPLE_700}
                        value={draftMessage}
                        onChangeText={setDraftMessage}
                      />
                      <Pressable
                        style={[
                          styles.chatSendButton,
                          !draftMessage.trim() && styles.chatSendButtonDisabled,
                        ]}
                        disabled={!draftMessage.trim()}
                        onPress={() => {
                          onSendChatMessage(draftMessage.trim());
                          setDraftMessage('');
                        }}>
                        <Text style={styles.chatSendButtonText}>Send</Text>
                      </Pressable>
                    </View>
                  </>
                ) : chatThreads.length > 0 ? (
                  <View style={styles.mainList}>
                    {chatThreads.map((thread) => (
                      <Pressable
                        key={thread.id}
                        style={styles.chatThreadRow}
                        onPress={() => onOpenThread(thread.id)}>
                        <View style={styles.chatThreadAvatar}>
                          {thread.avatar ? (
                            <Image source={{ uri: thread.avatar }} style={styles.chatThreadAvatarImage} contentFit="cover" />
                          ) : (
                            <Text style={styles.chatThreadAvatarText}>{thread.title.charAt(0)}</Text>
                          )}
                        </View>
                        <View style={styles.chatThreadInfo}>
                          <Text style={styles.mainListTitle}>{thread.title}</Text>
                          <Text style={styles.mainListText}>{thread.lastMessage}</Text>
                        </View>
                        <Text style={styles.chatChevron}>›</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <View style={styles.matchEmptyState}>
                    <Text style={styles.matchEmptyTitle}>No chats yet</Text>
                    <Text style={styles.mainListText}>Swipe right on someone in Matches to start your first conversation.</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>

          <View style={[styles.mainPage, { width: mainPageWidth }]}> 
            <ScrollView
              style={styles.mainPageScroll}
              contentContainerStyle={styles.mainPageScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled>
              <View style={styles.mainCard}>
                <Text style={styles.mainCardTitle}>Friend Matching</Text>
                <Text style={styles.mainCardText}>Swipe left to pass or right to match with the sample profiles and start a chat.</Text>
                <Text style={styles.matchCounter}>{matchProfiles.length} profiles left in your deck</Text>
                <Text style={styles.matchNotice}>{matchNotice}</Text>

                {matchProfiles.length > 0 ? (
                  <>
                    <View style={styles.swipeDeck}>{renderedMatchCards}</View>
                    <View style={styles.matchActions}>
                      <Pressable
                        style={[styles.matchActionButton, styles.matchActionPass]}
                        onPress={() => handleQuickSwipe('pass')}>
                        <Text style={styles.matchActionEmoji}>✕</Text>
                        <Text style={styles.matchActionLabel}>Pass</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.matchActionButton, styles.matchActionLike]}
                        onPress={() => handleQuickSwipe('like')}>
                        <Text style={styles.matchActionEmoji}>♥</Text>
                        <Text style={styles.matchActionLabel}>Match</Text>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <View style={styles.matchEmptyState}>
                    <Text style={styles.matchEmptyTitle}>You’ve reached the end of the sample deck.</Text>
                    <Text style={styles.mainListText}>Reload the demo profiles to keep testing the swipe flow.</Text>
                    <Pressable
                      style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
                      onPress={onResetMatches}>
                      <Text style={styles.primaryButtonText}>Load Sample Profiles Again</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>

          <View style={[styles.mainPage, { width: mainPageWidth }]}> 
            <ScrollView
              style={styles.mainPageScroll}
              contentContainerStyle={styles.mainPageScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled>
              <View style={styles.mainCard}>
                <Text style={styles.mainCardTitle}>Events</Text>
                <Text style={styles.mainCardText}>Browse upcoming hangouts in a cleaner event-card feed, similar to Google-style discovery results.</Text>
                <View style={styles.eventFeed}>
                  {events.slice(0, 6).map((event) => {
                    const eventDate = new Date(event.date_time);
                    const monthLabel = eventDate.toLocaleString([], { month: 'short' }).toUpperCase();
                    const dayLabel = eventDate.toLocaleString([], { day: 'numeric' });
                    const whenLabel = eventDate.toLocaleString([], {
                      weekday: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                    });
                    const interestCountLabel = `${event.interested_count} interested`;
                    const emoji = getEventEmoji(event.category_names);

                    return (
                      <View key={event.id} style={styles.eventCard}>
                        <View style={styles.eventHeroRow}>
                          <View style={styles.eventDateBadge}>
                            <Text style={styles.eventDateMonth}>{monthLabel}</Text>
                            <Text style={styles.eventDateDay}>{dayLabel}</Text>
                          </View>

                          <View style={styles.eventHeroContent}>
                            <View style={styles.eventTitleRow}>
                              <Text style={styles.eventTitle}>{event.name}</Text>
                              <View style={styles.eventSourcePill}>
                                <Text style={styles.eventSourceText}>{event.source}</Text>
                              </View>
                            </View>

                            <View style={styles.eventMetaRow}>
                              <Text style={styles.eventEmoji}>{emoji}</Text>
                              <Text style={styles.eventMetaText}>{whenLabel}</Text>
                            </View>
                            <Text style={styles.eventMetaSubtext}>{interestCountLabel}</Text>
                          </View>
                        </View>

                        <Text style={styles.eventDescription} numberOfLines={3}>
                          {event.description}
                        </Text>

                        <View style={styles.eventChipRow}>
                          {event.category_names.map((category) => (
                            <View key={`${event.id}-${category}`} style={styles.eventChip}>
                              <Text style={styles.eventChipText}>{category}</Text>
                            </View>
                          ))}
                        </View>

                        <View style={styles.eventFooterRow}>
                          <Text style={styles.eventFooterText}>By @{event.creator_username}</Text>
                          <Text style={styles.eventFooterLink}>View details →</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </View>

          <View style={[styles.mainPage, { width: mainPageWidth }]}> 
            <ScrollView
              style={styles.mainPageScroll}
              contentContainerStyle={styles.mainPageScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled>
              <View style={styles.mainCard}>
                <Text style={styles.mainCardTitle}>Profile</Text>
                <Text style={styles.mainCardText}>Manage your account and onboarding details here.</Text>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Name</Text>
                  <Text style={styles.profileValue}>
                    {signedUpUser ? `${signedUpUser.first_name} ${signedUpUser.last_name}`.trim() : 'Guest User'}
                  </Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Username</Text>
                  <Text style={styles.profileValue}>{signedUpUser?.username || loginIdentifier || 'Not set'}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Email</Text>
                  <Text style={styles.profileValue}>{signedUpUser?.email || 'Not available'}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Location</Text>
                  <TextInput
                    style={styles.profileInput}
                    placeholder="Enter your city or area"
                    placeholderTextColor={PURPLE_500}
                    value={profileLocation}
                    onChangeText={onProfileLocationChange}
                  />
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Radius</Text>
                  <TextInput
                    style={styles.profileInput}
                    placeholder="25"
                    placeholderTextColor={PURPLE_500}
                    value={profileRadius}
                    onChangeText={onProfileRadiusChange}
                    keyboardType="number-pad"
                  />
                  <Text style={styles.profileHint}>Distance in miles for matching and events.</Text>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
                  onPress={onSaveProfile}>
                  <Text style={styles.primaryButtonText}>Save Profile Preferences</Text>
                </Pressable>
                {profileMessage ? <Text style={styles.profileSuccess}>{profileMessage}</Text> : null}
                <Pressable
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.primaryButtonPressed]}
                  onPress={onEditInterests}>
                  <Text style={styles.secondaryButtonText}>Edit Interests</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.primaryButtonPressed]}
                  onPress={onOpenSettings}>
                  <Text style={styles.secondaryButtonText}>API Settings</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.logoutButton, pressed && styles.primaryButtonPressed]}
                  onPress={onLogout}>
                  <Text style={styles.logoutButtonText}>Log Out</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          {MAIN_TABS.map((tab) => {
            const isActive = mainTab === tab;
            return (
              <Pressable
                key={tab}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => onScrollToMainTab(tab)}>
                <Text style={[styles.navText, isActive && styles.navTextActive]}>
                  {tab === 'chat' ? 'Chat' : tab === 'matches' ? 'Matches' : tab === 'events' ? 'Events' : 'Profile'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}
