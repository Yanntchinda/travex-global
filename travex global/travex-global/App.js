import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Dimensions, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, surface } from './src/theme/theme';

// Sur le web, les métriques initiales sont absentes : on les fournit pour éviter
// l'erreur « No safe area value available » au premier rendu.
const initialMetrics = {
  insets: { top: 0, bottom: 0, left: 0, right: 0 },
  frame: {
    x: 0,
    y: 0,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
};

import HomeScreen from './src/screens/HomeScreen';
import ModeScreen from './src/screens/ModeScreen';
import TripDetailScreen from './src/screens/TripDetailScreen';
import BookScreen from './src/screens/BookScreen';
import BookingConfirmedScreen from './src/screens/BookingConfirmedScreen';
import AdminLoginScreen from './src/screens/AdminLoginScreen';
import AdminScreen from './src/screens/AdminScreen';
import AccountScreen from './src/screens/AccountScreen';
import MyBookingsScreen from './src/screens/MyBookingsScreen';
import LoginScreen from './src/screens/LoginScreen';
import { getSessionInfo } from './src/services/store';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: surface.card, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Accueil"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Avions"
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="airplane-outline" size={size} color={color} /> }}
      >
        {(props) => <ModeScreen {...props} mode="Avion" />}
      </Tab.Screen>
      <Tab.Screen
        name="Cargo"
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} /> }}
      >
        {(props) => <ModeScreen {...props} mode="Cargo" />}
      </Tab.Screen>
      <Tab.Screen
        name="RO-RO"
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="boat-outline" size={size} color={color} /> }}
      >
        {(props) => <ModeScreen {...props} mode="RO-RO" />}
      </Tab.Screen>
      <Tab.Screen
        name="Réservations"
        component={MyBookingsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Compte"
        component={AccountScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  // Premier écran : la page de connexion, sauf si une session est déjà ouverte.
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    getSessionInfo()
      .then((info) => setInitialRoute(info.role ? 'Main' : 'Login'))
      .catch(() => setInitialRoute('Login'));
  }, []);

  return (
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <NavigationContainer>
        {initialRoute === null ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: surface.bg }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="TripDetail" component={TripDetailScreen} />
            <Stack.Screen name="Book" component={BookScreen} />
            <Stack.Screen name="BookingConfirmed" component={BookingConfirmedScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
            <Stack.Screen name="Admin" component={AdminScreen} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
