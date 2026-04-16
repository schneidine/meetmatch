import { LinearGradient } from 'expo-linear-gradient';
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
      <LinearGradient
        colors={['#f4fffe', '#ecfeff', '#ddfbf4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.screenGradient}>
        <ScrollView contentContainerStyle={styles.containerTransparent} keyboardShouldPersistTaps="handled">
          <View style={styles.authShell}>
          <View style={styles.heroPanelAlt}>
            <Text style={styles.eyebrow}>Connection setup</Text>
            <Text style={styles.heroTitle}>Point the app to your backend.</Text>
            <Text style={styles.subtitle}>
              Use localhost for web, or your Mac&apos;s LAN IP for iOS and Android devices.
            </Text>
          </View>

          <LinearGradient
            colors={['#ecfeff', '#dffcf3', '#f5f3ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradientCard, styles.softGradientCard]}>
            <Text style={styles.eyebrow}>API settings</Text>
            <Text style={styles.title}>Choose your server</Text>
            <Text style={styles.subtitle}>Current API URL: {apiBaseUrl}</Text>
            <Text style={[styles.subtitle, { marginTop: 8 }]}>Suggested default for this device: {defaultApiUrl}</Text>
            <Text style={styles.helperText}>
              Example: <Text style={styles.subtitleBold}>http://192.168.x.x:8000</Text>
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
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.primaryButtonPressed]}
              onPress={onUseSuggestedDefault}>
              <Text style={styles.secondaryButtonText}>Use Suggested Default</Text>
            </Pressable>

            <Pressable style={styles.linkButton} onPress={onBackToLogin}>
              <Text style={styles.linkText}>Back to Login</Text>
            </Pressable>
          </LinearGradient>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
