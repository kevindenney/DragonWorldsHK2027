import * as Calendar from 'expo-calendar';
import { Alert, Platform, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import type { Activity } from '../data/scheduleData';

// Enhanced logging for debugging calendar issues
const logCalendarDebug = (message: string, data?: any) => {
};

const logCalendarError = (message: string, error?: any) => {
};

// Test expo-calendar module availability
const testCalendarModuleAvailability = () => {
  try {
    logCalendarDebug('Testing expo-calendar module availability');
    logCalendarDebug('Calendar module imported:', Calendar);
    logCalendarDebug('Calendar methods available:', Object.keys(Calendar));
    return true;
  } catch (error) {
    logCalendarError('Failed to access expo-calendar module', error);
    return false;
  }
};

export interface CalendarEvent {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  alarms?: Calendar.Alarm[];
}

/**
 * Request calendar permissions
 */
export const requestCalendarPermissions = async (): Promise<boolean> => {
  try {
    logCalendarDebug('Starting calendar permissions request');

    // Test module availability first
    if (!testCalendarModuleAvailability()) {
      logCalendarError('expo-calendar module not available');
      Alert.alert(
        'Calendar Error',
        'Calendar functionality is not available. Please check app configuration.',
        [{ text: 'OK' }]
      );
      return false;
    }

    logCalendarDebug('Checking current permission status');
    const currentStatus = await Calendar.getCalendarPermissionsAsync();
    logCalendarDebug('Current calendar permission status:', currentStatus);

    if (currentStatus.status === 'granted') {
      logCalendarDebug('Calendar permissions already granted');
      return true;
    }

    logCalendarDebug('Requesting calendar permissions');
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    logCalendarDebug('Permission request result:', { status });

    if (status !== 'granted') {
      logCalendarError('Calendar permissions denied', { status });
      Alert.alert(
        'Calendar Permission Required',
        'Please enable calendar access in Settings to add events.',
        [{ text: 'OK' }]
      );
      return false;
    }

    logCalendarDebug('Calendar permissions successfully granted');
    return true;
  } catch (error) {
    logCalendarError('Error requesting calendar permissions', error);

    // Check if this is the specific missing plist error
    if (error?.message?.includes('MissingCalendarPListValueException')) {
      Alert.alert(
        'Configuration Error',
        'Calendar feature requires app rebuild with proper configuration. Please contact support.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Calendar Error',
        'Unable to access calendar permissions. Please try again.',
        [{ text: 'OK' }]
      );
    }
    return false;
  }
};

/**
 * Get the default calendar ID
 */
export const getDefaultCalendarId = async (): Promise<string | null> => {
  try {
    const calendars = await Calendar.getCalendarsAsync();

    // Find the default calendar or the first writable calendar
    let defaultCalendar = calendars.find(
      cal => cal.source?.name === 'Default' && cal.allowsModifications
    );

    if (!defaultCalendar) {
      defaultCalendar = calendars.find(cal => cal.allowsModifications);
    }

    return defaultCalendar?.id || null;
  } catch (error) {
    return null;
  }
};

/**
 * Parse activity time string to get start and end dates
 */
export const parseActivityTime = (
  timeString: string,
  activityDate: string
): { startDate: Date; endDate: Date } => {
  // Parse the date (e.g., "Thursday, November 12, 2026")
  const dateMatch = activityDate.match(/(\w+), (\w+) (\d+), (\d+)/);
  if (!dateMatch) {
    throw new Error('Invalid date format');
  }

  const [, , monthName, day, year] = dateMatch;
  const monthIndex = new Date(`${monthName} 1, 2000`).getMonth();
  const baseDate = new Date(parseInt(year), monthIndex, parseInt(day));

  // Parse time (e.g., "14:00-18:00", "09:00", "19:00")
  const timeMatch = timeString.match(/(\d{1,2}):(\d{2})(?:-(\d{1,2}):(\d{2}))?/);
  if (!timeMatch) {
    throw new Error('Invalid time format');
  }

  const [, startHour, startMin, endHour, endMin] = timeMatch;

  const startDate = new Date(baseDate);
  startDate.setHours(parseInt(startHour), parseInt(startMin), 0, 0);

  const endDate = new Date(baseDate);
  if (endHour && endMin) {
    // Has end time
    endDate.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
  } else {
    // No end time, assume 1 hour duration
    endDate.setHours(parseInt(startHour) + 1, parseInt(startMin), 0, 0);
  }

  return { startDate, endDate };
};

/**
 * Create calendar event details from activity
 */
export const createCalendarEventFromActivity = (
  activity: Activity,
  activityDate: string
): CalendarEvent => {
  const { startDate, endDate } = parseActivityTime(activity.time, activityDate);

  const title = activity.calendarTitle || activity.activity;

  let notes = activity.calendarDescription || activity.detail || '';

  // Add additional information to notes
  if (activity.dressCode) {
    notes += `\n\nDress Code: ${activity.dressCode}`;
  }

  if (activity.bringItems && activity.bringItems.length > 0) {
    notes += `\n\nBring: ${activity.bringItems.join(', ')}`;
  }

  if (activity.prerequisites && activity.prerequisites.length > 0) {
    notes += `\n\nPrerequisites: ${activity.prerequisites.join(', ')}`;
  }

  if (activity.contactPerson) {
    notes += `\n\nContact: ${activity.contactPerson}`;
  }

  if (activity.registrationRequired) {
    notes += `\n\n⚠️ Registration Required`;
  }

  if (activity.maxParticipants) {
    notes += `\n\nCapacity: ${activity.maxParticipants} participants`;
  }

  // Add reminders based on activity type
  const alarms: Calendar.Alarm[] = [];

  if (activity.type === 'racing') {
    // 30 minutes before racing events
    alarms.push({ relativeOffset: -30 });
  } else if (activity.type === 'meeting') {
    // 15 minutes before meetings/briefings
    alarms.push({ relativeOffset: -15 });
  } else if (activity.type === 'social') {
    // 1 hour before social events
    alarms.push({ relativeOffset: -60 });
  } else {
    // 15 minutes before other events
    alarms.push({ relativeOffset: -15 });
  }

  return {
    title,
    startDate,
    endDate,
    location: activity.location,
    notes: notes.trim(),
    alarms,
  };
};

/**
 * Add activity to device calendar
 */
export const addActivityToCalendar = async (
  activity: Activity,
  activityDate: string
): Promise<boolean> => {
  try {
    logCalendarDebug('Starting addActivityToCalendar process');

    // Test module availability first
    if (!testCalendarModuleAvailability()) {
      logCalendarError('Calendar module not available, showing fallback options');
      showCalendarFallbackOptions(activity, activityDate);
      return false;
    }

    // Request permissions
    logCalendarDebug('Requesting calendar permissions');
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      logCalendarError('Calendar permissions not granted');
      return false;
    }

    // Get default calendar
    logCalendarDebug('Getting default calendar');
    const calendarId = await getDefaultCalendarId();
    if (!calendarId) {
      logCalendarError('No writable calendar found');
      Alert.alert(
        'Calendar Error',
        'No writable calendar found on this device.',
        [{ text: 'OK' }]
      );
      return false;
    }

    // Create event details
    logCalendarDebug('Creating event details');
    const eventDetails = createCalendarEventFromActivity(activity, activityDate);
    logCalendarDebug('Event details created:', eventDetails);

    // Create the calendar event
    logCalendarDebug('Creating calendar event');
    const eventId = await Calendar.createEventAsync(calendarId, {
      title: eventDetails.title,
      startDate: eventDetails.startDate,
      endDate: eventDetails.endDate,
      location: eventDetails.location,
      notes: eventDetails.notes,
      alarms: eventDetails.alarms,
    });

    if (eventId) {
      logCalendarDebug('Calendar event created successfully:', eventId);
      Alert.alert(
        'Event Added',
        `"${eventDetails.title}" has been added to your calendar.`,
        [{ text: 'OK' }]
      );
      return true;
    }

    logCalendarError('Failed to create calendar event - no eventId returned');
    return false;
  } catch (error) {
    logCalendarError('Error adding event to calendar', error);

    // Check if this is the specific missing plist error
    if (error?.message?.includes('MissingCalendarPListValueException')) {
      logCalendarError('Detected MissingCalendarPListValueException, showing fallback');
      showCalendarFallbackOptions(activity, activityDate);
    } else {
      Alert.alert(
        'Calendar Error',
        'Unable to add event to calendar. Please try again.',
        [{ text: 'OK' }]
      );
    }
    return false;
  }
};

