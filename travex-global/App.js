import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors } from './src/theme/theme';

// Auth
import SignInScreen from './src/screens/auth/SignInScreen';
import FinalizeSignupScreen from './src/screens/auth/FinalizeSignupScreen';

// Onglets
import HomeScreen from './src/screens/home/HomeScreen';
import ReservationsScreen from './src/screens/tabs/ReservationsScreen';
import AnoncesScreen from './src/screens/tabs/AnoncesScreen';
import MessagesScreen from './src/screens/tabs/MessagesScreen';
import ProfileScreen from './src/screens/tabs/ProfileScreen';

// Détail & autres écrans
import TripDetailScreen from './src/screens/detail/TripDetailScreen';
import PublishTripScreen from './src/screens/publish/PublishTripScreen';
import PersonalInfoScreen from './src/screens/profile/PersonalInfoScreen';
import PaymentScreen from './src/screens/profile/PaymentScreen';
import NotificationSettingsScreen from './src/screens/profile/NotificationSettingsScreen';
import SecurityScreen from './src/screens/profile/SecurityScreen';
import LanguageScreen from './src/screens/profile/LanguageScreen';
import RatingsScreen from './src/screens/profile/RatingsScreen';
import SupportScreen from './src/screens/profile/SupportScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Accueil: 'home',
  Réservations: 'book',
  Annonces: 'list',
  Messages: 'chatbubble-ellipses',
  Profil: 'person',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={focused ? TAB_ICONS[route.name] : `${TAB_ICONS[route.name]}-outline`}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Réservations" component={ReservationsScreen} />
      <Tab.Screen name="Annonces" component={AnoncesScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="FinalizeSignup" component={FinalizeSignupScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="TripDetail" component={TripDetailScreen} />
          <Stack.Screen name="PublishTrip" component={PublishTripScreen} />
          <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
          <Stack.Screen name="Security" component={SecurityScreen} />
          <Stack.Screen name="Language" component={LanguageScreen} />
          <Stack.Screen name="Ratings" component={RatingsScreen} />
          <Stack.Screen name="Support" component={SupportScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
