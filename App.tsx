import React from 'react';
import { StatusBar } from 'react-native';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { StoryProvider } from './src/context/StoryContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <StoryProvider>
            <StatusBar barStyle="light-content" />
            <AppNavigator />
          </StoryProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);

