import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import AccountTypeScreen from './src/screens/auth/AccountTypeScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ProfileSetupScreen from './src/screens/auth/ProfileSetupScreen';
import CreatorHomeScreen from './src/screens/creator/HomeScreen';
import ExplorerHomeScreen from './src/screens/explorer/HomeScreen';
import SearchScreen from './src/screens/shared/SearchScreen';
import SavedScreen from './src/screens/shared/SavedScreen';
import MapScreen from './src/screens/shared/MapScreen';
import ProfileScreen from './src/screens/creator/ProfileScreen';
import EditProfileScreen from './src/screens/creator/EditProfileScreen';
import NotificationsScreen from './src/screens/creator/NotificationsScreen';
import UserProfileScreen from './src/screens/shared/UserProfileScreen';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import CreatePostScreen from './src/screens/creator/CreatePostScreen';
import ErrorBoundary from './src/components/ErrorBoundary';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="Welcome"
            screenOptions={{
              headerShown: false,
              animation: 'none',
              contentStyle: { backgroundColor: '#232526' },
              cardStyle: { backgroundColor: '#232526' },
              presentation: 'modal',
              animationEnabled: false
            }}
          >
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="AccountType" component={AccountTypeScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
            <Stack.Screen 
              name="CreatorHome" 
              component={(props) => (
                <ErrorBoundary>
                  <CreatorHomeScreen {...props} />
                </ErrorBoundary>
              )}
            />
            <Stack.Screen name="ExplorerHome" component={ExplorerHomeScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="Saved" component={SavedScreen} />
            <Stack.Screen name="Map" component={MapScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="CreatePost" 
              component={CreatePostScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </NotificationProvider>
    </AuthProvider>
  );
}