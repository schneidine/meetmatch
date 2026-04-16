import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
// expo-image is used for performant image rendering in React Native (see https://docs.expo.dev/versions/latest/sdk/image/)
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';


import {
  Animated,
  KeyboardAvoidingView,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  RefreshControl,
} from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles, LIGHT_PURPLE_GRADIENT_START, LIGHT_PURPLE_GRADIENT_END, LIGHT_PINK, BLUSH_PINK } from '../styles';
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

const DEMO_LOCATION_COORDS: Record<string, { latitude: number; longitude: number }> = {
  orlando: { latitude: 28.5383, longitude: -81.3792 },
  downtown: { latitude: 28.5383, longitude: -81.3792 },
  'downtown orlando': { latitude: 28.5383, longitude: -81.3792 },
  'winter park': { latitude: 28.599, longitude: -81.3392 },
  'lake eola': { latitude: 28.5434, longitude: -81.3732 },
  'mills 50': { latitude: 28.5547, longitude: -81.3642 },
  'ivanhoe village': { latitude: 28.5693, longitude: -81.3894 },
  'audubon park': { latitude: 28.5657, longitude: -81.3523 },
};

const getEventEmoji = (categories: string[]) => {
  for (const category of categories) {
    if (EVENT_CATEGORY_EMOJIS[category]) {
      return EVENT_CATEGORY_EMOJIS[category];
    }
  }

  return '📍';
};

const resolveLocationCoordinates = (location: string) => {
  const normalizedLocation = location.trim().toLowerCase();

  if (!normalizedLocation) {
    return DEMO_LOCATION_COORDS.orlando;
  }

  const matchedEntry = Object.entries(DEMO_LOCATION_COORDS).find(([key]) => normalizedLocation.includes(key));
  return matchedEntry?.[1] ?? DEMO_LOCATION_COORDS.orlando;
};