/**
 * Check if calendar permissions are granted
 */
export const hasCalendarPermissions = async (): Promise<boolean> => {
  try {
    logCalendarDebug('Checking if calendar permissions are granted');
    const { status } = await Calendar.getCalendarPermissionsAsync();
    logCalendarDebug('Permission check result:', { status });
    return status === 'granted';
  } catch (error) {
    logCalendarError('Error checking calendar permissions', error);
    return false;
  }
};

/**
 * Test calendar module and log diagnostic information
 */
export const testCalendarModule = async (): Promise<void> => {
  logCalendarDebug('=== Calendar Module Diagnostic Test ===');

  try {
    // Test 1: Module availability
    logCalendarDebug('Test 1: Module availability');
    const moduleAvailable = testCalendarModuleAvailability();
    logCalendarDebug('Module availability result:', moduleAvailable);

    if (!moduleAvailable) {
      logCalendarError('Module not available, aborting further tests');
      return;
    }

    // Test 2: Permission status check
    logCalendarDebug('Test 2: Permission status check');
    try {
      const permissionStatus = await Calendar.getCalendarPermissionsAsync();
      logCalendarDebug('Permission status:', permissionStatus);
    } catch (error) {
      logCalendarError('Permission status check failed', error);
    }

    // Test 3: Calendar list attempt
    logCalendarDebug('Test 3: Calendar list attempt');
    try {
      const calendars = await Calendar.getCalendarsAsync();
      logCalendarDebug('Available calendars:', calendars.length);
      logCalendarDebug('Calendar details:', calendars.map(cal => ({
        id: cal.id,
        title: cal.title,
        source: cal.source?.name,
        allowsModifications: cal.allowsModifications
      })));
    } catch (error) {
      logCalendarError('Calendar list failed', error);
    }

    logCalendarDebug('=== End Calendar Diagnostic Test ===');
  } catch (error) {
    logCalendarError('Diagnostic test failed', error);
  }
};

