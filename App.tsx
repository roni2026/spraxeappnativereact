import 'react-native-url-polyfill/auto';
import './src/i18n';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import ErrorBoundary from './src/components/ErrorBoundary';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { CompareProvider } from './src/context/CompareContext';
import RootNavigator from './src/navigation/RootNavigator';
import { navTheme } from './src/theme/theme';

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <CartProvider>
            <CompareProvider>
              <NavigationContainer theme={navTheme}>
                <StatusBar style="dark" />
                <RootNavigator />
              </NavigationContainer>
            </CompareProvider>
          </CartProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
