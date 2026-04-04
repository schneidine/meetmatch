import type { RefObject } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PURPLE_500, styles } from '../styles';
import { MAIN_TABS, type MainTab, type UserSummary } from '../types';

type MainScreenProps = {
  displayName: string;
  signedUpUser: UserSummary | null;
  loginIdentifier: string;
  mainTab: MainTab;
  mainPageWidth: number;
  profileLocation: string;
  profileRadius: string;
  profileMessage: string;
  mainScrollRef: RefObject<ScrollView | null>;
  onMainContainerLayout: (event: LayoutChangeEvent) => void;
  onMainScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollToMainTab: (tab: MainTab) => void;
  onProfileLocationChange: (value: string) => void;
  onProfileRadiusChange: (value: string) => void;
  onSaveProfile: () => void;
  onEditInterests: () => void;
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
  mainScrollRef,
  onMainContainerLayout,
  onMainScrollEnd,
  onScrollToMainTab,
  onProfileLocationChange,
  onProfileRadiusChange,
  onSaveProfile,
  onEditInterests,
  onOpenSettings,
  onLogout,
}: MainScreenProps) {
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
