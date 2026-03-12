import { Link, router } from 'expo-router';
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

export default function LoginScreen() {
  const { signInWithEmail } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    const result = await signInWithEmail(email.trim(), password);
    setLoading(false);

    if ('error' in result) {
      setError(result.error);
    }
    // Navigation handled by root layout session listener
  };

  return (
    <View style={styles.outerContainer}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Dark header section */}
          <View style={styles.header}>
            <View style={styles.logoMark}>
              <Text style={styles.logoSymbol}>Rx</Text>
            </View>
            <Text style={styles.logoText}>CMEase</Text>
            <Text style={styles.tagline}>CME tracking, effortless.</Text>
          </View>

          {/* White card bottom section */}
          <View style={styles.card}>
            <ScrollView
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.title}>Welcome back</Text>

              {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

              <Input
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

              <View style={styles.fieldGap} />

              <Input
                ref={passwordRef}
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                textContentType="password"
              />

              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity style={styles.forgotLink}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </Link>

              <View style={styles.fieldGap} />

              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                fullWidth
              />

              {/* Sign up link */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Link href="/(auth)/signup" asChild>
                  <TouchableOpacity>
                    <Text style={styles.footerLink}>Sign Up</Text>
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
  fieldGap: {
    height: theme.spacing[4],
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: theme.spacing[2],
  },
  forgotText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.plum,
    fontWeight: theme.fontWeight.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing[8],
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
});
