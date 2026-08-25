import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "@/auth/AuthProvider";
import { colors } from "@/theme/tokens";
import type {
  AuthStackParamList,
  RootStackParamList,
  TabParamList,
} from "./types";
import { BottomTabBar } from "@/components/BottomTabBar";
import { Screen } from "@/components/Screen";
import { StateView } from "@/components/StateView";
import { OnboardingScreen } from "@/features/onboarding/OnboardingScreen";
import { AuthChoiceScreen } from "@/features/onboarding/AuthChoiceScreen";
import { LoginScreen } from "@/features/auth/LoginScreen";
import { RegisterScreen } from "@/features/auth/RegisterScreen";
import { HomeScreen } from "@/features/home/HomeScreen";
import { CalendarScreen } from "@/features/calendar/CalendarScreen";
import { WorkoutLibraryScreen } from "@/features/workouts/WorkoutLibraryScreen";
import { WorkoutFormScreen } from "@/features/workouts/WorkoutFormScreen";
import { ProfileScreen } from "@/features/profile/ProfileScreen";
import { WorkoutPreviewScreen } from "@/features/execution/WorkoutPreviewScreen";
import { TimerSetupScreen } from "@/features/execution/TimerSetupScreen";
import { ActiveWorkoutScreen } from "@/features/execution/ActiveWorkoutScreen";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();
const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.background,
    primary: colors.primary,
    text: colors.text,
    border: colors.border,
  },
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <AuthStack.Screen name="GetStarted" component={OnboardingScreen} />
      <AuthStack.Screen name="AuthChoice" component={AuthChoiceScreen} />
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ animation: "slide_from_bottom" }}
      />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ animation: "slide_from_bottom" }}
      />
    </AuthStack.Navigator>
  );
}
function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Gym Calendar" component={CalendarScreen} />
      <Tabs.Screen name="Gym Report" component={WorkoutLibraryScreen} />
    </Tabs.Navigator>
  );
}
function AppNavigator() {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <RootStack.Screen name="Tabs" component={MainTabs} />
      <RootStack.Screen name="Profile" component={ProfileScreen} />
      <RootStack.Screen name="WorkoutForm" component={WorkoutFormScreen} />
      <RootStack.Screen
        name="WorkoutPreview"
        component={WorkoutPreviewScreen}
      />
      <RootStack.Screen name="TimerSetup" component={TimerSetupScreen} />
      <RootStack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{ gestureEnabled: false }}
      />
    </RootStack.Navigator>
  );
}

export function RootNavigator() {
  const { user, isBootstrapping, bootstrapError, retryBootstrap } = useAuth();
  if (isBootstrapping)
    return (
      <Screen>
        <StateView kind="loading" />
      </Screen>
    );
  if (bootstrapError)
    return (
      <Screen>
        <StateView
          kind="error"
          title="Unable to restore your session"
          message={bootstrapError}
          onRetry={retryBootstrap}
        />
      </Screen>
    );
  return (
    <NavigationContainer theme={theme}>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
