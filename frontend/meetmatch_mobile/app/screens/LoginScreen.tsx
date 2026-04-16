import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles, LIGHT_PURPLE_GRADIENT_START, LIGHT_PURPLE_GRADIENT_END, BLUSH_PINK } from '../styles';

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
      <LinearGradient
        colors={[LIGHT_PURPLE_GRADIENT_START, LIGHT_PURPLE_GRADIENT_END, BLUSH_PINK]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.screenGradient}>
        <ScrollView contentContainerStyle={styles.containerTransparent} keyboardShouldPersistTaps="handled">
          <View style={styles.authShell}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Image
                source={require('../assets/images/logo.png')}
                style={{ width: 38, height: 38, borderRadius: 19 }}
                contentFit="cover"
                accessibilityLabel="MeetMatch logo"
              />
            </View>
            
            <Text style={styles.appTitle}>MeetMatch</Text>
          </View>

          <LinearGradient
            colors={[styles.loginGradientCard.backgroundColor, styles.loginGradientCard.backgroundColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradientCard, styles.loginGradientCard]}>
            <Text style={[styles.title, styles.loginTitle]}>Log In</Text>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, styles.loginFieldLabel]}>Username or email</Text>
              <TextInput
                style={[styles.input, styles.loginInput]}
                value={loginIdentifier}
                onChangeText={onChangeIdentifier}
                autoCapitalize="none"
                placeholderTextColor="#8f145f"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, styles.loginFieldLabel]}>Password</Text>
              <View style={[styles.passwordRow, styles.loginPasswordRow]}>
                <TextInput
                  style={[styles.passwordInput, styles.loginPasswordInput]}
                  value={loginPassword}
                  onChangeText={onChangePassword}
                  secureTextEntry={!showLoginPassword}
                  placeholderTextColor="#8f145f"
                />
                <Pressable style={[styles.passwordToggle, styles.loginPasswordToggle]} onPress={onToggleShowPassword}>
                  <Text style={[styles.passwordToggleText, styles.loginPasswordToggleText]}>{showLoginPassword ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryButton, styles.loginPrimaryButton, pressed && styles.primaryButtonPressed]}
              onPress={onLogin}
              disabled={isLoggingIn}>
              <Text style={[styles.primaryButtonText, styles.loginPrimaryButtonText]}>{isLoggingIn ? 'Logging in...' : 'Log In'}</Text>
            </Pressable>

            {loginMessage ? <Text style={styles.successText}>{loginMessage}</Text> : null}
            {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}

            <View style={styles.footerRow}>
              <View style={styles.footerInlineRow}>
                <Text style={[styles.footerText, styles.loginFooterText]}>New Here?</Text>
                <Pressable onPress={onShowSignup}>
                  <Text style={[styles.linkText, styles.loginSignupLink]}>Create an account</Text>
                </Pressable>
              </View>

              <Pressable onPress={onShowSettings}>
                <Text style={[styles.linkText, styles.loginSecondaryLink]}>API Settings</Text>
              </Pressable>
            </View>
          </LinearGradient>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
