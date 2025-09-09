import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  // Add other stack screens here as needed
};

export type MainTabParamList = {
  Live: undefined;
  Weather: undefined;
  Map: undefined;
  Schedule: undefined;
  Social: undefined;
  Services: undefined;
};

export type RootStackScreenProps<Screen extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, Screen>;

export type MainTabScreenProps<Screen extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, Screen>,
    StackScreenProps<RootStackParamList>
  >;

// Individual screen props for type safety
export type LiveScreenProps = MainTabScreenProps<'Live'>;
export type WeatherScreenProps = MainTabScreenProps<'Weather'>;
export type MapScreenProps = MainTabScreenProps<'Map'>;
export type ScheduleScreenProps = MainTabScreenProps<'Schedule'>;
export type SocialScreenProps = MainTabScreenProps<'Social'>;
export type ServicesScreenProps = MainTabScreenProps<'Services'>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}