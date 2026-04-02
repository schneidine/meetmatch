import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Constants from 'expo-constants';
import {
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Screen = 'login' | 'signup' | 'interests' | 'settings' | 'main';
type MainTab = 'chat' | 'matches' | 'events' | 'profile';
const MAIN_TABS: MainTab[] = ['chat', 'matches', 'events', 'profile'];

type UserSummary = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  location?: string;
};

type Interest = {
  id: number;
  name: string;
};

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

const PURPLE_100 = '#f3e8ff';
const PURPLE_200 = '#ddd6fe';
const PURPLE_500 = '#a855f7';
const PURPLE_700 = '#7e22ce';

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

  const [signupForm, setSignupForm] = useState({
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.mainContainer} onLayout={(event) => setMainPageWidth(event.nativeEvent.layout.width)}>
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
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMainScrollEnd}
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
                  <Text style={styles.mainCardText}>Start conversations with your matches. This is a barebones placeholder.</Text>
                  <View style={styles.mainList}>
                    <View style={styles.mainListItem}>
                      <Text style={styles.mainListTitle}>Alex</Text>
                      <Text style={styles.mainListText}>“You going to Live Music Night?”</Text>
                    </View>
                    <View style={styles.mainListItem}>
                      <Text style={styles.mainListTitle}>Jordan</Text>
                      <Text style={styles.mainListText}>“Coffee meetup sounds great ☕️”</Text>
                    </View>
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
                  <Text style={styles.mainCardTitle}>Friend Matching</Text>
                  <Text style={styles.mainCardText}>Swipe right for your profile, or browse suggested friends here.</Text>
                  <View style={styles.mainList}>
                    <View style={styles.mainListItem}>
                      <Text style={styles.mainListTitle}>Alex, 24</Text>
                      <Text style={styles.mainListText}>Loves concerts, coffee chats, and trivia nights.</Text>
                    </View>
                    <View style={styles.mainListItem}>
                      <Text style={styles.mainListTitle}>Jordan, 26</Text>
                      <Text style={styles.mainListText}>Into hiking, indie films, and weekend food spots.</Text>
                    </View>
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
                  <Text style={styles.mainCardTitle}>Events</Text>
                  <Text style={styles.mainCardText}>Barebones event feed for now. This is your default landing page.</Text>
                  <View style={styles.mainList}>
                    <View style={styles.mainListItem}>
                      <Text style={styles.mainListTitle}>Live Music Night</Text>
                      <Text style={styles.mainListText}>Friday · 7:30 PM · Downtown</Text>
                    </View>
                    <View style={styles.mainListItem}>
                      <Text style={styles.mainListTitle}>Coffee Meetup</Text>
                      <Text style={styles.mainListText}>Saturday · 11:00 AM · Riverside Cafe</Text>
                    </View>
                    <View style={styles.mainListItem}>
                      <Text style={styles.mainListTitle}>Board Game Social</Text>
                      <Text style={styles.mainListText}>Sunday · 3:00 PM · Community Hub</Text>
                    </View>
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
                      onChangeText={(value) => {
                        setProfileLocation(value);
                        setProfileMessage('');
                      }}
                    />
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Radius</Text>
                    <TextInput
                      style={styles.profileInput}
                      placeholder="25"
                      placeholderTextColor={PURPLE_500}
                      value={profileRadius}
                      onChangeText={(value) => {
                        setProfileRadius(value);
                        setProfileMessage('');
                      }}
                      keyboardType="number-pad"
                    />
                    <Text style={styles.profileHint}>Distance in miles for matching and events.</Text>
                  </View>

                  <Pressable
                    style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
                    onPress={handleSaveProfile}>
                    <Text style={styles.primaryButtonText}>Save Profile Preferences</Text>
                  </Pressable>
                  {profileMessage ? <Text style={styles.profileSuccess}>{profileMessage}</Text> : null}
                  <Pressable
                    style={({ pressed }) => [styles.secondaryButton, pressed && styles.primaryButtonPressed]}
                    onPress={() => setScreen('interests')}>
                    <Text style={styles.secondaryButtonText}>Edit Interests</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.secondaryButton, pressed && styles.primaryButtonPressed]}
                    onPress={() => setScreen('settings')}>
                    <Text style={styles.secondaryButtonText}>API Settings</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.logoutButton, pressed && styles.primaryButtonPressed]}
                    onPress={handleLogout}>
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
                  onPress={() => scrollToMainTab(tab)}>
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

  if (screen === 'settings') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.title}>API Settings</Text>
            <Text style={styles.subtitle}>Current API URL: {apiBaseUrl}</Text>
            <Text style={[styles.subtitle, { marginTop: 16 }]}>Suggested default for this device: {DEFAULT_API_URL}</Text>
            <Text style={styles.subtitle}>
              Use localhost for web, and your Mac LAN IP for iOS/Android, e.g.{' '}
              <Text style={styles.subtitleBold}>http://192.168.x.x:8000</Text>
            </Text>

            <TextInput
              style={styles.input}
              placeholder="http://192.168.x.x:8000"
              placeholderTextColor={PURPLE_500}
              value={tempApiUrl}
              onChangeText={setTempApiUrl}
              autoCapitalize="none"
            />

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              onPress={handleSaveApiUrl}>
              <Text style={styles.primaryButtonText}>Save API URL</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              onPress={() => {
                setTempApiUrl(DEFAULT_API_URL);
                setApiBaseUrl(DEFAULT_API_URL);
                setScreen('login');
              }}>
              <Text style={styles.primaryButtonText}>Use Suggested Default</Text>
            </Pressable>

            <Pressable style={styles.linkButton} onPress={() => setScreen('login')}>
              <Text style={styles.linkText}>Back to Login</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {screen === 'login' && (
          <>
            <View style={styles.brandRow}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoText}>👥</Text>
              </View>
              <Text style={styles.appTitle}>meetmatch</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.title}>Login</Text>
              <TextInput
                style={styles.input}
                placeholder="Username or Email"
                placeholderTextColor={PURPLE_500}
                value={loginIdentifier}
                onChangeText={setLoginIdentifier}
                autoCapitalize="none"
              />
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  placeholderTextColor={PURPLE_500}
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  secureTextEntry={!showLoginPassword}
                />
                <Pressable style={styles.passwordToggle} onPress={() => setShowLoginPassword((current) => !current)}>
                  <Text style={styles.passwordToggleText}>{showLoginPassword ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>

              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
                onPress={handleLogin}
                disabled={isLoggingIn}>
                <Text style={styles.primaryButtonText}>{isLoggingIn ? 'Logging in...' : 'Log In'}</Text>
              </Pressable>

              {loginMessage ? <Text style={styles.successText}>{loginMessage}</Text> : null}
              {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}

              <Pressable onPress={() => setScreen('signup')}>
                <Text style={styles.linkText}>New to account? Sign up</Text>
              </Pressable>

              <Pressable onPress={() => setScreen('settings')}>
                <Text style={styles.linkText}>API Settings</Text>
              </Pressable>
            </View>
          </>
        )}

        {screen === 'signup' && (
          <>
            <View style={styles.brandRow}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoText}>👥</Text>
              </View>
              <Text style={styles.appTitle}>meetmatch</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.title}>Sign Up</Text>

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.inputHalf}
                  placeholder="First Name"
                  placeholderTextColor={PURPLE_500}
                  value={signupForm.first_name}
                  onChangeText={(value) => setSignupForm((current) => ({ ...current, first_name: value }))}
                />
                <TextInput
                  style={styles.inputHalf}
                  placeholder="Last Name"
                  placeholderTextColor={PURPLE_500}
                  value={signupForm.last_name}
                  onChangeText={(value) => setSignupForm((current) => ({ ...current, last_name: value }))}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={PURPLE_500}
                value={signupForm.username}
                onChangeText={(value) => setSignupForm((current) => ({ ...current, username: value }))}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={PURPLE_500}
                value={signupForm.email}
                onChangeText={(value) => setSignupForm((current) => ({ ...current, email: value }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Age"
                placeholderTextColor={PURPLE_500}
                value={signupForm.age}
                onChangeText={(value) => setSignupForm((current) => ({ ...current, age: value }))}
                keyboardType="number-pad"
              />
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  placeholderTextColor={PURPLE_500}
                  value={signupForm.password}
                  onChangeText={(value) => setSignupForm((current) => ({ ...current, password: value }))}
                  secureTextEntry={!showSignupPassword}
                />
                <Pressable style={styles.passwordToggle} onPress={() => setShowSignupPassword((current) => !current)}>
                  <Text style={styles.passwordToggleText}>{showSignupPassword ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Location (optional)"
                placeholderTextColor={PURPLE_500}
                value={signupForm.location}
                onChangeText={(value) => setSignupForm((current) => ({ ...current, location: value }))}
              />

              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
                onPress={handleSignup}
                disabled={isSigningUp}>
                <Text style={styles.primaryButtonText}>{isSigningUp ? 'Signing up...' : 'Sign Up'}</Text>
              </Pressable>

              {signupError ? <Text style={styles.errorText}>{signupError}</Text> : null}

              <Pressable onPress={() => setScreen('login')}>
                <Text style={styles.linkText}>Existing account? Log in</Text>
              </Pressable>
            </View>
          </>
        )}

        {screen === 'interests' && (
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
                        onPress={() => toggleInterest(interest.id)}
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
                          onPress={() => toggleTopInterest(interest.id)}
                          style={[styles.pill, isTop && styles.topPillSelected]}>
                          <Text style={[styles.pillText, isTop && styles.topPillTextSelected]}>{interest.name}</Text>
                        </Pressable>
                      );
                    })}
                </View>

                <Pressable
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
                  onPress={saveInterests}
                  disabled={isSavingInterests}>
                  <Text style={styles.primaryButtonText}>{isSavingInterests ? 'Saving...' : 'Save Interests'}</Text>
                </Pressable>

                {interestsMessage ? <Text style={styles.successText}>{interestsMessage}</Text> : null}
                {interestsError ? <Text style={styles.errorText}>{interestsError}</Text> : null}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PURPLE_200,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  mainContainer: {
    flex: 1,
    paddingTop: 18,
  },
  mainHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: PURPLE_500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: PURPLE_500,
    textAlign: 'center',
    marginBottom: 0,
  },
  mainWelcome: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: PURPLE_700,
    textAlign: 'center',
  },
  card: {
    backgroundColor: PURPLE_500,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: PURPLE_100,
  },
  subtitleBold: {
    fontWeight: '700',
    color: '#ffffff',
  },
  sectionHeading: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  input: {
    borderWidth: 1,
    borderColor: PURPLE_500,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#000000',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputHalf: {
    flex: 1,
    borderWidth: 1,
    borderColor: PURPLE_500,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#000000',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PURPLE_500,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#ffffff',
  },
  passwordToggle: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PURPLE_100,
  },
  passwordToggleText: {
    color: PURPLE_700,
    fontWeight: '700',
    fontSize: 13,
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    opacity: 1,
  },
  primaryButtonPressed: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: PURPLE_500,
    fontWeight: '600',
    fontSize: 16,
  },
  linkText: {
    color: PURPLE_100,
    textAlign: 'center',
    marginTop: 8,
  },
  linkButton: {
    marginTop: 12,
  },
  errorText: {
    color: '#ffffff',
    marginTop: 4,
    textAlign: 'center',
  },
  successText: {
    color: '#ffffff',
    marginTop: 4,
    textAlign: 'center',
  },
  mainPages: {
    flex: 1,
  },
  mainPagesContent: {
    alignItems: 'stretch',
    flexGrow: 1,
  },
  mainPage: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mainPageScroll: {
    flex: 1,
  },
  mainPageScrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  mainCard: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    minHeight: 420,
    borderWidth: 1,
    borderColor: PURPLE_100,
  },
  mainCardTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: PURPLE_700,
    marginBottom: 8,
  },
  mainCardText: {
    fontSize: 15,
    color: '#5b5670',
    marginBottom: 16,
  },
  mainList: {
    gap: 12,
  },
  mainListItem: {
    backgroundColor: PURPLE_100,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PURPLE_200,
  },
  mainListTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PURPLE_700,
    marginBottom: 4,
  },
  mainListText: {
    fontSize: 14,
    color: '#4b5563',
  },
  profileRow: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: PURPLE_100,
  },
  profileLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PURPLE_500,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  profileValue: {
    fontSize: 16,
    color: '#1f2937',
  },
  profileInput: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: PURPLE_200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  profileHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#6b7280',
  },
  profileSuccess: {
    marginTop: 8,
    textAlign: 'center',
    color: PURPLE_700,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 10,
    backgroundColor: PURPLE_100,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: PURPLE_700,
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 10,
    backgroundColor: PURPLE_500,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PURPLE_500,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 18,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 8,
    gap: 8,
  },
  navItem: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  navItemActive: {
    backgroundColor: PURPLE_500,
  },
  navText: {
    color: PURPLE_500,
    fontWeight: '600',
  },
  navTextActive: {
    color: '#ffffff',
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  pillSelected: {
    backgroundColor: PURPLE_100,
    borderColor: PURPLE_500,
  },
  pillText: {
    color: '#000000',
  },
  pillTextSelected: {
    color: PURPLE_500,
    fontWeight: '600',
  },
  topPillSelected: {
    backgroundColor: PURPLE_100,
    borderColor: PURPLE_500,
  },
  topPillTextSelected: {
    color: PURPLE_700,
    fontWeight: '700',
  },
});
