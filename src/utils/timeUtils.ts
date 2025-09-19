/**
 * Time utilities for chart display with local timezone support
 *
 * Provides consistent time formatting across all weather charts with proper
 * local timezone context for Hong Kong sailing conditions.
 */

export interface TimeFormatOptions {
  showTimezone?: boolean;
  showDate?: boolean;
  use24Hour?: boolean;
  shortFormat?: boolean;
}

/**
 * Formats a timestamp or hour for chart display with local time context
 */
export const formatChartTime = (
  input: string | number | Date,
  options: TimeFormatOptions = {}
): string => {
  const {
    showTimezone = true,
    showDate = false,
    use24Hour = false,
    shortFormat = true
  } = options;

  let date: Date;

  // Handle different input types
  if (typeof input === 'string') {
    // If it's a time string like "15:00" or "3 PM", create date for today
    if (input.includes(':') || input.includes('AM') || input.includes('PM')) {
      date = new Date();
      // Parse the time string and set the hours
      if (input.includes(':')) {
        const [hours, minutes] = input.split(':').map(Number);
        date.setHours(hours, minutes || 0, 0, 0);
      } else {
        // Handle "3 PM" format
        const timeMatch = input.match(/(\d+)\s*(AM|PM)/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          if (timeMatch[2].toUpperCase() === 'PM' && hours !== 12) hours += 12;
          if (timeMatch[2].toUpperCase() === 'AM' && hours === 12) hours = 0;
          date.setHours(hours, 0, 0, 0);
        } else {
          date = new Date();
        }
      }
    } else {
      // Assume it's an ISO string
      date = new Date(input);
    }
  } else if (typeof input === 'number') {
    // Assume it's hours (0-23)
    date = new Date();
    date.setHours(input, 0, 0, 0);
  } else {
    date = input;
  }

  // Validate the date
  if (!date || isNaN(date.getTime())) {
    console.warn('Invalid date provided to formatChartTime:', input);
    return 'Invalid Time';
  }

  // Get Hong Kong timezone offset
  const hkDate = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Hong_Kong"}));
  const localDate = new Date(date.toLocaleString("en-US"));
  const timezoneOffset = (hkDate.getTime() - localDate.getTime()) / (1000 * 60 * 60);

  // Format the time
  let timeString: string;
  try {
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      hour: use24Hour ? '2-digit' : 'numeric',
      minute: shortFormat ? undefined : '2-digit',
      hour12: !use24Hour,
      timeZone: 'Asia/Hong_Kong'
    });

    timeString = timeFormatter.format(date);
  } catch (error) {
    console.warn('Error formatting time:', error, 'Input:', input);
    return 'Time Error';
  }

  // Simplify format for charts
  if (shortFormat) {
    timeString = timeString.replace(':00', '').replace(' ', '');
  }

  // Add timezone if requested
  if (showTimezone) {
    const timezoneString = timezoneOffset >= 0 ? `+${timezoneOffset}` : `${timezoneOffset}`;
    timeString += ` (HKT)`;
  }

  // Add date if requested
  if (showDate) {
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Hong_Kong'
    });
    const dateString = dateFormatter.format(date);
    timeString = `${dateString} ${timeString}`;
  }

  return timeString;
};

/**
 * Formats current time for "NOW" indicators
 */
export const formatCurrentTime = (): string => {
  return formatChartTime(new Date(), {
    showTimezone: true,
    use24Hour: false,
    shortFormat: true
  });
};

/**
 * Converts UTC timestamp to Hong Kong local time
 */
export const toHongKongTime = (utcTime: string | Date): Date => {
  const date = typeof utcTime === 'string' ? new Date(utcTime) : utcTime;
  return new Date(date.toLocaleString("en-US", {timeZone: "Asia/Hong_Kong"}));
};

/**
 * Gets the current Hong Kong time
 */
export const getHongKongTime = (): Date => {
  return toHongKongTime(new Date());
};

/**
 * Formats a time difference for chart annotations
 */
export const formatTimeDifference = (startTime: Date, endTime: Date): string => {
  const diffMs = endTime.getTime() - startTime.getTime();
  const diffHours = Math.abs(diffMs) / (1000 * 60 * 60);

  if (diffHours < 1) {
    const diffMinutes = Math.abs(diffMs) / (1000 * 60);
    return `${Math.round(diffMinutes)}m`;
  } else if (diffHours < 24) {
    return `${Math.round(diffHours)}h`;
  } else {
    const diffDays = diffHours / 24;
    return `${Math.round(diffDays)}d`;
  }
};

/**
 * Creates a time series for chart labels with proper spacing
 */
export const createTimeLabels = (
  startTime: Date,
  hours: number,
  intervalHours: number = 3
): string[] => {
  const labels: string[] = [];
  const currentTime = new Date(startTime);

  for (let i = 0; i <= hours; i += intervalHours) {
    const labelTime = new Date(currentTime);
    labelTime.setHours(currentTime.getHours() + i);

    labels.push(formatChartTime(labelTime, {
      showTimezone: false,
      use24Hour: false,
      shortFormat: true
    }));
  }

  return labels;
};

/**
 * Gets timezone abbreviation for display
 */
export const getTimezoneAbbreviation = (): string => {
  return 'HKT'; // Hong Kong Time
};

/**
 * Checks if a time is during daylight hours for chart styling
 */
export const isDaylight = (time: Date): boolean => {
  const hkTime = toHongKongTime(time);
  const hour = hkTime.getHours();
  return hour >= 6 && hour < 19; // 6 AM to 7 PM considered daylight
};