import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
  Register: undefined;
  UnifiedAuth: { mode?: 'signin' | 'signup' } | undefined;
  ForgotPassword: undefined;
  CompetitorDetail: {
    sailNumber: string;
    competitorData: any;
    standings: any;
  };
  // Add other stack screens here as needed
};

export type MainTabParamList = {
  Map: undefined;
  Schedule: { date?: string; eventId?: string } | undefined;
  Results: undefined;
  NoticeBoard: { eventId: string };
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
export type MapScreenProps = MainTabScreenProps<'Map'>;
export type ScheduleScreenProps = MainTabScreenProps<'Schedule'>;
export type ResultsScreenProps = MainTabScreenProps<'Results'>;
export type NoticeBoardScreenProps = MainTabScreenProps<'NoticeBoard'>;
export type MoreScreenProps = MainTabScreenProps<'More'>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}