const calculateDistanceMiles = (
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number
) => {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const latDelta = toRadians(toLatitude - fromLatitude);
  const lonDelta = toRadians(toLongitude - fromLongitude);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(fromLatitude)) * Math.cos(toRadians(toLatitude)) * Math.sin(lonDelta / 2) ** 2;

  return earthRadiusMiles * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
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
  matchedHistory: MatchProfile[];
  interestedEvents: EventSummary[];
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
  onToggleEventInterest: (eventId: number) => void;
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
  matchedHistory,
  interestedEvents,
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
  onToggleEventInterest,
  onOpenSettings,
  onLogout,
}: MainScreenProps) {
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  // Profile picture upload handler
  const handlePickAndUploadProfilePic = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access camera roll is required!');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (pickerResult.canceled || !pickerResult.assets || !pickerResult.assets[0]?.uri) return;

    setUploading(true);

    const formData = new FormData();
    // React Native FormData: use File/Blob or RN polyfill
    formData.append('profile_pic', {
      uri: pickerResult.assets[0].uri,
      name: 'profile.jpg',
      type: 'image/jpeg',
    } as any);

    const userId = signedUpUser?.id;
    const uploadUrl = `http://YOUR_BACKEND_URL/users/${userId}/upload_profile_pic/`;

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      const data = await response.json();
      if (data.profile_pic_url) {
        alert('Profile picture updated!');
        // Optionally, update the user's profile pic in your app state here
      } else {
        alert('Upload failed.');
      }
    } catch (err) {
      alert('Upload error: ' + err);
    } finally {
      setUploading(false);
    }
  };
  const [draftMessage, setDraftMessage] = useState('');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [selectedInterestFilter, setSelectedInterestFilter] = useState('All');
  const [showEventFilters, setShowEventFilters] = useState(false);
  // Refresh state for pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
    // Handler for pull-to-refresh
    const onRefresh = async () => {
      setRefreshing(true);
      // Simulate refresh: you can replace this with actual data reload logic
      setTimeout(() => {
        setRefreshing(false);
      }, 1200);
    };
  const topMatch = matchProfiles[0] ?? null;
  const cardPosition = useRef(new Animated.ValueXY()).current;
  const normalizedEventSearch = eventSearchQuery.trim().toLowerCase();
  const normalizedRadius = Number.parseFloat(profileRadius);
  const userCoordinates = useMemo(() => resolveLocationCoordinates(profileLocation), [profileLocation]);
  const upcomingReminderCount = useMemo(() => {
    const now = Date.now();
    const twoDaysFromNow = now + 2 * 24 * 60 * 60 * 1000;

    return interestedEvents.filter((event) => {
      const eventTime = new Date(event.date_time).getTime();
      return eventTime >= now && eventTime <= twoDaysFromNow;
    }).length;
  }, [interestedEvents]);
  const notificationCount = Math.min(chatThreads.length + upcomingReminderCount + (matchedHistory.length > 0 ? 1 : 0), 9);
  // Lavender-dominant gradient with subtle blush hint at end
  const mainScreenGradientColors =
    mainTab === 'profile'
      ? ([LIGHT_PURPLE_GRADIENT_START, LIGHT_PURPLE_GRADIENT_END] as const)
      : ([LIGHT_PURPLE_GRADIENT_START, LIGHT_PURPLE_GRADIENT_END, BLUSH_PINK] as const);

  // --- User Event Creation Form State (moved inside component) ---
  const [userEventTitle, setUserEventTitle] = useState('');
  const [userEventDate, setUserEventDate] = useState('');
  const [userEventTime, setUserEventTime] = useState('');
  const [userEventLocation, setUserEventLocation] = useState('');
  const [userEventUrl, setUserEventUrl] = useState('');
  const [userEvents, setUserEvents] = useState<EventSummary[]>([]);

  // Helper to merge user events with backend events
  const mergedEvents = useMemo(() => {
    // Only add user events with valid title and date
    return [...userEvents, ...events];
  }, [userEvents, events]);

  // Available event interests (categories)
  const availableEventInterests = useMemo(
    () => ['All', ...Array.from(new Set(mergedEvents.flatMap((event) => event.category_names))).sort((a, b) => a.localeCompare(b))],
    [mergedEvents]
  );

  // Only future events for search results
  const filteredEvents = useMemo(() => {
    const now = Date.now();
    return mergedEvents.filter((event) => {
      const eventTime = new Date(event.date_time).getTime();
      if (eventTime < now) return false;

      const searchableText = [event.name, event.description, event.creator_username, ...event.category_names]
        .join(' ')
        .toLowerCase();
      const matchesSearch = !normalizedEventSearch || searchableText.includes(normalizedEventSearch);
      const matchesInterest = selectedInterestFilter === 'All' || event.category_names.includes(selectedInterestFilter);

      const distanceMiles =
        event.latitude != null && event.longitude != null
          ? calculateDistanceMiles(userCoordinates.latitude, userCoordinates.longitude, event.latitude, event.longitude)
          : null;
      const matchesRadius =
        !Number.isFinite(normalizedRadius) || normalizedRadius <= 0 || distanceMiles == null || distanceMiles <= normalizedRadius;

      return matchesSearch && matchesInterest && matchesRadius;
    });
  }, [mergedEvents, normalizedEventSearch, normalizedRadius, selectedInterestFilter, userCoordinates]);

  // Handler for user event form submission
  const handleAddUserEvent = () => {
    if (!userEventTitle.trim() || !userEventDate.trim() || !userEventTime.trim() || !userEventLocation.trim()) {
      alert('Please fill in all required fields.');
      return;
    }
    // Compose ISO date string
    const dateTimeIso = new Date(`${userEventDate}T${userEventTime}`).toISOString();
    const newEvent: EventSummary = {
      id: Date.now(),
      name: userEventTitle,
      description: '',
      date_time: dateTimeIso,
      source: 'custom',
      event_url: userEventUrl,
      category_names: ['Custom'],
      latitude: resolveLocationCoordinates(userEventLocation).latitude,
      longitude: resolveLocationCoordinates(userEventLocation).longitude,
      interested_count: 1,
      is_interested: true,
      creator_username: displayName,
    };
    setUserEvents((prev) => [newEvent, ...prev]);
    setUserEventTitle('');
    setUserEventDate('');
    setUserEventTime('');
    setUserEventLocation('');
    setUserEventUrl('');
  };

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

  const renderMatchCardContent = (profile: MatchProfile) => {
    // const sharedInterestedEvents = interestedEvents.filter((event) => profile.interestedEventIds?.includes(event.id));

    return (
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

          {/* ...existing event preview and chips logic... */}
        </View>
      </>
    );
  };

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
      <LinearGradient
        colors={mainScreenGradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.screenGradient}>
        <View style={[styles.mainContainer, mainTab !== 'profile' ? styles.mainContainerTransparent : null]} onLayout={onMainContainerLayout}>
          {/* Removed top-level image picker and upload button above ScrollView */}
        <View style={styles.mainHeader}>
          <View style={styles.headerTable}>
            <View style={styles.headerLeftGroup}>
              <View style={styles.logoBadge}>
                <Image
                  source={require('../assets/images/logo.png')}
                  style={{ width: 38, height: 38, borderRadius: 19 }}
                  contentFit="cover"
                  accessibilityLabel="MeetMatch logo"
                />
              </View>
              <Text style={styles.headerGreeting}>MeetMatch</Text>
            </View>

            <View style={styles.headerMiddle} />

            <Pressable
              style={({ pressed }) => [styles.notificationButton, pressed && styles.primaryButtonPressed]}
              onPress={() =>
                router.push({
                  pathname: '/notifications',
                  params: {
                    matches: JSON.stringify(
                      matchedHistory.map((profile) => ({
                        id: profile.id,
                        name: profile.name,
                      }))
                    ),
                    threads: JSON.stringify(
                      chatThreads.map((thread) => ({
                        id: thread.id,
                        title: thread.title,
                        lastMessage: thread.lastMessage,
                      }))
                    ),
                    events: JSON.stringify(
                      interestedEvents.map((event) => ({
                        id: event.id,
                        name: event.name,
                        date_time: event.date_time,
                        event_url: event.event_url,
                        category_names: event.category_names,
                      }))
                    ),
                  },
                })
              }>
              <Ionicons name="notifications" style={styles.notificationIcon} />
              {notificationCount > 0 ? (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
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
              contentContainerStyle={[styles.mainPageScrollContent, chatView === 'thread' && activeThread ? { flexGrow: 1 } : undefined]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={!(chatView === 'thread' && activeThread)}
              nestedScrollEnabled
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={LIGHT_PINK} colors={[LIGHT_PINK]} />}
            >
              <LinearGradient
                colors={[LIGHT_PURPLE_GRADIENT_START, LIGHT_PURPLE_GRADIENT_END, BLUSH_PINK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.mainCard, chatView === 'thread' && activeThread ? { flex: 1 } : undefined]}>
                <Text style={styles.mainCardTitle}>Chat</Text>
                <Text style={styles.mainCardText}>Your recent threads live here. Right swipes instantly become local demo chats.</Text>

                {chatView === 'thread' && activeThread ? (
                  <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}>
                    <View style={{ flex: 1 }}>
                    <Pressable style={styles.chatBackButton} onPress={onBackToThreads}>
                      <Text style={styles.chatBackText}>← Back to chats</Text>
                    </Pressable>
                    <Text style={styles.chatThreadName}>{activeThread.title}</Text>
                    <ScrollView
                      style={{ flex: 1 }}
                      contentContainerStyle={[styles.chatMessages, { flexGrow: 1, justifyContent: 'flex-end' }]}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled">
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
                    </ScrollView>
                    <View style={styles.chatComposer}>
                      <TextInput
                        style={styles.chatComposerInput}
                        placeholder="Send a message"
                        placeholderTextColor={LIGHT_PINK}
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
                    </View>
                  </KeyboardAvoidingView>
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
              </LinearGradient>
            </ScrollView>
          </View>

          <View style={[styles.mainPage, { width: mainPageWidth }]}> 
            <ScrollView
              style={styles.mainPageScroll}
              contentContainerStyle={styles.mainPageScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={LIGHT_PINK} colors={[LIGHT_PINK]} />}
            >
              <LinearGradient
                colors={[LIGHT_PURPLE_GRADIENT_START, LIGHT_PURPLE_GRADIENT_END, BLUSH_PINK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mainCard}>
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
              </LinearGradient>
            </ScrollView>
          </View>

          <View style={[styles.mainPage, { width: mainPageWidth }]}> 
            <ScrollView
              style={styles.mainPageScroll}
              contentContainerStyle={styles.mainPageScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={LIGHT_PINK} colors={[LIGHT_PINK]} />}
            >
              <LinearGradient
                colors={[LIGHT_PURPLE_GRADIENT_START, LIGHT_PURPLE_GRADIENT_END, BLUSH_PINK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mainCard}>
                <View style={styles.eventHeaderRow}>
                  <View style={styles.eventHeaderTextBlock}>
                    <Text style={styles.mainCardTitle}>Events</Text>
                    <Text style={styles.mainCardText}>Browse upcoming hangouts!</Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [styles.eventFilterMenuButton, pressed && styles.primaryButtonPressed]}
                    onPress={() => setShowEventFilters((current) => !current)}>
                    <Text style={styles.eventFilterMenuIcon}>☰</Text>
                  </Pressable>
                </View>


                {/* Modal Popup for Add Event */}
                {showAddEventModal && (
                  <View style={{
                    position: 'absolute',
                    top: 60,
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    backgroundColor: 'rgba(255,255,255,0.97)',
                    borderRadius: 16,
                    margin: 24,
                    padding: 18,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 8,
                  }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10, color: LIGHT_PINK }}>Add Your Own Event</Text>
                    <TextInput
                      style={styles.eventSearchInput}
                      placeholder="Event Title"
                      placeholderTextColor={LIGHT_PINK}
                      value={userEventTitle}
                      onChangeText={setUserEventTitle}
                    />
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                      <TextInput
                        style={[styles.eventSearchInput, { flex: 1 }]}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={LIGHT_PINK}
                        value={userEventDate}
                        onChangeText={setUserEventDate}
                      />
                      <TextInput
                        style={[styles.eventSearchInput, { flex: 1 }]}
                        placeholder="HH:MM (24h)"
                        placeholderTextColor={LIGHT_PINK}
                        value={userEventTime}
                        onChangeText={setUserEventTime}
                      />
                    </View>
                    <TextInput
                      style={styles.eventSearchInput}
                      placeholder="Location"
                      placeholderTextColor={LIGHT_PINK}
                      value={userEventLocation}
                      onChangeText={setUserEventLocation}
                    />
                    <TextInput
                      style={styles.eventSearchInput}
                      placeholder="Event URL (optional)"
                      placeholderTextColor={LIGHT_PINK}
                      value={userEventUrl}
                      onChangeText={setUserEventUrl}
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.primaryButton,
                          pressed && styles.primaryButtonPressed,
                          { marginRight: 10, paddingHorizontal: 20 }
                        ]}
                        onPress={() => {
                          handleAddUserEvent();
                          setShowAddEventModal(false);
                        }}
                      >
                        <Text style={styles.primaryButtonText}>Add Event</Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [
                          styles.primaryButton,
                          pressed && styles.primaryButtonPressed,
                          { backgroundColor: '#eee', paddingHorizontal: 20 }
                        ]}
                        onPress={() => setShowAddEventModal(false)}
                      >
                        <Text style={[styles.primaryButtonText, { color: '#6C3EB6' }]}>Cancel</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
                <TextInput
                  style={styles.eventSearchInput}
                  placeholder="Search events, categories, or keywords"
                  placeholderTextColor={LIGHT_PINK}
                  value={eventSearchQuery}
                  onChangeText={setEventSearchQuery}
                />
                {showEventFilters ? (
                  <View style={styles.eventFilterPopup}>
                    <View style={styles.eventFilterPopupHeader}>
                      <Text style={styles.eventFilterPopupTitle}>Filter events</Text>
                      <Pressable onPress={() => setShowEventFilters(false)}>
                        <Text style={styles.eventFilterPopupClose}>✕</Text>
                      </Pressable>
                    </View>

                    <View style={styles.eventFilterRow}>
                      <Text style={styles.eventFilterLabel}>Radius</Text>
                      <View style={styles.eventRadiusFieldRow}>
                        <TextInput
                          style={styles.eventRadiusInput}
                          placeholder="25"
                          placeholderTextColor={LIGHT_PINK}
                          value={profileRadius}
                          onChangeText={onProfileRadiusChange}
                          keyboardType="decimal-pad"
                        />
                        <Text style={styles.eventRadiusSuffix}>miles</Text>
                      </View>
                    </View>

                    <View style={styles.eventFilterRow}>
                      <Text style={styles.eventFilterLabel}>Interests</Text>
                      <ScrollView
                        style={styles.eventInterestScrollArea}
                        nestedScrollEnabled
                        showsVerticalScrollIndicator>
                        <View style={styles.eventInterestFilterWrap}>
                          {availableEventInterests.map((interest) => {
                            const isActive = selectedInterestFilter === interest;
                            return (
                              <Pressable
                                key={interest}
                                style={[
                                  styles.eventInterestFilterChip,
                                  isActive && styles.eventInterestFilterChipActive,
                                ]}
                                onPress={() => setSelectedInterestFilter(interest)}>
                                <Text
                                  style={[
                                    styles.eventInterestFilterText,
                                    isActive && styles.eventInterestFilterTextActive,
                                  ]}>
                                  {interest}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>
                  </View>
                ) : null}
                <Text style={styles.eventSearchMeta}>
                  {`Showing events near ${profileLocation || 'your location'}`}
                </Text>
                <Text style={styles.eventSearchMeta}>
                  {`${filteredEvents.length} result${filteredEvents.length === 1 ? '' : 's'} • ${selectedInterestFilter === 'All' ? 'All interests' : selectedInterestFilter} • ${profileRadius || 'Any'} mi`}
                </Text>
                <View style={styles.eventFeed}>
                  {filteredEvents.length > 0 ? filteredEvents.map((event) => {
                    const eventDate = new Date(event.date_time);
                    const monthLabel = eventDate.toLocaleString([], { month: 'short' }).toUpperCase();
                    const dayLabel = eventDate.toLocaleString([], { day: 'numeric' });
                    const whenLabel = eventDate.toLocaleString([], {
                      weekday: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                    });
                    const distanceMiles =
                      event.latitude != null && event.longitude != null
                        ? calculateDistanceMiles(userCoordinates.latitude, userCoordinates.longitude, event.latitude, event.longitude)
                        : null;
                    const interestCountLabel = `${event.interested_count} interested${
                      distanceMiles != null ? ` • ${distanceMiles.toFixed(1)} mi away` : ''
                    }`;
                    const emoji = getEventEmoji(event.category_names);
                    const matchedPeopleInterested = event.is_interested
                      ? matchedHistory.filter((profile) => profile.interestedEventIds?.includes(event.id))
                      : [];

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

                        {matchedPeopleInterested.length > 0 ? (
                          <View style={styles.eventMatchContext}>
                            <Text style={styles.eventMatchLabel}>Your matches also interested</Text>
                            <View style={styles.eventMatchChipRow}>
                              {matchedPeopleInterested.slice(0, 3).map((profile) => (
                                <View key={`${event.id}-${profile.id}`} style={styles.eventMatchChip}>
                                  <Text style={styles.eventMatchChipText}>{profile.name}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        ) : null}

                        <View style={styles.eventFooterRow}>
                          <View style={styles.eventFooterMeta}>
                            <Text style={styles.eventFooterText}>By @{event.creator_username}</Text>
                            {event.event_url ? (
                              <Pressable onPress={() => {
                                const url = event.event_url as string;
                                if (Platform.OS === 'web') {
                                  window.open(url, '_blank', 'noopener,noreferrer');
                                } else {
                                  Linking.openURL(url).catch(() => null);
                                }
                              }}>
                                <Text style={styles.eventFooterLink}>Click for more information ↗</Text>
                              </Pressable>
                            ) : null}
                          </View>
                          <Pressable
                            style={[
                              styles.eventInterestButton,
                              event.is_interested && styles.eventInterestButtonActive,
                            ]}
                            onPress={() => onToggleEventInterest(event.id)}>
                            <Text
                              style={[
                                styles.eventInterestButtonText,
                                event.is_interested && styles.eventInterestButtonTextActive,
                              ]}>
                              {event.is_interested ? 'Interested ✓' : 'Interested?'}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  }) : (
                    <View style={styles.eventSearchEmptyState}>
                      <Text style={styles.matchEmptyTitle}>No events found</Text>
                      <Text style={styles.mainListText}>Try a different keyword like coffee, music, yoga, or tech.</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </ScrollView>
            {/* Floating Add Event Button (lower right corner) */}
            <View pointerEvents="box-none" style={{ position: 'absolute', bottom: 32, right: 24, zIndex: 200 }}>
              <Pressable
                style={({ pressed }) => [
                  {
                    backgroundColor: LIGHT_PINK,
                    borderRadius: 28,
                    width: 56,
                    height: 56,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.18,
                    shadowRadius: 6,
                    elevation: 6,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={() => setShowAddEventModal(true)}
                accessibilityLabel="Add Event"
              >
                <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold', marginTop: -2 }}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.mainPage, { width: mainPageWidth }]}> 
            <ScrollView
              style={styles.mainPageScroll}
              contentContainerStyle={styles.mainPageScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled>
              <LinearGradient
                colors={[LIGHT_PURPLE_GRADIENT_START, LIGHT_PURPLE_GRADIENT_END, BLUSH_PINK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mainCard}>
                <Text style={styles.mainCardTitle}>Profile</Text>
                <Text style={styles.mainCardText}>Manage your account and onboarding details here.</Text>
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <Image
                    source={{ uri: (signedUpUser as any)?.profile_pic_url || 'https://placehold.co/100x100' }}
                    style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 12, marginTop: 8 }}
                  />
                  <Pressable
                    onPress={handlePickAndUploadProfilePic}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      {
                        marginBottom: 16,
                        alignSelf: 'center',
                        paddingHorizontal: 16,
                        minWidth: 180, // reasonable min width for button
                        maxWidth: 320,
                      },
                      pressed && styles.primaryButtonPressed,
                    ]}
                    disabled={uploading}
                  >
                    <Text
                      style={styles.primaryButtonText}
                    >
                      {uploading ? 'Uploading...' : 'Upload Profile Picture'}
                    </Text>
                  </Pressable>
                </View>
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
                    placeholderTextColor={LIGHT_PINK}
                    value={profileLocation}
                    onChangeText={onProfileLocationChange}
                  />
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Radius</Text>
                  <TextInput
                    style={styles.profileInput}
                    placeholder="25"
                    placeholderTextColor={LIGHT_PINK}
                    value={profileRadius}
                    onChangeText={onProfileRadiusChange}
                    keyboardType="number-pad"
                  />
                  <Text style={styles.profileHint}>Distance in miles for matching and events.</Text>
                </View>

                <View style={styles.profileHistorySection}>
                  <Text style={styles.profileHistoryTitle}>History</Text>

                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/matched-people',
                        params: {
                          items: JSON.stringify(
                            matchedHistory.map((profile) => ({
                              id: profile.id,
                              name: profile.name,
                              location: profile.location,
                              image: profile.image,
                            }))
                          ),
                        },
                      })
                    }>
                    <LinearGradient
                      colors={['#f0f9ff', '#e0f2fe', '#dbeafe']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.historyLinkCardGradient}>
                      <View style={styles.historyLinkBody}>
                        <Text style={[styles.profileHistoryLabel, styles.historyLinkMatchedLabel]}>People you matched with</Text>
                        <Text style={styles.historyLinkMeta}>
                          {matchedHistory.length > 0
                            ? `${matchedHistory.length} saved match${matchedHistory.length === 1 ? '' : 'es'}`
                            : 'No user history yet. Swipe right in Matches to save people here.'}
                        </Text>
                      </View>
                      <Text style={[styles.historyLinkArrow, styles.historyLinkMatchedLabel]}>›</Text>
                    </LinearGradient>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/saved-events',
                        params: {
                          items: JSON.stringify(
                            interestedEvents.map((event) => ({
                              id: event.id,
                              name: event.name,
                              date_time: event.date_time,
                              category_names: event.category_names,
                            }))
                          ),
                        },
                      })
                    }>
                    <LinearGradient
                      colors={['#f0f9ff', '#e0f2fe', '#dbeafe']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.historyLinkCardGradient}>
                      <View style={styles.historyLinkBody}>
                        <Text style={[styles.profileHistoryLabel, styles.historyLinkMatchedLabel]}>Events you marked interested</Text>
                        <Text style={styles.historyLinkMeta}>
                          {interestedEvents.length > 0
                            ? `${interestedEvents.length} saved event${interestedEvents.length === 1 ? '' : 's'}`
                            : 'No event history yet. Tap Interested on an event to track it here.'}
                        </Text>
                      </View>
                      <Text style={[styles.historyLinkArrow, styles.historyLinkMatchedLabel]}>›</Text>
                    </LinearGradient>
                  </Pressable>
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
              </LinearGradient>
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
                  {tab === 'chat'
                    ? 'Chat'
                    : tab === 'matches'
                      ? 'Matches'
                      : tab === 'events'
                        ? 'Events'
                        : 'Profile'}
                </Text>
              </Pressable>
            );
          })}
        </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
