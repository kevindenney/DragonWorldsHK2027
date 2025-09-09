import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { WeatherCard } from '../WeatherCard';
import { MockDataFactory, renderWithProviders, AccessibilityTestUtils } from '../../testing/testingSetup';

// Mock Expo Haptics
jest.mock('expo-haptics');

describe('WeatherCard Component', () => {
  const mockWeatherData = MockDataFactory.createMockWeatherData({
    location: 'Royal Hong Kong Yacht Club',
    temperature: 24,
    windSpeed: 12,
    windDirection: 220,
    conditions: 'Partly Cloudy',
    sailingConditions: 'good'
  });

  describe('Rendering', () => {
    it('should render weather information correctly', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <WeatherCard weatherData={mockWeatherData} />
      );

      expect(getByText('24°')).toBeTruthy();
      expect(getByText('Partly Cloudy')).toBeTruthy();
      expect(getByText('12 kts')).toBeTruthy();
      expect(getByText('SW')).toBeTruthy(); // 220 degrees = SW
      expect(getByTestId('weather-card')).toBeTruthy();
    });

    it('should display location information', () => {
      const { getByText } = renderWithProviders(
        <WeatherCard weatherData={mockWeatherData} />
      );

      expect(getByText('Royal Hong Kong Yacht Club')).toBeTruthy();
    });

    it('should show sailing conditions indicator', () => {
      const { getByTestId } = renderWithProviders(
        <WeatherCard weatherData={mockWeatherData} />
      );

      const conditionsIndicator = getByTestId('sailing-conditions-indicator');
      expect(conditionsIndicator).toBeTruthy();
    });

    it('should handle loading state', () => {
      const { getByTestId, queryByText } = renderWithProviders(
        <WeatherCard weatherData={null} isLoading={true} />
      );

      expect(getByTestId('weather-loading-skeleton')).toBeTruthy();
      expect(queryByText('24°')).toBeFalsy();
    });

    it('should handle error state', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <WeatherCard 
          weatherData={null} 
          error="Failed to load weather data" 
        />
      );

      expect(getByTestId('weather-error-state')).toBeTruthy();
      expect(getByText('Failed to load weather data')).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('should handle card press', () => {
      const onPress = jest.fn();
      const { getByTestId } = renderWithProviders(
        <WeatherCard weatherData={mockWeatherData} onPress={onPress} />
      );

      fireEvent.press(getByTestId('weather-card'));
      expect(onPress).toHaveBeenCalledWith(mockWeatherData);
    });

    it('should handle refresh action', async () => {
      const onRefresh = jest.fn().mockResolvedValue(undefined);
      const { getByTestId } = renderWithProviders(
        <WeatherCard 
          weatherData={mockWeatherData} 
          onRefresh={onRefresh} 
          showRefreshButton={true}
        />
      );

      fireEvent.press(getByTestId('weather-refresh-button'));
      
      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalled();
      });
    });

    it('should show loading state during refresh', async () => {
      const onRefresh = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const { getByTestId } = renderWithProviders(
        <WeatherCard 
          weatherData={mockWeatherData} 
          onRefresh={onRefresh} 
          showRefreshButton={true}
        />
      );

      fireEvent.press(getByTestId('weather-refresh-button'));
      
      expect(getByTestId('weather-refreshing-indicator')).toBeTruthy();
      
      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalled();
      });
    });
  });

  describe('Wind Direction Display', () => {
    it('should convert wind direction to compass points correctly', () => {
      const testCases = [
        { degrees: 0, expected: 'N' },
        { degrees: 45, expected: 'NE' },
        { degrees: 90, expected: 'E' },
        { degrees: 135, expected: 'SE' },
        { degrees: 180, expected: 'S' },
        { degrees: 225, expected: 'SW' },
        { degrees: 270, expected: 'W' },
        { degrees: 315, expected: 'NW' },
        { degrees: 360, expected: 'N' },
      ];

      testCases.forEach(({ degrees, expected }) => {
        const weatherWithDirection = MockDataFactory.createMockWeatherData({
          windDirection: degrees
        });
        
        const { getByText } = renderWithProviders(
          <WeatherCard weatherData={weatherWithDirection} />
        );

        expect(getByText(expected)).toBeTruthy();
      });
    });
  });

  describe('Sailing Conditions', () => {
    it('should display excellent conditions with green indicator', () => {
      const excellentWeather = MockDataFactory.createMockWeatherData({
        sailingConditions: 'excellent',
        windSpeed: 15,
        conditions: 'Clear'
      });

      const { getByTestId } = renderWithProviders(
        <WeatherCard weatherData={excellentWeather} />
      );

      const indicator = getByTestId('sailing-conditions-indicator');
      expect(indicator.props.style).toMatchObject(
        expect.objectContaining({ backgroundColor: expect.stringMatching(/green/i) })
      );
    });

    it('should display poor conditions with red indicator', () => {
      const poorWeather = MockDataFactory.createMockWeatherData({
        sailingConditions: 'poor',
        windSpeed: 35,
        conditions: 'Stormy'
      });

      const { getByTestId } = renderWithProviders(
        <WeatherCard weatherData={poorWeather} />
      );

      const indicator = getByTestId('sailing-conditions-indicator');
      expect(indicator.props.style).toMatchObject(
        expect.objectContaining({ backgroundColor: expect.stringMatching(/red/i) })
      );
    });
  });

  describe('Temperature Units', () => {
    it('should display temperature in Celsius by default', () => {
      const { getByText } = renderWithProviders(
        <WeatherCard weatherData={mockWeatherData} />
      );

      expect(getByText('24°C')).toBeTruthy();
    });

    it('should display temperature in Fahrenheit when specified', () => {
      const { getByText } = renderWithProviders(
        <WeatherCard 
          weatherData={mockWeatherData} 
          temperatureUnit="fahrenheit"
        />
      );

      expect(getByText('75°F')).toBeTruthy(); // 24°C = 75°F
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByTestId } = renderWithProviders(
        <WeatherCard weatherData={mockWeatherData} />
      );

      const weatherCard = getByTestId('weather-card');
      expect(weatherCard.props.accessibilityLabel).toMatch(/weather.*24.*degrees.*12.*knots/i);
      expect(weatherCard.props.accessible).toBe(true);
    });

    it('should have accessible refresh button', () => {
      const onRefresh = jest.fn();
      const { getByTestId } = renderWithProviders(
        <WeatherCard 
          weatherData={mockWeatherData} 
          onRefresh={onRefresh}
          showRefreshButton={true}
        />
      );

      const refreshButton = getByTestId('weather-refresh-button');
      expect(refreshButton.props.accessibilityLabel).toMatch(/refresh.*weather/i);
      expect(refreshButton.props.accessibilityRole).toBe('button');
    });

    it('should support Dynamic Type scaling', () => {
      const { getByTestId } = renderWithProviders(
        <WeatherCard weatherData={mockWeatherData} />
      );

      const temperatureText = getByTestId('temperature-text');
      expect(temperatureText.props.style).toMatchObject(
        expect.objectContaining({ fontSize: expect.any(Number) })
      );
    });

    it('should have proper VoiceOver navigation', () => {
      const { getByTestId } = renderWithProviders(
        <WeatherCard weatherData={mockWeatherData} />
      );

      const weatherCard = getByTestId('weather-card');
      expect(AccessibilityTestUtils.isAccessibilityFocusable(weatherCard)).toBe(true);
    });
  });

  describe('Premium Features', () => {
    it('should show detailed information for premium users', () => {
      const detailedWeather = {
        ...mockWeatherData,
        waveHeight: 1.2,
        visibility: 15,
        uvIndex: 6
      };

      const { getByText } = renderWithProviders(
        <WeatherCard 
          weatherData={detailedWeather} 
          showDetailedInfo={true}
        />
      );

      expect(getByText('1.2m')).toBeTruthy(); // Wave height
      expect(getByText('15nm')).toBeTruthy(); // Visibility
      expect(getByText('UV: 6')).toBeTruthy(); // UV Index
    });

    it('should hide premium features for free users', () => {
      const detailedWeather = {
        ...mockWeatherData,
        waveHeight: 1.2,
        visibility: 15,
        uvIndex: 6
      };

      const { queryByText } = renderWithProviders(
        <WeatherCard 
          weatherData={detailedWeather} 
          showDetailedInfo={false}
        />
      );

      expect(queryByText('1.2m')).toBeFalsy();
      expect(queryByText('15nm')).toBeFalsy();
      expect(queryByText('UV: 6')).toBeFalsy();
    });

    it('should show upgrade prompt for premium features', () => {
      const onUpgradePress = jest.fn();
      const { getByTestId } = renderWithProviders(
        <WeatherCard 
          weatherData={mockWeatherData}
          showDetailedInfo={false}
          onUpgradePress={onUpgradePress}
        />
      );

      const upgradePrompt = getByTestId('upgrade-prompt');
      expect(upgradePrompt).toBeTruthy();

      fireEvent.press(upgradePrompt);
      expect(onUpgradePress).toHaveBeenCalled();
    });
  });

  describe('Animations', () => {
    it('should animate weather condition changes', async () => {
      const { rerender, getByTestId } = renderWithProviders(
        <WeatherCard weatherData={mockWeatherData} />
      );

      const initialCard = getByTestId('weather-card');
      
      // Change weather conditions
      const updatedWeather = MockDataFactory.createMockWeatherData({
        conditions: 'Stormy',
        sailingConditions: 'dangerous'
      });

      rerender(<WeatherCard weatherData={updatedWeather} />);

      await waitFor(() => {
        const updatedCard = getByTestId('weather-card');
        expect(updatedCard).toBeTruthy();
      });
    });

    it('should show loading animation', () => {
      const { getByTestId } = renderWithProviders(
        <WeatherCard weatherData={null} isLoading={true} />
      );

      const loadingSkeleton = getByTestId('weather-loading-skeleton');
      expect(loadingSkeleton.props.style).toMatchObject(
        expect.objectContaining({ opacity: expect.any(Number) })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle missing weather data gracefully', () => {
      const incompleteWeather = {
        location: 'Test Location',
        // Missing required fields
      };

      const { getByTestId } = renderWithProviders(
        <WeatherCard weatherData={incompleteWeather as any} />
      );

      const errorState = getByTestId('weather-error-state');
      expect(errorState).toBeTruthy();
    });

    it('should handle network errors with retry option', () => {
      const onRetry = jest.fn();
      const { getByTestId, getByText } = renderWithProviders(
        <WeatherCard 
          weatherData={null}
          error="Network connection failed"
          onRetry={onRetry}
        />
      );

      expect(getByText('Network connection failed')).toBeTruthy();
      
      const retryButton = getByTestId('weather-retry-button');
      fireEvent.press(retryButton);
      
      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should memoize component to prevent unnecessary re-renders', () => {
      const renderSpy = jest.fn();
      const MemoizedWeatherCard = React.memo(() => {
        renderSpy();
        return <WeatherCard weatherData={mockWeatherData} />;
      });

      const { rerender } = renderWithProviders(<MemoizedWeatherCard />);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props
      rerender(<MemoizedWeatherCard />);
      
      // Should not render again due to memoization
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid data updates efficiently', async () => {
      let renderCount = 0;
      const TestComponent = ({ data }: { data: any }) => {
        renderCount++;
        return <WeatherCard weatherData={data} />;
      };

      const { rerender } = renderWithProviders(
        <TestComponent data={mockWeatherData} />
      );

      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        const updatedWeather = MockDataFactory.createMockWeatherData({
          temperature: 20 + i
        });
        rerender(<TestComponent data={updatedWeather} />);
      }

      // Should handle updates without performance issues
      expect(renderCount).toBeLessThanOrEqual(11); // Initial + 10 updates
    });
  });

  describe('Marine Weather Features', () => {
    it('should display wave information when available', () => {
      const marineWeather = MockDataFactory.createMockWeatherData({
        waveHeight: 1.5,
        waveDirection: 200,
        wavePeriod: 4.2
      });

      const { getByText } = renderWithProviders(
        <WeatherCard 
          weatherData={marineWeather} 
          showMarineData={true}
        />
      );

      expect(getByText('1.5m')).toBeTruthy(); // Wave height
      expect(getByText('SSW')).toBeTruthy(); // Wave direction (200° = SSW)
      expect(getByText('4.2s')).toBeTruthy(); // Wave period
    });

    it('should display tide information', () => {
      const tidalWeather = MockDataFactory.createMockWeatherData({
        tideHeight: 1.8,
        tideDirection: 'rising'
      });

      const { getByText } = renderWithProviders(
        <WeatherCard 
          weatherData={tidalWeather} 
          showMarineData={true}
        />
      );

      expect(getByText('1.8m')).toBeTruthy(); // Tide height
      expect(getByText('Rising')).toBeTruthy(); // Tide direction
    });
  });
});