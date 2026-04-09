import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PURPLE_500, styles } from '../styles';
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
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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
                onChangeText={(value) => onChangeField('first_name', value)}
              />
              <TextInput
                style={styles.inputHalf}
                placeholder="Last Name"
                placeholderTextColor={PURPLE_500}
                value={signupForm.last_name}
                onChangeText={(value) => onChangeField('last_name', value)}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={PURPLE_500}
              value={signupForm.username}
              onChangeText={(value) => onChangeField('username', value)}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={PURPLE_500}
              value={signupForm.email}
              onChangeText={(value) => onChangeField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Age"
              placeholderTextColor={PURPLE_500}
              value={signupForm.age}
              onChangeText={(value) => onChangeField('age', value)}
              keyboardType="number-pad"
            />
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor={PURPLE_500}
                value={signupForm.password}
                onChangeText={(value) => onChangeField('password', value)}
                secureTextEntry={!showSignupPassword}
              />
              <Pressable style={styles.passwordToggle} onPress={onToggleShowPassword}>
                <Text style={styles.passwordToggleText}>{showSignupPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Location (optional)"
              placeholderTextColor={PURPLE_500}
              value={signupForm.location}
              onChangeText={(value) => onChangeField('location', value)}
            />

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              onPress={onSignup}
              disabled={isSigningUp}>
              <Text style={styles.primaryButtonText}>{isSigningUp ? 'Signing up...' : 'Sign Up'}</Text>
            </Pressable>

            {signupError ? <Text style={styles.errorText}>{signupError}</Text> : null}

            <Pressable onPress={onShowLogin}>
              <Text style={styles.linkText}>Existing account? Log in</Text>
            </Pressable>
          </View>
        </>
      </ScrollView>
    </SafeAreaView>
  );
}
