import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
  Register: undefined;
  UnifiedAuth: { mode?: 'signin' | 'signup' } | undefined;
  ForgotPassword: undefined;
  Profile: undefined;
  CompetitorDetail: {
    sailNumber: string;
    competitorData: any;
    standings: any;
  };
  Map: { locationId?: string } | undefined;
  Weather: undefined;
  Contacts: undefined;
  Sponsors: undefined;
  AboutRegattaFlow: undefined;
  Entrants: undefined;
  Shipping: undefined;
  RaceForms: undefined;
  Services: undefined;
  RacingRules: undefined;
};

export type MainTabParamList = {
  Schedule: { date?: string; eventId?: string } | undefined;
  NoticeBoard: { eventId: string };
  Results: undefined;
  Forms: undefined;
  More: undefined;
};

export type RootStackScreenProps<Screen extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, Screen>;

export type MainTabScreenProps<Screen extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, Screen>,
    StackScreenProps<RootStackParamList>
  >;

// Individual screen props for type safety
export type ScheduleScreenProps = MainTabScreenProps<'Schedule'>;
export type NoticeBoardScreenProps = MainTabScreenProps<'NoticeBoard'>;
export type ResultsScreenProps = MainTabScreenProps<'Results'>;
export type FormsScreenProps = MainTabScreenProps<'Forms'>;
export type MoreScreenProps = MainTabScreenProps<'More'>;

// Props for screens that moved to More stack
export type MapScreenProps = StackScreenProps<RootStackParamList, 'Map'>;
export type EntrantsScreenProps = StackScreenProps<RootStackParamList, 'MainTabs'>;
export type ShippingScreenProps = StackScreenProps<RootStackParamList, 'MainTabs'>;
export type WeatherScreenProps = StackScreenProps<RootStackParamList, 'Weather'>;
export type SocialScreenProps = StackScreenProps<RootStackParamList, 'MainTabs'>;
export type ServicesScreenProps = StackScreenProps<RootStackParamList, 'MainTabs'>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}