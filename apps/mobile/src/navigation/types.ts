import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  GetStarted: undefined;
  AuthChoice: undefined;
  Login: undefined;
  Register: undefined;
};

export type TabParamList = {
  Home: undefined;
  "Gym Calendar": undefined;
  "Gym Report": undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Profile: undefined;
  WorkoutForm: { workoutId?: string } | undefined;
  WorkoutPreview: { date: string };
  TimerSetup: { date: string };
  ActiveWorkout: { date: string; restSeconds: number };
};
