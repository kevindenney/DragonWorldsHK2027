// Dark Sky inspired theme colors and patterns
export const darkSkyColors = {
  // Dark Sky background colors
  backgroundPrimary: '#1a1a1c',
  backgroundSecondary: '#2c2c2e',
  backgroundTertiary: '#3a3a3c',
  
  // Card and surface colors
  cardBackground: '#2c2c2e',
  cardBorder: '#48484a',
  
  // Text colors
  textPrimary: '#ffffff',
  textSecondary: '#e5e5e7',
  textTertiary: '#a1a1aa',
  textMuted: '#8e8e93',
  
  // Weather condition colors
  clearSky: '#007aff',
  partlyCloudy: '#5ac8fa',
  cloudy: '#8e8e93',
  overcast: '#636366',
  rain: '#30b0ff',
  storm: '#ff9f0a',
  snow: '#e5e5e7',
  
  // Wind strength colors
  windCalm: '#8e8e93',
  windLight: '#30d158',
  windModerate: '#007aff',
  windFresh: '#ff9f0a',
  windStrong: '#ff6b35',
  windGale: '#ff3b30',
  
  // Racing condition colors
  racingIdeal: '#30d158',
  racingGood: '#32d74b',
  racingChallenging: '#ff9f0a',
  racingPoor: '#ff6b35',
  racingDangerous: '#ff3b30',
  
  // Racing-specific wind conditions (inspired by Dark Sky)
  windOptimal: '#30d158',      // 8-15 knots - perfect racing conditions
  windSubOptimal: '#64d2ff',   // 5-8 or 15-20 knots - good conditions
  windChallenging: '#ff9f0a',  // 3-5 or 20-25 knots - challenging
  windPoor: '#ff6b35',         // <3 or 25-30 knots - poor racing
  windDangerous: '#ff3b30',    // >30 knots - dangerous conditions
  
  // Start line analysis colors
  startLineFavored: '#30d158',
  startLineNeutral: '#007aff',
  startLineUnfavored: '#ff9f0a',
  startLineAvoid: '#ff3b30',
  
  // Tactical advantage indicators
  portAdvantage: '#5ac8fa',
  starboardAdvantage: '#32d74b',
  laylineApproach: '#ff9f0a',
  windShiftComing: '#ff6b35',
  
  // Racing timeline states
  preRaceOptimal: '#007aff',
  raceActive: '#30d158',
  postRaceAnalysis: '#8e8e93',
  
  // Marine data colors
  waveCalm: '#64d2ff',
  waveModerate: '#007aff',
  waveRough: '#ff9f0a',
  waveHigh: '#ff3b30',
  
  // Accent colors
  accent: '#007aff',
  accentSecondary: '#5ac8fa',
  warning: '#ff9f0a',
  error: '#ff3b30',
  success: '#30d158',
};

// Dark Sky inspired gradients
export const darkSkyGradients = {
  cardBackground: ['#2c2c2e', '#1c1c1e'],
  stormyWeather: ['#48484a', '#2c2c2e'],
  clearSky: ['#007aff', '#5ac8fa'],
  sunset: ['#ff9f0a', '#ff6b35'],
};

// Dark Sky typography scale
export const darkSkyTypography = {
  // Large display numbers (temperature, wind speed)
  displayLarge: {
    fontSize: 48,
    fontWeight: '200' as const,
    letterSpacing: -1,
  },
  displayMedium: {
    fontSize: 32,
    fontWeight: '300' as const,
    letterSpacing: -0.5,
  },
  displaySmall: {
    fontSize: 24,
    fontWeight: '400' as const,
  },
  
  // Body text
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  
  // Labels and captions
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  overline: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  
  // Monospace for data
  mono: {
    fontFamily: 'SF Mono',
    fontSize: 14,
    fontWeight: '400' as const,
  },
};

// Dark Sky spacing and sizing
export const darkSkySpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Card specific
  cardPadding: 20,
  cardMargin: 12,
  cardRadius: 16,
  
  // Component specific
  iconSize: {
    small: 16,
    medium: 24,
    large: 32,
    xlarge: 48,
  },
};

