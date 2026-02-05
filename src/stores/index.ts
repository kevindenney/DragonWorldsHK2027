// Zustand Store Index - Dragon World Championships App
// Centralized export of all application stores with TypeScript support

// Local imports for store functions used in this file
import { useScheduleStore as _useScheduleStore } from './scheduleStore';
import { useWeatherStore as _useWeatherStore } from './weatherStore';
import { useSocialStore as _useSocialStore } from './socialStore';
import { useResultsStore as _useResultsStore } from './resultsStore';
import { useSponsorStore as _useSponsorStore } from './sponsorStore';
import { useUserStore as _useUserStore } from './userStore';

// Local references for internal use
const useScheduleStore = _useScheduleStore;
const useWeatherStore = _useWeatherStore;
const useSocialStore = _useSocialStore;
const useResultsStore = _useResultsStore;
const useSponsorStore = _useSponsorStore;
const useUserStore = _useUserStore;

// Store exports
export { useScheduleStore } from './scheduleStore';
export type { 
  Event, 
  Race, 
  RaceResult, 
  EventType, 
  SelectedEvent 
} from './scheduleStore';

export { useWeatherStore } from './weatherStore';
export type { 
  WeatherCondition, 
  MarineCondition, 
  WeatherForecast, 
  WeatherAlert,
  WeatherFeature,
  ParticipantStatus 
} from './weatherStore';

export { useSocialStore } from './socialStore';
export type { 
  WhatsAppGroup, 
  ActiveDiscussion, 
  SailingConnection,
  GroupCategory,
  VerificationStatus 
} from './socialStore';

export { useResultsStore } from './resultsStore';
export type { 
  Competitor, 
  RaceResult as ResultsRaceResult,
  SeriesStanding, 
  Championship 
} from './resultsStore';

export { useSponsorStore } from './sponsorStore';
export type { 
  Sponsor, 
  SponsorService, 
  SponsorConfiguration,
  SponsorCategory,
  ServiceType 
} from './sponsorStore';

export { useUserStore } from './userStore';
export type { 
  UserProfile, 
  UserPreferences, 
  SailingExperience,
  Subscription,
  Achievement 
} from './userStore';

// Selector hooks - Schedule
export {
  useEvents,
  useRaces,
  useSelectedEvent,
  useScheduleLoading,
  useScheduleError,
  useCurrentRaces,
  useTodaysEvents,
  useUpcomingEvents
} from './scheduleStore';

// Selector hooks - Weather
export {
  useCurrentWeather,
  useCurrentMarine,
  useWeatherForecasts,
  useWeatherAlerts,
  useSubscriptionStatus,
  useWeatherLoading,
  useWeatherError,
  useAccessLevel,
  useCanAccessFeature,
  useTrialStatus,
  useQueryStatus
} from './weatherStore';

// Selector hooks - Social
export {
  useWhatsAppGroups,
  useJoinedGroups,
  useActiveDiscussions,
  useSailingConnections,
  useSocialLoading,
  useSocialError,
  useGroupsByCategory,
  useAvailableGroups,
  useConnectionsByRole,
  useLiveDiscussions,
  useGroupStats
} from './socialStore';

// Selector hooks - Results
export {
  useCompetitors,
  useRaces as useResultsRaces,
  useOverallStandings,
  useCurrentRace,
  useResultsLoading,
  useResultsError,
  useTopStandings,
  useCompetitorStanding,
  useRaceLeaderboard,
  useCompletedRaces,
  useChampionshipInfo
} from './resultsStore';

// Selector hooks - Sponsor
export {
  useSponsors,
  useActiveConfiguration,
  useSponsorServices,
  useSponsorLoading,
  useSponsorError,
  useTitleSponsor,
  useMajorSponsors,
  useAlignedPartners,
  useBrandingConfig,
  usePrimaryBrandColor,
  useAccentBrandColor,
  useServicesByType,
  useLogosByLocation,
  useSponsorContacts
} from './sponsorStore';

// Selector hooks - User
export {
  useUserProfile,
  useUserPreferences,
  useIsAuthenticated,
  useSailingNetwork,
  useUserAchievements,
  useUserLoading,
  useUserError,
  useActiveSubscription,
  useConnectionsByType,
  useAchievementsByCategory,
  useUserSailingExperience,
  useVerificationStatus,
  useParticipantStatus
} from './userStore';

// Store initialization helper
export const initializeStores = () => {
  // Initialize all stores with default data
  // This can be called on app startup
  
  // Refresh essential data
  useScheduleStore.getState().refreshSchedule();
  useWeatherStore.getState().refreshWeather();
  useSocialStore.getState().refreshGroups();
  useResultsStore.getState().refreshResults();
  useSponsorStore.getState().refreshSponsorData();
};

// Store reset helper for testing/development
export const resetAllStores = () => {
  useScheduleStore.getState().clearEvents();
  useSocialStore.getState().clearSocialData();
  useResultsStore.getState().clearResults();
  useSponsorStore.getState().clearSponsorData();
  useUserStore.getState().clearUserData();
};

// Sync helper for offline/online state management
export const syncStores = async () => {
  const promises = [
    useScheduleStore.getState().refreshSchedule(),
    useWeatherStore.getState().refreshWeather(),
    useSocialStore.getState().refreshGroups(),
    useResultsStore.getState().refreshResults(),
    useSponsorStore.getState().refreshSponsorData(),
    useUserStore.getState().refreshUserData()
  ];
  
  try {
    await Promise.allSettled(promises);
  } catch (error) {
  }
};