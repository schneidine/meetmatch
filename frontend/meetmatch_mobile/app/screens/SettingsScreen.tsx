import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PURPLE_500, styles } from '../styles';

type SettingsScreenProps = {
  apiBaseUrl: string;
  tempApiUrl: string;
  defaultApiUrl: string;
  onChangeApiUrl: (value: string) => void;
  onSaveApiUrl: () => void;
  onUseSuggestedDefault: () => void;
  onBackToLogin: () => void;
};

export function SettingsScreen({
  apiBaseUrl,
  tempApiUrl,
  defaultApiUrl,
  onChangeApiUrl,
  onSaveApiUrl,
  onUseSuggestedDefault,
  onBackToLogin,
}: SettingsScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>API Settings</Text>
          <Text style={styles.subtitle}>Current API URL: {apiBaseUrl}</Text>
          <Text style={[styles.subtitle, { marginTop: 16 }]}>Suggested default for this device: {defaultApiUrl}</Text>
          <Text style={styles.subtitle}>
            Use localhost for web, and your Mac LAN IP for iOS/Android, e.g.{' '}
            <Text style={styles.subtitleBold}>http://192.168.x.x:8000</Text>
          </Text>

          <TextInput
            style={styles.input}
            placeholder="http://192.168.x.x:8000"
            placeholderTextColor={PURPLE_500}
            value={tempApiUrl}
            onChangeText={onChangeApiUrl}
            autoCapitalize="none"
          />

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
            onPress={onSaveApiUrl}>
            <Text style={styles.primaryButtonText}>Save API URL</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
            onPress={onUseSuggestedDefault}>
            <Text style={styles.primaryButtonText}>Use Suggested Default</Text>
          </Pressable>

          <Pressable style={styles.linkButton} onPress={onBackToLogin}>
            <Text style={styles.linkText}>Back to Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
