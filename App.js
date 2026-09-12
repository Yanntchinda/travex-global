import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Dimensions, Platform } from 'react-native';
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
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
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
import AnnoncesScreen from './src/screens/tabs/AnnoncesScreen';
import MessagesScreen from './src/screens/tabs/MessagesScreen';
import ProfileScreen from './src/screens/tabs/ProfileScreen';

// Détail & autres écrans
import TripDetailScreen from './src/screens/detail/TripDetailScreen';
import DemandDetailScreen from './src/screens/detail/DemandDetailScreen';
import TravelerProfileScreen from './src/screens/detail/TravelerProfileScreen';
import ReportScreen from './src/screens/report/ReportScreen';
import PublishTripScreen from './src/screens/publish/PublishTripScreen';
import PersonalInfoScreen from './src/screens/profile/PersonalInfoScreen';
import ChangeStatusScreen from './src/screens/profile/ChangeStatusScreen';
import PaymentScreen from './src/screens/profile/PaymentScreen';
import PaymentsHistoryScreen from './src/screens/profile/PaymentsHistoryScreen';
import EarningsScreen from './src/screens/profile/EarningsScreen';
import AddPaymentMethodScreen from './src/screens/profile/AddPaymentMethodScreen';
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
      // freezeOnBlur: un écran gelé (react-native-screens) ne re-rend pas quand
      // son statut actif/inactif change : ses pointer-events restent périmés et
      // l'écran précédent CAPTE les clics après un retour d'onglet (web + app).
      freezeOnBlur={false}
      lazy={false}
      // Sur web, react-native-screens détache les écrans inactifs (activityState)
      // et ne resta pas toujours leurs pointer-events au retour d'onglet :
      // l'écran restait figé sous celui d'avant. On désactive ce détachement.
      detachInactiveScreens={false}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Réservations" component={ReservationsScreen} />
      <Tab.Screen name="Annonces" component={AnnoncesScreen} />
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
      <Stack.Screen name="TravelerProfile" component={TravelerProfileScreen} />
      <Stack.Screen name="Report" component={ReportScreen} />
      <Stack.Screen name="PublishTrip" component={PublishTripScreen} />
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      <Stack.Screen name="Admin" component={AdminScreen} />
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      <Stack.Screen name="ChangeStatus" component={ChangeStatusScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="PaymentsHistory" component={PaymentsHistoryScreen} />
      <Stack.Screen name="Earnings" component={EarningsScreen} />
      <Stack.Screen name="AddPaymentMethod" component={AddPaymentMethodScreen} />
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

// Mise à jour OTA (EAS Update) : au démarrage sur mobile, l'app vérifie si une
// nouvelle version JS est disponible et la recharge automatiquement.
// (Désactivé sur web : l'aperçu web est reconstruit à chaque déploiement.)
function OtaUpdater() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      try {
        const Updates = require('expo-updates');
        if (!Updates.isEnabled?.() && !Updates.checkForUpdateAsync) return;
        const res = await Updates.checkForUpdateAsync();
        if (res && res.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (e) {
        // Pas de mise à jour disponible ou pas de réseau : silencieux.
      }
    })();
  }, []);
  return null;
}

// Capsule de notification réservée aux utilisateurs connectés :
// rien ne s'affiche sur l'écran de connexion / inscription.
function NotificationIsland() {
  const { user } = useAuth();
  if (!user) return null;
  return <DynamicIsland />;
}

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <LanguageProvider>
        <AuthProvider>
          <ThemeProvider>
            <AppBody />
          </ThemeProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

// Corps de l'app : quand le thème change, le contexte change de valeur →
// tout l'arbre se re-rend SANS être démonté : chaque écran relit ses styles
// (mutés par applyTheme/swapSheets), la navigation et les modales ouvertes
// sont conservées, pas de flash blanc ni de retour forcé à l'accueil.
function AppBody() {
  useTheme();
  return (
    <>
      <NavigationContainer>
            <View style={{ flex: 1 }}>
              <RootNavigator />
              {/* Capsule de notification « Dynamic Island » (temps réel, par-dessus l'app) */}
              <NotificationIsland />
            </View>
      </NavigationContainer>
      <OtaUpdater />
    </>
  );
}
