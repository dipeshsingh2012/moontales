import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen() {
  const { signInWithEmail, signUpWithEmail, signInAsGuest } = useAuth();
  const { colors } = useTheme();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handle = async () => {
    const e = email.trim();
    const p = password.trim();
    if (!e || !p) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(e, p);
      } else {
        await signInWithEmail(e, p);
      }
    } catch (err) {
      Alert.alert('Auth error', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.moon}>🌙</Text>
        <Text style={styles.title}>MoonTales</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isSignUp ? 'Create an account' : 'Welcome back'}
        </Text>

        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          placeholder="Email"
          placeholderTextColor={colors.placeholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          placeholder="Password"
          placeholderTextColor={colors.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={handle}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(v => !v)} style={{ marginTop: 20 }}>
          <Text style={[styles.toggle, { color: colors.textSecondary }]}>
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.guestBtn, { borderColor: colors.primary }]}
          onPress={() => signInAsGuest()}
        >
          <Text style={[styles.guestBtnText, { color: colors.primary }]}>
            ✨ Continue in Dev / Guest Mode
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner:     { flex: 1, justifyContent: 'center', padding: 32 },
  moon:      { fontSize: 64, textAlign: 'center', marginBottom: 8 },
  title:     { fontSize: 36, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 4 },
  subtitle:  { fontSize: 16, textAlign: 'center', marginBottom: 32 },
  input: {
    borderRadius: 16, padding: 14, fontSize: 16,
    marginBottom: 12,
  },
  btn: {
    borderRadius: 20, paddingVertical: 16, alignItems: 'center',
    marginTop: 8, elevation: 6,
    shadowColor: '#a855f7', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8,
  },
  btnText:  { color: '#fff', fontSize: 18, fontWeight: '900' },
  toggle:   { textAlign: 'center', fontSize: 14 },
  guestBtn: {
    marginTop: 24,
    borderWidth: 1.5,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 209, 102, 0.08)',
  },
  guestBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
