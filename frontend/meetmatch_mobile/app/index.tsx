import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Constants from 'expo-constants';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView } from 'react-native';

import sampleEventsData from './data/sample-events.json';
import { SAMPLE_MATCH_PROFILES } from './data/sample-matches';
import { InterestsScreen } from './screens/InterestsScreen';
import { LoginScreen } from './screens/LoginScreen';
import { MainScreen } from './screens/MainScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SignupScreen } from './screens/SignupScreen';
import {
  MAIN_TABS,
  type ChatMessage,
  type ChatThread,
  type ChatView,
  type EventSummary,
  type Interest,
  type MainTab,
  type MatchProfile,
  type Screen,
  type SignupForm,
  type SwipeAction,
  type UserSummary,
} from './types';

const API_PORT = process.env.EXPO_PUBLIC_API_PORT ?? '8000';
const LAN_IP = process.env.EXPO_PUBLIC_LAN_IP?.trim();
const EXPLICIT_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

const buildApiUrl = (host: string) => `http://${host}:${API_PORT}`;

const DEFAULT_NATIVE_API_URL = LAN_IP ? buildApiUrl(LAN_IP) : buildApiUrl('127.0.0.1');
const DEFAULT_WEB_API_URL = EXPLICIT_API_BASE_URL || (LAN_IP ? buildApiUrl(LAN_IP) : buildApiUrl('127.0.0.1'));
const resolveNativeApiUrl = () => {
  if (EXPLICIT_API_BASE_URL) {
    return EXPLICIT_API_BASE_URL;
  }

  if (LAN_IP) {
    return buildApiUrl(LAN_IP);
  }

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  if (host) {
    return buildApiUrl(host);
  }

  return DEFAULT_NATIVE_API_URL;
};

const DEFAULT_API_URL = Platform.OS === 'web' ? DEFAULT_WEB_API_URL : resolveNativeApiUrl();
const SAMPLE_EVENTS = sampleEventsData.events as EventSummary[];
const DEFAULT_MATCH_NOTICE = 'Swipe right to connect or left to keep exploring.';

type MatchApiSummary = {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  age?: number | null;
  match_score?: number;
  distance_miles?: number | null;
  shared_interest_names?: string[];
  shared_top_interest_names?: string[];
  top_interest_overlap_names?: string[];
  profile_pic?: string | null;
};

const PLACEHOLDER_PROFILE_IMAGE = 'https://via.placeholder.com/600x600.png?text=User';

const avatarFromSeed = (_seed: string) => PLACEHOLDER_PROFILE_IMAGE;

const mapApiMatchToProfile = (match: MatchApiSummary): MatchProfile => {
  const name = [match.first_name, match.last_name].filter(Boolean).join(' ').trim() || match.username;
  const interests = Array.from(
    new Set([...(match.shared_top_interest_names ?? []), ...(match.shared_interest_names ?? [])])
  ).slice(0, 5);
  const overlap = match.top_interest_overlap_names ?? [];

  return {
    id: String(match.id),
    name,
    age: match.age ?? 25,
    image: match.profile_pic || avatarFromSeed(match.username || name),
    location:
      typeof match.distance_miles === 'number' ? `${match.distance_miles.toFixed(1)} miles away` : 'Nearby',
    bio: interests.length
      ? `Into ${interests.slice(0, 3).join(', ')} and always down for a fun new plan.`
      : 'Always down for a new coffee spot or a local event.',
    interests: interests.length ? interests : ['Coffee', 'Music', 'Travel'],
    prompt: overlap.length
      ? `Ask me about ${overlap[0].toLowerCase()}.`
      : 'Ask me what my ideal first meetup looks like.',
    matchReason: `Score ${match.match_score ?? 0}${
      typeof match.distance_miles === 'number' ? ` • ${match.distance_miles.toFixed(1)} mi away` : ''
    }`,
  };
};

const INITIAL_CHAT_THREADS: ChatThread[] = [];

const parseApiResponse = async (response: Response) => {
  const raw = await response.text();
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    if (!response.ok) {
      throw new Error(`Request failed (${response.status}). Check API URL and backend server.`);
    }

    throw new Error('Server returned invalid JSON response.');
  }
};