// Animation presets inspired by Dark Sky
export const darkSkyAnimations = {
  // Smooth entrance
  fadeIn: {
    duration: 400,
    easing: 'ease-out',
  },
  
  // Wind direction changes
  windRotation: {
    duration: 800,
    easing: 'ease-in-out',
  },
  
  // Data updates
  dataRefresh: {
    duration: 300,
    easing: 'ease-out',
  },
  
  // Weather transitions
  weatherChange: {
    duration: 600,
    easing: 'ease-in-out',
  },
  
  // Pulsing for alerts/gusts
  pulse: {
    duration: 1200,
    easing: 'ease-in-out',
  },
};

// Chart styling inspired by Dark Sky
export const darkSkyCharts = {
  lineWidth: 2,
  pointRadius: 3,
  gridOpacity: 0.1,
  
  // Wind chart specific
  windChart: {
    barWidth: 8,
    barSpacing: 4,
    maxHeight: 60,
  },
  
  // Temperature chart
  temperatureChart: {
    lineColor: darkSkyColors.accent,
    fillOpacity: 0.1,
  },
  
  // Precipitation chart
  precipChart: {
    barColor: darkSkyColors.rain,
    intensityColors: {
      light: '#64d2ff',
      moderate: '#30b0ff', 
      heavy: '#007aff',
    },
  },
  
  // Racing-specific chart configurations
  racingWindChart: {
    optimalWindBand: {
      minSpeed: 8,
      maxSpeed: 15,
      fillColor: darkSkyColors.windOptimal,
      fillOpacity: 0.15,
    },
    gustIndicators: {
      threshold: 5, // knots above sustained wind
      color: darkSkyColors.warning,
      pulseAnimation: true,
    },
    windShiftDetection: {
      threshold: 15, // degrees
      color: darkSkyColors.windShiftComing,
      arrowSize: 16,
    },
  },
  
  // Start line analysis chart
  startLineChart: {
    boatLength: 24, // meters (typical Dragon class boat)
    lineLength: 100, // meters (typical start line)
    favoredEndIndicator: {
      size: 12,
      pulseAnimation: true,
    },
    windShadowZones: {
      opacity: 0.3,
      color: darkSkyColors.textMuted,
    },
  },
  
  // Racing timeline chart
  racingTimeline: {
    hourHeight: 40,
    conditionBarWidth: 6,
    optimalWindowHighlight: {
      color: darkSkyColors.racingIdeal,
      opacity: 0.2,
    },
    preRaceCountdown: {
      colors: ['#ff3b30', '#ff9f0a', '#30d158'], // Red -> Yellow -> Green
      intervals: [10, 5, 0], // minutes before start
    },
  },
};

// Weather condition mappings
export const weatherConditionStyles = {
  'clear': {
    color: darkSkyColors.clearSky,
    icon: 'sun',
    description: 'Clear skies',
  },
  'partly-cloudy': {
    color: darkSkyColors.partlyCloudy,
    icon: 'cloud-sun',
    description: 'Partly cloudy',
  },
  'cloudy': {
    color: darkSkyColors.cloudy,
    icon: 'cloud',
    description: 'Cloudy',
  },
  'overcast': {
    color: darkSkyColors.overcast,
    icon: 'cloud-cover',
    description: 'Overcast',
  },
  'rain': {
    color: darkSkyColors.rain,
    icon: 'cloud-rain',
    description: 'Rain',
  },
  'storm': {
    color: darkSkyColors.storm,
    icon: 'cloud-lightning',
    description: 'Thunderstorm',
  },
  'snow': {
    color: darkSkyColors.snow,
    icon: 'cloud-snow',
    description: 'Snow',
  },
};