/**
 * Show fallback options when calendar integration isn't working
 */
const showCalendarFallbackOptions = (activity: Activity, activityDate: string) => {
  const eventDetails = createCalendarEventFromActivity(activity, activityDate);

  const formatEventText = () => {
    const startTime = eventDetails.startDate.toLocaleString();
    const endTime = eventDetails.endDate.toLocaleString();

    return `📅 ${eventDetails.title}
🕐 ${startTime} - ${endTime}
📍 ${eventDetails.location || 'Location TBD'}
${eventDetails.notes ? `\n📝 ${eventDetails.notes}` : ''}`;
  };

  Alert.alert(
    'Calendar Integration Unavailable',
    'The calendar feature is currently not available. Would you like to copy the event details instead?',
    [
      {
        text: 'Copy Event Details',
        onPress: async () => {
          try {
            await Clipboard.setStringAsync(formatEventText());
            Alert.alert(
              'Event Copied',
              'Event details have been copied to your clipboard. You can paste them into your calendar app.',
              [{ text: 'OK' }]
            );
          } catch (error) {
            logCalendarError('Failed to copy to clipboard', error);
            Alert.alert(
              'Copy Failed',
              'Unable to copy event details. Please manually add the event to your calendar.',
              [{ text: 'OK' }]
            );
          }
        }
      },
      {
        text: 'Open Calendar App',
        onPress: () => {
          try {
            // Try to open the default calendar app
            Linking.openURL('calshow://');
          } catch (error) {
            logCalendarError('Failed to open calendar app', error);
            Alert.alert(
              'Calendar App',
              'Please manually open your calendar app and add the event.',
              [{ text: 'OK' }]
            );
          }
        }
      },
      {
        text: 'Cancel',
        style: 'cancel'
      }
    ]
  );
};