export default function MeetMatchMobileApp() {
  const [screen, setScreen] = useState<Screen>('login');
  const [mainTab, setMainTab] = useState<MainTab>('matches');
  const [mainPageWidth, setMainPageWidth] = useState(Dimensions.get('window').width - 32);
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_URL);
  const [tempApiUrl, setTempApiUrl] = useState(apiBaseUrl);
  const [signedUpUser, setSignedUpUser] = useState<UserSummary | null>(null);
  const mainScrollRef = useRef<ScrollView | null>(null);

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [signupForm, setSignupForm] = useState<SignupForm>({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    age: '',
    password: '',
    location: '',
  });
  const [signupError, setSignupError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [profileLocation, setProfileLocation] = useState('');
  const [profileRadius, setProfileRadius] = useState('25');
  const [profileMessage, setProfileMessage] = useState('');

  const [events, setEvents] = useState<EventSummary[]>(SAMPLE_EVENTS);
  const [allMatchProfiles, setAllMatchProfiles] = useState<MatchProfile[]>(SAMPLE_MATCH_PROFILES);
  const [matchProfiles, setMatchProfiles] = useState<MatchProfile[]>(SAMPLE_MATCH_PROFILES);
  const [matchNotice, setMatchNotice] = useState(DEFAULT_MATCH_NOTICE);

  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedInterestIds, setSelectedInterestIds] = useState<number[]>([]);
  const [topInterestIds, setTopInterestIds] = useState<number[]>([]);
  const [interestsError, setInterestsError] = useState('');
  const [interestsMessage, setInterestsMessage] = useState('');
  const [isLoadingInterests, setIsLoadingInterests] = useState(false);
  const [isSavingInterests, setIsSavingInterests] = useState(false);

  // -------------------------
  // Chat tab state (local demo)
  // -------------------------
  const [chatView, setChatView] = useState<ChatView>('threads');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>(INITIAL_CHAT_THREADS);

  const activeThread = useMemo(
    () => chatThreads.find((t) => t.id === activeThreadId) ?? null,
    [chatThreads, activeThreadId]
  );

  const openThread = (threadId: string) => {
    setActiveThreadId(threadId);
    setChatView('thread');
  };

  const sendChatMessage = (text: string) => {
    if (!activeThreadId) return;

    setChatThreads((current) =>
      current.map((t) => {
        if (t.id !== activeThreadId) return t;

        const msg: ChatMessage = {
          id: `m_${Math.random().toString(16).slice(2)}`,
          sender: 'You',
          text,
          ts: Date.now(),
        };

        return {
          ...t,
          messages: [...t.messages, msg],
          lastMessage: text,
        };
      })
    );
  };

  const handleSwipeMatch = useCallback((action: SwipeAction, profile: MatchProfile) => {
    setMatchProfiles((current) => current.filter((candidate) => candidate.id !== profile.id));

    if (action === 'like') {
      setMatchNotice(`You matched with ${profile.name}! Check the Chat tab to say hi 👋`);
      setChatThreads((current) => {
        if (current.some((thread) => thread.title === profile.name)) {
          return current;
        }

        const starterMessage = profile.interests[0]
          ? `Hey! I saw we both like ${profile.interests[0].toLowerCase()}.`
          : 'Hey! Glad we matched.';

        const nextThread: ChatThread = {
          id: `match-${profile.id}`,
          title: profile.name,
          avatar: profile.image,
          lastMessage: 'You matched! Start the conversation 👋',
          messages: [
            {
              id: `hello-${profile.id}`,
              sender: 'Them',
              text: starterMessage,
              ts: Date.now() - 1000 * 60,
            },
          ],
        };

        return [nextThread, ...current];
      });
    } else {
      setMatchNotice(`Passed on ${profile.name}. Keep swiping.`);
    }
  }, []);

  const resetMatchDeck = useCallback(() => {
    setMatchProfiles([...allMatchProfiles]);
    setMatchNotice(DEFAULT_MATCH_NOTICE);
  }, [allMatchProfiles]);

  const selectedSet = useMemo(() => new Set(selectedInterestIds), [selectedInterestIds]);
  const topSet = useMemo(() => new Set(topInterestIds), [topInterestIds]);

  const scrollToMainTab = useCallback(
    (tab: MainTab, animated = true) => {
      const nextIndex = MAIN_TABS.indexOf(tab);
      setMainTab(tab);
      mainScrollRef.current?.scrollTo({ x: nextIndex * Math.max(mainPageWidth, 1), y: 0, animated });
    },
    [mainPageWidth]
  );

  // D4: reset chat view when leaving chat tab
  useEffect(() => {
    if (mainTab !== 'chat') {
      setChatView('threads');
      setActiveThreadId(null);
    }
  }, [mainTab]);

  useEffect(() => {
    if (screen !== 'main') {
      return;
    }

    const frame = requestAnimationFrame(() => {
      scrollToMainTab(mainTab, false);
    });

    return () => cancelAnimationFrame(frame);
  }, [screen, mainPageWidth, mainTab, scrollToMainTab]);

  useEffect(() => {
    fetch(`${apiBaseUrl}/api/events/`)
      .then(async (response) => {
        const data = await parseApiResponse(response);
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load events');
        }

        if (Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events);
        } else {
          setEvents(SAMPLE_EVENTS);
        }
      })
      .catch(() => {
        setEvents(SAMPLE_EVENTS);
      });
  }, [apiBaseUrl]);

  useEffect(() => {
    if (screen !== 'main') {
      return;
    }

    if (!signedUpUser?.id) {
      setAllMatchProfiles(SAMPLE_MATCH_PROFILES);
      setMatchProfiles(SAMPLE_MATCH_PROFILES);
      setMatchNotice(DEFAULT_MATCH_NOTICE);
      return;
    }

    fetch(`${apiBaseUrl}/api/users/${signedUpUser.id}/matches/?limit=12`)
      .then(async (response) => {
        const data = await parseApiResponse(response);
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load matches');
        }

        const mappedMatches = Array.isArray(data.matches)
          ? (data.matches as MatchApiSummary[]).map(mapApiMatchToProfile)
          : [];
        const nextMatches = mappedMatches.length > 0 ? mappedMatches : SAMPLE_MATCH_PROFILES;

        setAllMatchProfiles(nextMatches);
        setMatchProfiles(nextMatches);
        setMatchNotice(DEFAULT_MATCH_NOTICE);
      })
      .catch(() => {
        setAllMatchProfiles(SAMPLE_MATCH_PROFILES);
        setMatchProfiles(SAMPLE_MATCH_PROFILES);
        setMatchNotice(DEFAULT_MATCH_NOTICE);
      });
  }, [apiBaseUrl, screen, signedUpUser?.id]);

  useEffect(() => {
    if (screen !== 'interests') {
      return;
    }

    setIsLoadingInterests(true);
    setInterestsError('');

    Promise.all([
      fetch(`${apiBaseUrl}/api/interests/`).then(async (response) => {
        const data = await parseApiResponse(response);
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load interests');
        }

        return data;
      }),
      signedUpUser?.id
        ? fetch(`${apiBaseUrl}/api/users/${signedUpUser.id}/interests/`).then(async (response) => {
            const data = await parseApiResponse(response);
            if (!response.ok) {
              throw new Error(data.error || 'Failed to load saved interests');
            }

            return data;
          })
        : Promise.resolve({ selected_interest_ids: [], top_interest_ids: [] }),
    ])
      .then(([interestData, savedInterestData]) => {
        setInterests(interestData.interests || []);
        setSelectedInterestIds(savedInterestData.selected_interest_ids || []);
        setTopInterestIds(savedInterestData.top_interest_ids || []);
      })
      .catch((error: Error) => {
        setInterestsError(error.message || 'Something went wrong');
      })
      .finally(() => {
        setIsLoadingInterests(false);
      });
  }, [screen, apiBaseUrl, signedUpUser?.id]);

  const handleLogin = () => {
    setLoginError('');
    setLoginMessage('');
    setIsLoggingIn(true);

    fetch(`${apiBaseUrl}/api/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: loginIdentifier, password: loginPassword }),
    })
      .then(async (response) => {
        const data = await parseApiResponse(response);
        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        setSignedUpUser(data.user || null);
        setProfileLocation(data.user?.location ?? signupForm.location ?? '');
        setLoginMessage(data.message || 'Login successful');
        setMatchNotice(DEFAULT_MATCH_NOTICE);
        setMainTab('matches');
        setScreen('main');
      })
      .catch((error: Error) => {
        setLoginError(error.message || 'Something went wrong');
      })
      .finally(() => {
        setIsLoggingIn(false);
      });
  };

  const handleSignup = () => {
    setSignupError('');
    setIsSigningUp(true);

    fetch(`${apiBaseUrl}/api/signup/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...signupForm,
        age: Number(signupForm.age),
      }),
    })
      .then(async (response) => {
        const data = await parseApiResponse(response);
        if (!response.ok) {
          throw new Error(data.error || 'Signup failed');
        }

        setSignedUpUser(data.user || null);
        setProfileLocation(signupForm.location || '');
        setSelectedInterestIds([]);
        setTopInterestIds([]);
        setInterestsError('');
        setInterestsMessage('');
        setScreen('interests');
      })
      .catch((error: Error) => {
        setSignupError(error.message || 'Something went wrong');
      })
      .finally(() => {
        setIsSigningUp(false);
      });
  };

  const toggleInterest = (interestId: number) => {
    setInterestsError('');
    setInterestsMessage('');

    if (selectedSet.has(interestId)) {
      setSelectedInterestIds((current) => current.filter((id) => id !== interestId));
      setTopInterestIds((current) => current.filter((id) => id !== interestId));
      return;
    }

    setSelectedInterestIds((current) => [...current, interestId]);
  };

  const toggleTopInterest = (interestId: number) => {
    setInterestsError('');
    setInterestsMessage('');

    if (topSet.has(interestId)) {
      setTopInterestIds((current) => current.filter((id) => id !== interestId));
      return;
    }

    if (topInterestIds.length >= 3) {
      setInterestsError('You can only choose 3 top interests.');
      return;
    }

    setTopInterestIds((current) => [...current, interestId]);
  };

  const saveInterests = () => {
    if (!signedUpUser?.id) {
      setInterestsError('Signup session not found. Please sign up again.');
      return;
    }

    if (selectedInterestIds.length < 3) {
      setInterestsError('Please select at least 3 interests.');
      return;
    }

    if (topInterestIds.length !== 3) {
      setInterestsError('Please select exactly 3 top interests.');
      return;
    }

    setIsSavingInterests(true);

    fetch(`${apiBaseUrl}/api/users/${signedUpUser.id}/interests/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selected_interest_ids: selectedInterestIds,
        top_interest_ids: topInterestIds,
      }),
    })
      .then(async (response) => {
        const data = await parseApiResponse(response);
        if (!response.ok) {
          throw new Error(data.error || 'Failed to save interests');
        }

        setInterestsMessage('Interests saved successfully.');
        setMatchNotice(DEFAULT_MATCH_NOTICE);
        setMainTab('matches');
        setScreen('main');
      })
      .catch((error: Error) => {
        setInterestsError(error.message || 'Something went wrong');
      })
      .finally(() => {
        setIsSavingInterests(false);
      });
  };

  const handleSaveApiUrl = () => {
    if (tempApiUrl.trim()) {
      setApiBaseUrl(tempApiUrl.trim());
      setScreen('login');
    }
  };

  const handleLogout = () => {
    setSignedUpUser(null);
    setLoginIdentifier('');
    setLoginPassword('');
    setLoginError('');
    setLoginMessage('');
    setSignupError('');
    setSelectedInterestIds([]);
    setTopInterestIds([]);
    setInterestsError('');
    setInterestsMessage('');
    setProfileLocation('');
    setProfileRadius('25');
    setProfileMessage('');
    setChatThreads(INITIAL_CHAT_THREADS);
    setChatView('threads');
    setActiveThreadId(null);
    setAllMatchProfiles(SAMPLE_MATCH_PROFILES);
    setMatchProfiles(SAMPLE_MATCH_PROFILES);
    setMatchNotice(DEFAULT_MATCH_NOTICE);
    setMainTab('matches');
    setScreen('login');
  };

  const handleSaveProfile = () => {
    setProfileMessage('Profile preferences updated.');
    setSignupForm((current) => ({
      ...current,
      location: profileLocation,
    }));
    setSignedUpUser((current) => (current ? { ...current, location: profileLocation } : current));
  };

  const handleMainScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / Math.max(mainPageWidth, 1));
    setMainTab(MAIN_TABS[nextIndex] ?? 'events');
  };

  if (screen === 'main') {
    const displayName = signedUpUser?.first_name || signedUpUser?.username || 'there';

    return (
      <MainScreen
        displayName={displayName}
        signedUpUser={signedUpUser}
        loginIdentifier={loginIdentifier}
        mainTab={mainTab}
        mainPageWidth={mainPageWidth}
        profileLocation={profileLocation}
        profileRadius={profileRadius}
        profileMessage={profileMessage}
        events={events}
        chatView={chatView}
        activeThread={activeThread}
        chatThreads={chatThreads}
        matchProfiles={matchProfiles}
        matchNotice={matchNotice}
        mainScrollRef={mainScrollRef}
        onMainContainerLayout={(event) => setMainPageWidth(event.nativeEvent.layout.width)}
        onMainScrollEnd={handleMainScrollEnd}
        onScrollToMainTab={scrollToMainTab}
        onProfileLocationChange={(value) => {
          setProfileLocation(value);
          setProfileMessage('');
        }}
        onProfileRadiusChange={(value) => {
          setProfileRadius(value);
          setProfileMessage('');
        }}
        onSaveProfile={handleSaveProfile}
        onEditInterests={() => setScreen('interests')}
        onOpenThread={openThread}
        onBackToThreads={() => setChatView('threads')}
        onSendChatMessage={sendChatMessage}
        onSwipeMatch={handleSwipeMatch}
        onResetMatches={resetMatchDeck}
        onOpenSettings={() => setScreen('settings')}
        onLogout={handleLogout}
      />
    );
  }

  if (screen === 'settings') {
    return (
      <SettingsScreen
        apiBaseUrl={apiBaseUrl}
        tempApiUrl={tempApiUrl}
        defaultApiUrl={DEFAULT_API_URL}
        onChangeApiUrl={setTempApiUrl}
        onSaveApiUrl={handleSaveApiUrl}
        onUseSuggestedDefault={() => {
          setTempApiUrl(DEFAULT_API_URL);
          setApiBaseUrl(DEFAULT_API_URL);
          setScreen('login');
        }}
        onBackToLogin={() => setScreen('login')}
      />
    );
  }

  if (screen === 'signup') {
    return (
      <SignupScreen
        signupForm={signupForm}
        showSignupPassword={showSignupPassword}
        signupError={signupError}
        isSigningUp={isSigningUp}
        onChangeField={(field, value) => setSignupForm((current) => ({ ...current, [field]: value }))}
        onToggleShowPassword={() => setShowSignupPassword((current) => !current)}
        onSignup={handleSignup}
        onShowLogin={() => setScreen('login')}
      />
    );
  }

  if (screen === 'interests') {
    return (
      <InterestsScreen
        interests={interests}
        selectedInterestIds={selectedInterestIds}
        topInterestIds={topInterestIds}
        selectedSet={selectedSet}
        topSet={topSet}
        isLoadingInterests={isLoadingInterests}
        isSavingInterests={isSavingInterests}
        interestsMessage={interestsMessage}
        interestsError={interestsError}
        onToggleInterest={toggleInterest}
        onToggleTopInterest={toggleTopInterest}
        onSaveInterests={saveInterests}
      />
    );
  }

  return (
    <LoginScreen
      loginIdentifier={loginIdentifier}
      loginPassword={loginPassword}
      showLoginPassword={showLoginPassword}
      loginError={loginError}
      loginMessage={loginMessage}
      isLoggingIn={isLoggingIn}
      onChangeIdentifier={setLoginIdentifier}
      onChangePassword={setLoginPassword}
      onToggleShowPassword={() => setShowLoginPassword((current) => !current)}
      onLogin={handleLogin}
      onShowSignup={() => setScreen('signup')}
      onShowSettings={() => setScreen('settings')}
    />
  );
}
