import { Link } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuthStore } from '../../lib/auth-store';
import { theme } from '../../lib/theme';

export default function SignupScreen() {
  const { signUpWithEmail } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const handleSignup = async () => {
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await signUpWithEmail(email.trim(), password, fullName.trim());
    setLoading(false);

    if ('error' in result) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.successSafe}>
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <CheckCircle size={40} color={theme.colors.success} />
          </View>
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successMessage}>
            We sent a confirmation link to {email}. Click it to activate your
            account, then sign in.
          </Text>
          <Link href="/(auth)/login" asChild>
            <Button
              title="Back to Sign In"
              variant="primary"
              fullWidth
              style={styles.backToLoginButton}
            />
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.outerContainer}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Dark header section */}
          <View style={styles.header}>
            <View style={styles.logoMark}>
              <Text style={styles.logoSymbol}>Rx</Text>
            </View>
            <Text style={styles.logoText}>CMEase</Text>
            <Text style={styles.tagline}>Join thousands of physicians staying compliant.</Text>
          </View>

          {/* White card bottom section */}
          <View style={styles.card}>
            <ScrollView
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.title}>Create account</Text>

              {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

              <Input
                label="Full Name"
                placeholder="Dr. Jane Smith"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                textContentType="name"
              />

              <View style={styles.gap} />

              <Input
                ref={emailRef}
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                textContentType="emailAddress"
              />

              <View style={styles.gap} />

              <Input
                ref={passwordRef}
                label="Password"
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                hint="8+ characters"
                textContentType="newPassword"
              />

              <View style={styles.gap} />

              <Input
                ref={confirmRef}
                label="Confirm Password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSignup}
                textContentType="newPassword"
              />

              <View style={styles.gap} />

              <Button
                title="Create Account"
                onPress={handleSignup}
                loading={loading}
                fullWidth
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text style={styles.footerLink}>Sign In</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: theme.colors.plumDark,
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  successSafe: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  flex: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[3],
  },
  logoSymbol: {
    color: theme.colors.white,
    fontSize: 28,
    fontWeight: theme.fontWeight.bold,
  },
  logoText: {
    fontSize: 32,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    marginTop: theme.spacing[1],
    textAlign: 'center',
    paddingHorizontal: theme.spacing[6],
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  scroll: {
    flexGrow: 1,
    paddingTop: theme.spacing[8],
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[8],
  },
  title: {
    fontSize: 22,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
    marginBottom: theme.spacing[6],
  },
  errorBanner: {
    backgroundColor: '#FDECEA',
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.error,
  },
  gap: {
    height: theme.spacing[4],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing[6],
  },
  footerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray500,
  },
  footerLink: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.plum,
    fontWeight: theme.fontWeight.semibold,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[8],
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[5],
  },
  successTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
    marginBottom: theme.spacing[3],
  },
  successMessage: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray500,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing[8],
  },
  backToLoginButton: {
    width: '100%',
  },
});