// Racing condition assessment utilities
export const racingConditionUtils = {
  // Assess wind conditions for racing
  assessWindConditions: (windSpeed: number, windDirection: number, gustFactor: number = 0): {
    condition: 'optimal' | 'suboptimal' | 'challenging' | 'poor' | 'dangerous';
    color: string;
    description: string;
    tacticalAdvice: string;
  } => {
    const effectiveWind = windSpeed + (gustFactor * 0.3); // Factor in gusts
    
    if (effectiveWind >= 8 && effectiveWind <= 15 && gustFactor < 5) {
      return {
        condition: 'optimal',
        color: darkSkyColors.windOptimal,
        description: 'Perfect racing conditions',
        tacticalAdvice: 'Focus on boat speed and positioning'
      };
    } else if ((effectiveWind >= 5 && effectiveWind < 8) || (effectiveWind > 15 && effectiveWind <= 20)) {
      return {
        condition: 'suboptimal',
        color: darkSkyColors.windSubOptimal,
        description: 'Good racing with technique focus',
        tacticalAdvice: effectiveWind < 8 ? 'Light air tactics required' : 'Strong wind boat handling crucial'
      };
    } else if ((effectiveWind >= 3 && effectiveWind < 5) || (effectiveWind > 20 && effectiveWind <= 25)) {
      return {
        condition: 'challenging',
        color: darkSkyColors.windChallenging,
        description: 'Challenging conditions',
        tacticalAdvice: effectiveWind < 5 ? 'Minimize maneuvers, sail high modes' : 'Reef early, prioritize control'
      };
    } else if (effectiveWind < 3 || (effectiveWind > 25 && effectiveWind <= 30)) {
      return {
        condition: 'poor',
        color: darkSkyColors.windPoor,
        description: 'Poor racing conditions',
        tacticalAdvice: effectiveWind < 3 ? 'Race may be postponed' : 'Consider safety protocols'
      };
    } else {
      return {
        condition: 'dangerous',
        color: darkSkyColors.windDangerous,
        description: 'Dangerous conditions',
        tacticalAdvice: 'Racing should be postponed or abandoned'
      };
    }
  },

  // Determine start line advantage
  assessStartLine: (windDirection: number, startLineBearing: number): {
    favoredEnd: 'port' | 'starboard' | 'neutral';
    color: string;
    advantage: number; // degrees of advantage
    tacticalAdvice: string;
  } => {
    const angleDiff = Math.abs(windDirection - startLineBearing);
    const normalizedAngle = angleDiff > 180 ? 360 - angleDiff : angleDiff;
    
    // Determine which end is closer to wind (favored)
    const isPortFavored = (windDirection - startLineBearing + 360) % 360 < 180;
    
    if (normalizedAngle <= 5) {
      return {
        favoredEnd: 'neutral',
        color: darkSkyColors.startLineNeutral,
        advantage: normalizedAngle,
        tacticalAdvice: 'Start anywhere with clear air'
      };
    } else if (normalizedAngle <= 15) {
      return {
        favoredEnd: isPortFavored ? 'port' : 'starboard',
        color: darkSkyColors.startLineFavored,
        advantage: normalizedAngle,
        tacticalAdvice: `Slight advantage to ${isPortFavored ? 'port' : 'starboard'} end`
      };
    } else {
      return {
        favoredEnd: isPortFavored ? 'port' : 'starboard',
        color: darkSkyColors.startLineFavored,
        advantage: normalizedAngle,
        tacticalAdvice: `Strong ${isPortFavored ? 'port' : 'starboard'} bias - start at favored end`
      };
    }
  },

  // Calculate optimal racing window
  calculateRacingWindow: (hourlyData: Array<{
    windSpeed: number;
    windDirection: number;
    precipitationChance: number;
    visibility: number;
    time: string;
  }>): Array<{
    time: string;
    score: number;
    isOptimal: boolean;
    factors: string[];
  }> => {
    return hourlyData.map(data => {
      let score = 100;
      const factors: string[] = [];

      // Wind speed factor
      const windAssessment = racingConditionUtils.assessWindConditions(data.windSpeed, data.windDirection);
      if (windAssessment.condition === 'optimal') score += 20;
      else if (windAssessment.condition === 'suboptimal') score += 10;
      else if (windAssessment.condition === 'challenging') score -= 10;
      else if (windAssessment.condition === 'poor') score -= 30;
      else score -= 50;

      // Precipitation factor
      if (data.precipitationChance > 30) {
        score -= data.precipitationChance * 0.5;
        factors.push('Rain risk');
      }

      // Visibility factor
      if (data.visibility < 5) {
        score -= (5 - data.visibility) * 10;
        factors.push('Poor visibility');
      }

      return {
        time: data.time,
        score: Math.max(0, score),
        isOptimal: score >= 80,
        factors
      };
    });
  }
};