import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Constants from 'expo-constants';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView } from 'react-native';

import sampleEventsData from './data/sample-events.json';
import { InterestsScreen } from './screens/InterestsScreen';
import { LoginScreen } from './screens/LoginScreen';
import { MainScreen } from './screens/MainScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SignupScreen } from './screens/SignupScreen';
import { MAIN_TABS, type EventSummary, type Interest, type MainTab, type Screen, type SignupForm, type UserSummary } from './types';

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
  const [mainTab, setMainTab] = useState<MainTab>('events');
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

  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedInterestIds, setSelectedInterestIds] = useState<number[]>([]);
  const [topInterestIds, setTopInterestIds] = useState<number[]>([]);
  const [interestsError, setInterestsError] = useState('');
  const [interestsMessage, setInterestsMessage] = useState('');
  const [isLoadingInterests, setIsLoadingInterests] = useState(false);
  const [isSavingInterests, setIsSavingInterests] = useState(false);

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
        setMainTab('events');
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
        setMainTab('events');
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
    setMainTab('events');
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
