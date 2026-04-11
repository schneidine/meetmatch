import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PURPLE_500, styles } from '../styles';

type LoginScreenProps = {
  loginIdentifier: string;
  loginPassword: string;
  showLoginPassword: boolean;
  loginError: string;
  loginMessage: string;
  isLoggingIn: boolean;
  onChangeIdentifier: (value: string) => void;
  onChangePassword: (value: string) => void;
  onToggleShowPassword: () => void;
  onLogin: () => void;
  onShowSignup: () => void;
  onShowSettings: () => void;
};

export function LoginScreen({
  loginIdentifier,
  loginPassword,
  showLoginPassword,
  loginError,
  loginMessage,
  isLoggingIn,
  onChangeIdentifier,
  onChangePassword,
  onToggleShowPassword,
  onLogin,
  onShowSignup,
  onShowSettings,
}: LoginScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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
              onChangeText={onChangeIdentifier}
              autoCapitalize="none"
            />
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor={PURPLE_500}
                value={loginPassword}
                onChangeText={onChangePassword}
                secureTextEntry={!showLoginPassword}
              />
              <Pressable style={styles.passwordToggle} onPress={onToggleShowPassword}>
                <Text style={styles.passwordToggleText}>{showLoginPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              onPress={onLogin}
              disabled={isLoggingIn}>
              <Text style={styles.primaryButtonText}>{isLoggingIn ? 'Logging in...' : 'Log In'}</Text>
            </Pressable>

            {loginMessage ? <Text style={styles.successText}>{loginMessage}</Text> : null}
            {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}

            <Pressable onPress={onShowSignup}>
              <Text style={styles.linkText}>New to account? Sign up</Text>
            </Pressable>

            <Pressable onPress={onShowSettings}>
              <Text style={styles.linkText}>API Settings</Text>
            </Pressable>
          </View>
        </>
      </ScrollView>
    </SafeAreaView>
  );
}
