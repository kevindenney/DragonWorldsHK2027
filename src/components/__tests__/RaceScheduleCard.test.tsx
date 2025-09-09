import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { RaceScheduleCard } from '../RaceScheduleCard';
import { MockDataFactory, renderWithProviders, AccessibilityTestUtils } from '../../testing/testingSetup';

describe('RaceScheduleCard Component', () => {
  const mockRaceEvent = MockDataFactory.createMockRaceEvent({
    id: 'race_1',
    type: 'racing',
    time: '14:00',
    title: 'Dragon Class Race 1',
    location: 'Royal Hong Kong Yacht Club',
    status: 'upcoming',
    details: [
      'Wind forecast: 12-15 knots SW',
      'Start sequence begins 14:00',
      'Course: Triangle + Windward/Leeward'
    ]
  });

  describe('Rendering', () => {
    it('should render race information correctly', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RaceScheduleCard event={mockRaceEvent} />
      );

      expect(getByText('14:00')).toBeTruthy();
      expect(getByText('Dragon Class Race 1')).toBeTruthy();
      expect(getByText('Royal Hong Kong Yacht Club')).toBeTruthy();
      expect(getByTestId('race-schedule-card')).toBeTruthy();
    });

    it('should display race status with appropriate styling', () => {
      const { getByTestId } = renderWithProviders(
        <RaceScheduleCard event={mockRaceEvent} />
      );

      const statusIndicator = getByTestId('race-status-indicator');
      expect(statusIndicator).toBeTruthy();
      expect(statusIndicator.props.style).toMatchObject(
        expect.objectContaining({ backgroundColor: expect.any(String) })
      );
    });

    it('should show race details when expanded', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RaceScheduleCard event={mockRaceEvent} />
      );

      // Initially collapsed
      expect(() => getByText('Wind forecast: 12-15 knots SW')).toThrow();

      // Tap to expand
      fireEvent.press(getByTestId('race-schedule-card'));

      await waitFor(() => {
        expect(getByText('Wind forecast: 12-15 knots SW')).toBeTruthy();
        expect(getByText('Start sequence begins 14:00')).toBeTruthy();
        expect(getByText('Course: Triangle + Windward/Leeward')).toBeTruthy();
      });
    });

    it('should handle different race statuses', () => {
      const statusTests = [
        { status: 'upcoming', expectedColor: 'blue' },
        { status: 'in-progress', expectedColor: 'green' },
        { status: 'completed', expectedColor: 'gray' },
        { status: 'weather-hold', expectedColor: 'orange' },
        { status: 'cancelled', expectedColor: 'red' }
      ] as const;

      statusTests.forEach(({ status, expectedColor }) => {
        const eventWithStatus = { ...mockRaceEvent, status };
        const { getByTestId } = renderWithProviders(
          <RaceScheduleCard event={eventWithStatus} />
        );

        const statusIndicator = getByTestId('race-status-indicator');
        expect(statusIndicator.props.style).toMatchObject(
          expect.objectContaining({ backgroundColor: expect.stringMatching(new RegExp(expectedColor, 'i')) })
        );
      });
    });

    it('should display event icons correctly', () => {
      const eventTypes = [
        { type: 'racing', expectedIcon: 'Flag' },
        { type: 'social', expectedIcon: 'Users' },
        { type: 'meeting', expectedIcon: 'MessageCircle' },
        { type: 'training', expectedIcon: 'Target' }
      ] as const;

      eventTypes.forEach(({ type, expectedIcon }) => {
        const eventWithType = { ...mockRaceEvent, type };
        const { getByTestId } = renderWithProviders(
          <RaceScheduleCard event={eventWithType} />
        );

        const icon = getByTestId('event-type-icon');
        expect(icon.props.children).toBe(expectedIcon);
      });
    });
  });

  describe('Interactions', () => {
    it('should handle card press', () => {
      const onPress = jest.fn();
      const { getByTestId } = renderWithProviders(
        <RaceScheduleCard event={mockRaceEvent} onPress={onPress} />
      );

      fireEvent.press(getByTestId('race-schedule-card'));
      expect(onPress).toHaveBeenCalledWith(mockRaceEvent);
    });

    it('should toggle expanded state on press', async () => {
      const { getByTestId, queryByText } = renderWithProviders(
        <RaceScheduleCard event={mockRaceEvent} />
      );

      // Initially collapsed
      expect(queryByText('Wind forecast: 12-15 knots SW')).toBeFalsy();

      // First press - expand
      fireEvent.press(getByTestId('race-schedule-card'));
      
      await waitFor(() => {
        expect(queryByText('Wind forecast: 12-15 knots SW')).toBeTruthy();
      });

      // Second press - collapse
      fireEvent.press(getByTestId('race-schedule-card'));
      
      await waitFor(() => {
        expect(queryByText('Wind forecast: 12-15 knots SW')).toBeFalsy();
      });
    });

    it('should handle notification toggle', async () => {
      const onNotificationToggle = jest.fn();
      const { getByTestId } = renderWithProviders(
        <RaceScheduleCard 
          event={mockRaceEvent} 
          onNotificationToggle={onNotificationToggle}
          showNotificationToggle={true}
        />
      );

      // Expand to show notification toggle
      fireEvent.press(getByTestId('race-schedule-card'));
      
      await waitFor(() => {
        const notificationToggle = getByTestId('notification-toggle');
        expect(notificationToggle).toBeTruthy();
        
        fireEvent.press(notificationToggle);
        expect(onNotificationToggle).toHaveBeenCalledWith(mockRaceEvent.id, true);
      });
    });

    it('should handle location press for navigation', async () => {
      const onLocationPress = jest.fn();
      const { getByTestId } = renderWithProviders(
        <RaceScheduleCard 
          event={mockRaceEvent} 
          onLocationPress={onLocationPress}
        />
      );

      // Expand to show location button
      fireEvent.press(getByTestId('race-schedule-card'));
      
      await waitFor(() => {
        const locationButton = getByTestId('location-button');
        fireEvent.press(locationButton);
        expect(onLocationPress).toHaveBeenCalledWith(mockRaceEvent.location);
      });
    });
  });

  describe('Time Display', () => {
    it('should display time in 24-hour format by default', () => {
      const { getByText } = renderWithProviders(
        <RaceScheduleCard event={mockRaceEvent} />
      );

      expect(getByText('14:00')).toBeTruthy();
    });

    it('should display time in 12-hour format when specified', () => {
      const { getByText } = renderWithProviders(
        <RaceScheduleCard event={mockRaceEvent} timeFormat="12h" />
      );

      expect(getByText('2:00 PM')).toBeTruthy();
    });

    it('should show countdown for upcoming events', () => {
      const upcomingEvent = {
        ...mockRaceEvent,
        time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().substr(11, 5) // 2 hours from now
      };

      const { getByTestId } = renderWithProviders(
        <RaceScheduleCard event={upcomingEvent} showCountdown={true} />
      );

      const countdown = getByTestId('event-countdown');
      expect(countdown).toBeTruthy();
      expect(countdown.props.children).toMatch(/in\s+\d+.*hours?/i);
    });

    it('should handle past events', () => {
      const pastEvent = {
        ...mockRaceEvent,
        status: 'completed' as const,
        time: '10:00'
      };

      const { getByText } = renderWithProviders(
        <RaceScheduleCard event={pastEvent} />
      );

      expect(getByText('10:00')).toBeTruthy();
    });
  });

  describe('Weather Integration', () => {
    it('should display weather conditions when available', async () => {
      const eventWithWeather = {
        ...mockRaceEvent,
        weatherConditions: {
          windSpeed: 15,
          windDirection: 'SW',
          temperature: 24,
          conditions: 'Partly Cloudy'
        }
      };

      const { getByTestId, getByText } = renderWithProviders(
        <RaceScheduleCard event={eventWithWeather} />
      );

      // Expand to show weather details
      fireEvent.press(getByTestId('race-schedule-card'));
      
      await waitFor(() => {
        expect(getByText('15 kts SW')).toBeTruthy();
        expect(getByText('24°')).toBeTruthy();
        expect(getByText('Partly Cloudy')).toBeTruthy();
      });
    });

    it('should show weather alerts for dangerous conditions', () => {
      const eventWithAlert = {
        ...mockRaceEvent,
        weatherConditions: {
          windSpeed: 35,
          windDirection: 'N',
          alert: 'Strong Wind Warning'
        }
      };

      const { getByTestId, getByText } = renderWithProviders(
        <RaceScheduleCard event={eventWithAlert} />
      );

      const weatherAlert = getByTestId('weather-alert');
      expect(weatherAlert).toBeTruthy();
      expect(getByText('Strong Wind Warning')).toBeTruthy();
    });
  });

  describe('Participant Information', () => {
    it('should display participant count when available', async () => {
      const eventWithParticipants = {
        ...mockRaceEvent,
        participants: 47
      };

      const { getByTestId, getByText } = renderWithProviders(
        <RaceScheduleCard event={eventWithParticipants} />
      );

      // Expand to show participant info
      fireEvent.press(getByTestId('race-schedule-card'));
      
      await waitFor(() => {
        expect(getByText('47 participants')).toBeTruthy();
      });
    });

    it('should show registration status for upcoming events', async () => {
      const openEvent = {
        ...mockRaceEvent,
        registrationOpen: true,
        registrationDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      const { getByTestId, getByText } = renderWithProviders(
        <RaceScheduleCard event={openEvent} />
      );

      // Expand to show registration info
      fireEvent.press(getByTestId('race-schedule-card'));
      
      await waitFor(() => {
        expect(getByText('Registration Open')).toBeTruthy();
        const registerButton = getByTestId('register-button');
        expect(registerButton).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByTestId } = renderWithProviders(
        <RaceScheduleCard event={mockRaceEvent} />
      );

      const card = getByTestId('race-schedule-card');
      expect(card.props.accessibilityLabel).toMatch(
        /dragon class race 1.*14:00.*royal hong kong yacht club/i
      );
      expect(card.props.accessible).toBe(true);
    });

    it('should announce status changes', () => {
      const inProgressEvent = { ...mockRaceEvent, status: 'in-progress' as const };
      
      const { getByTestId } = renderWithProviders(
        <RaceScheduleCard event={inProgressEvent} />
      );

      const statusIndicator = getByTestId('race-status-indicator');
      expect(statusIndicator.props.accessibilityLabel).toMatch(/in progress/i);
    });

    it('should support VoiceOver navigation', () => {
      const { getByTestId } = renderWithProviders(
        <RaceScheduleCard event={mockRaceEvent} />
      );

      const card = getByTestId('race-schedule-card');
      expect(card.props.accessibilityRole).toBe('button');
      expect(card.props.accessibilityHint).toMatch(/tap.*expand.*details/i);
    });

    it('should have accessible action buttons', async () => {
      const { getByTestId } = renderWithProviders(
        <RaceScheduleCard 
          event={mockRaceEvent}
          showNotificationToggle={true}
        />
      );

      // Expand to show buttons
      fireEvent.press(getByTestId('race-schedule-card'));
      
      await waitFor(() => {
        const notificationToggle = getByTestId('notification-toggle');
        expect(notificationToggle.props.accessibilityLabel).toMatch(/toggle.*notification/i);
        expect(notificationToggle.props.accessibilityRole).toBe('switch');
      });
    });
  });

  describe('Animations', () => {
    it('should animate expansion and collapse', async () => {
      const { getByTestId } = renderWithProviders(
        <RaceScheduleCard event={mockRaceEvent} />
      );

      const card = getByTestId('race-schedule-card');
      const expandableSection = getByTestId('expandable-section');

      // Initial state - collapsed
      expect(expandableSection.props.style).toMatchObject(
        expect.objectContaining({ height: 0 })
      );

      // Expand
      act(() => {
        fireEvent.press(card);
      });

      await waitFor(() => {
        expect(expandableSection.props.style).toMatchObject(
          expect.objectContaining({ height: expect.any(Number) })
        );
      });
    });

    it('should animate status changes', () => {
      const { rerender, getByTestId } = renderWithProviders(
        <RaceScheduleCard event={mockRaceEvent} />
      );

      const initialStatus = getByTestId('race-status-indicator');
      
      // Change status
      const updatedEvent = { ...mockRaceEvent, status: 'in-progress' as const };
      rerender(<RaceScheduleCard event={updatedEvent} />);

      const updatedStatus = getByTestId('race-status-indicator');
      expect(updatedStatus).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing event data gracefully', () => {
      const incompleteEvent = {
        id: 'test',
        title: 'Test Event',
        // Missing required fields
      };

      const { getByTestId } = renderWithProviders(
        <RaceScheduleCard event={incompleteEvent as any} />
      );

      const errorState = getByTestId('event-error-state');
      expect(errorState).toBeTruthy();
    });

    it('should handle invalid time formats', () => {
      const invalidTimeEvent = {
        ...mockRaceEvent,
        time: 'invalid-time'
      };

      const { getByText } = renderWithProviders(
        <RaceScheduleCard event={invalidTimeEvent} />
      );

      expect(getByText('TBD')).toBeTruthy(); // Shows "To Be Determined" for invalid times
    });

    it('should handle network errors for weather data', async () => {
      const eventWithWeatherError = {
        ...mockRaceEvent,
        weatherError: 'Failed to load weather data'
      };

      const { getByTestId, getByText } = renderWithProviders(
        <RaceScheduleCard event={eventWithWeatherError} />
      );

      // Expand to show weather error
      fireEvent.press(getByTestId('race-schedule-card'));
      
      await waitFor(() => {
        expect(getByText('Weather data unavailable')).toBeTruthy();
      });
    });
  });

  describe('Performance', () => {
    it('should handle large lists efficiently', () => {
      const events = Array.from({ length: 100 }, (_, i) => ({
        ...mockRaceEvent,
        id: `race_${i}`,
        title: `Race ${i}`,
        time: `${10 + Math.floor(i / 10)}:${(i % 10) * 6}`
      }));

      const startTime = performance.now();
      
      const { getAllByTestId } = renderWithProviders(
        <>
          {events.map(event => (
            <RaceScheduleCard key={event.id} event={event} />
          ))}
        </>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(500); // Should render in < 500ms
      expect(getAllByTestId('race-schedule-card')).toHaveLength(100);
    });

    it('should memoize to prevent unnecessary re-renders', () => {
      const renderSpy = jest.fn();
      const MemoizedCard = React.memo(() => {
        renderSpy();
        return <RaceScheduleCard event={mockRaceEvent} />;
      });

      const { rerender } = renderWithProviders(<MemoizedCard />);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props
      rerender(<MemoizedCard />);
      
      // Should not render again due to memoization
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Localization', () => {
    it('should support different date formats', () => {
      const { getByText } = renderWithProviders(
        <RaceScheduleCard 
          event={mockRaceEvent} 
          dateFormat="DD/MM/YYYY"
        />
      );

      // Should render with localized date format
      expect(getByText('Dragon Class Race 1')).toBeTruthy();
    });

    it('should handle different languages', () => {
      const localizedEvent = {
        ...mockRaceEvent,
        title: '龍舟賽事 1', // Chinese title
        location: '香港皇家遊艇會' // Chinese location
      };

      const { getByText } = renderWithProviders(
        <RaceScheduleCard event={localizedEvent} />
      );

      expect(getByText('龍舟賽事 1')).toBeTruthy();
      expect(getByText('香港皇家遊艇會')).toBeTruthy();
    });
  });
});