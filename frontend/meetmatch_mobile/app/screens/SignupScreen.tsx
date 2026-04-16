import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles, LIGHT_PURPLE_GRADIENT_START, LIGHT_PURPLE_GRADIENT_END, BLUSH_PINK } from '../styles';
import type { SignupForm } from '../types';

type SignupScreenProps = {
  signupForm: SignupForm;
  showSignupPassword: boolean;
  signupError: string;
  isSigningUp: boolean;
  onChangeField: (field: keyof SignupForm, value: string) => void;
  onToggleShowPassword: () => void;
  onSignup: () => void;
  onShowLogin: () => void;
};

export function SignupScreen({
  signupForm,
  showSignupPassword,
  signupError,
  isSigningUp,
  onChangeField,
  onToggleShowPassword,
  onSignup,
  onShowLogin,
}: SignupScreenProps) {
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
            <Text style={styles.appTitle}>meetmatch</Text>
          </View>

          <LinearGradient
            colors={[styles.softGradientCard.backgroundColor, styles.softGradientCard.backgroundColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradientCard, styles.softGradientCard]}>
            <Text style={[styles.title, styles.signupTitle]}>Create an account</Text>

            <View style={styles.inputRow}>
              <View style={styles.fieldGroupHalf}>
                <Text style={styles.fieldLabel}>First name</Text>
                <TextInput
                  style={styles.inputHalf}
                  value={signupForm.first_name}
                  onChangeText={(value) => onChangeField('first_name', value)}
                />
              </View>
              <View style={styles.fieldGroupHalf}>
                <Text style={styles.fieldLabel}>Last name</Text>
                <TextInput
                  style={styles.inputHalf}
                  value={signupForm.last_name}
                  onChangeText={(value) => onChangeField('last_name', value)}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Username</Text>
              <TextInput
                style={styles.input}
                value={signupForm.username}
                onChangeText={(value) => onChangeField('username', value)}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={signupForm.email}
                onChangeText={(value) => onChangeField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.fieldGroupHalf}>
                <Text style={styles.fieldLabel}>Age</Text>
                <TextInput
                  style={styles.inputHalf}
                  value={signupForm.age}
                  onChangeText={(value) => onChangeField('age', value)}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.fieldGroupHalf}>
                <Text style={styles.fieldLabel}>Location</Text>
                <TextInput
                  style={styles.inputHalf}
                  value={signupForm.location}
                  onChangeText={(value) => onChangeField('location', value)}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  value={signupForm.password}
                  onChangeText={(value) => onChangeField('password', value)}
                  secureTextEntry={!showSignupPassword}
                />
                <Pressable style={styles.passwordToggle} onPress={onToggleShowPassword}>
                  <Text style={styles.passwordToggleText}>{showSignupPassword ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              onPress={onSignup}
              disabled={isSigningUp}>
              <Text style={[styles.primaryButtonText, styles.signupPrimaryButtonText]}>{isSigningUp ? 'Signing up...' : 'Continue to interests'}</Text>
            </Pressable>

            {signupError ? <Text style={styles.errorText}>{signupError}</Text> : null}

            <View style={styles.footerRow}>
              <Pressable onPress={onShowLogin}>
                <Text style={styles.linkText}>Already have an account? Log in</Text>
              </Pressable>
            </View>
          </LinearGradient>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
