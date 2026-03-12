import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { supabase } from '../../lib/supabase';
import { theme } from '../../lib/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: 'cmease://reset-password' }
    );
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a reset link.
            </Text>

            {sent ? (
              <View style={styles.sentContainer}>
                <Text style={styles.sentText}>
                  ✓ Reset link sent! Check your email at {email}.
                </Text>
              </View>
            ) : (
              <>
                {error ? (
                  <Text style={styles.errorBanner}>{error}</Text>
                ) : null}

                <Input
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleReset}
                />

                <View style={styles.gap} />

                <Button
                  title="Send Reset Link"
                  onPress={handleReset}
                  loading={loading}
                  fullWidth
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[8],
    paddingTop: theme.spacing[4],
  },
  backButton: {
    marginBottom: theme.spacing[6],
  },
  backText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.plum,
    fontWeight: theme.fontWeight.medium,
  },
  content: {},
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray500,
    marginBottom: theme.spacing[6],
    lineHeight: 24,
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
  sentContainer: {
    backgroundColor: '#E8F5EE',
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.success,
  },
  sentText: {
    color: theme.colors.success,
    fontSize: theme.fontSize.md,
    lineHeight: 22,
  },
});
