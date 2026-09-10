import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Sur le web, `initialWindowMetrics` est null, donc le provider démarre avec
// insets = null et SafeAreaView lève l'erreur "No safe area value available"
// au premier rendu. On fournit des métriques initiales pour éviter ce course condition.
const initialMetrics = {
  insets: { top: 0, bottom: 0, left: 0, right: 0 },
  frame: {
    x: 0,
    y: 0,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
};

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { colors } from './src/theme/theme';
import FloatingTabBar from './src/components/FloatingTabBar';
import DynamicIsland from './src/components/DynamicIsland';

// Auth — l'app ouvre directement la page de connexion (le choix de langue
// se fait depuis la pastille de langue de cette page).
import SignInScreen from './src/screens/auth/SignInScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Onglets
import HomeScreen from './src/screens/home/HomeScreen';
import ReservationsScreen from './src/screens/tabs/ReservationsScreen';
import AnoncesScreen from './src/screens/tabs/AnoncesScreen';
import MessagesScreen from './src/screens/tabs/MessagesScreen';
import ProfileScreen from './src/screens/tabs/ProfileScreen';

// Détail & autres écrans
import TripDetailScreen from './src/screens/detail/TripDetailScreen';
import DemandDetailScreen from './src/screens/detail/DemandDetailScreen';
import PublishTripScreen from './src/screens/publish/PublishTripScreen';
import PersonalInfoScreen from './src/screens/profile/PersonalInfoScreen';
import PaymentScreen from './src/screens/profile/PaymentScreen';
import NotificationSettingsScreen from './src/screens/profile/NotificationSettingsScreen';
import SecurityScreen from './src/screens/profile/SecurityScreen';
import LanguageScreen from './src/screens/profile/LanguageScreen';
import RatingsScreen from './src/screens/profile/RatingsScreen';
import SupportScreen from './src/screens/profile/SupportScreen';
import TermsScreen from './src/screens/profile/TermsScreen';
import PrivacyScreen from './src/screens/profile/PrivacyScreen';
import FaqScreen from './src/screens/profile/FaqScreen';
import NotificationsScreen from './src/screens/profile/NotificationsScreen';

// Admin
import AdminLoginScreen from './src/screens/admin/AdminLoginScreen';
import AdminScreen from './src/screens/admin/AdminScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
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
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Plus d'écran de langue intermédiaire : on va directement à la connexion.

  return (
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={user ? 'Main' : 'SignIn'}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} />
      <Stack.Screen name="DemandDetail" component={DemandDetailScreen} />
      <Stack.Screen name="PublishTrip" component={PublishTripScreen} />
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      <Stack.Screen name="Admin" component={AdminScreen} />
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="Language" component={LanguageScreen} />
      <Stack.Screen name="Ratings" component={RatingsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="Faq" component={FaqScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <LanguageProvider>
        <AuthProvider>
          <NavigationContainer>
            <View style={{ flex: 1 }}>
              <RootNavigator />
              {/* Capsule de notification « Dynamic Island » (temps réel, par-dessus l'app) */}
              <DynamicIsland />
            </View>
          </NavigationContainer>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
