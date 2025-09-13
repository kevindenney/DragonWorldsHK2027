// Dragon World Championships Light Theme System
// Inspired by Carrot Weather's clean aesthetic with sailing-specific adaptations

export const dragonLightColors = {
  // Primary sailing blues - inspired by clear Hong Kong waters
  primary: '#007AFF',           // iOS system blue - clean and familiar
  primaryLight: '#5AC8FA',      // Light blue for accents
  primaryDark: '#0051D5',       // Darker blue for pressed states
  
  // Secondary sailing colors
  secondary: '#FFD700',         // Championship gold
  secondaryLight: '#FFE033',    // Light gold for highlights
  secondaryDark: '#B8860B',     // Dark gold for contrast
  
  // Sailing-specific accent colors
  accent: '#00C896',            // Sea green for positive states
  accentLight: '#40E0D0',       // Turquoise for highlights
  accentDark: '#008B6F',        // Deep sea green
  
  // Clean light backgrounds (Carrot Weather inspired)
  background: '#FFFFFF',        // Pure white primary background
  backgroundSecondary: '#F8FAFB', // Slightly off-white for cards
  backgroundTertiary: '#F1F5F9', // Light gray for sections
  surface: '#FFFFFF',           // Card surfaces
  surfaceElevated: '#FFFFFF',   // Elevated cards with shadow
  
  // Text hierarchy (excellent readability)
  text: '#1A1A1A',             // Primary text - near black
  textSecondary: '#4A5568',     // Secondary text - readable gray
  textTertiary: '#718096',      // Tertiary text - muted
  textMuted: '#A0AEC0',         // Muted text - light gray
  textInverted: '#FFFFFF',      // White text for dark backgrounds
  
  // Weather condition colors (light theme optimized)
  weatherClear: '#FFB800',      // Sunny orange
  weatherPartlyCloud: '#5AC8FA', // Light blue
  weatherCloudy: '#8E8E93',     // Neutral gray
  weatherRain: '#007AFF',       // Blue for rain
  weatherStorm: '#5856D6',      // Purple for storms
  weatherWind: '#00C896',       // Green for good wind
  
  // Racing condition indicators
  racingOptimal: '#34C759',     // Green for perfect conditions
  racingGood: '#007AFF',        // Blue for good conditions  
  racingChallenging: '#FF9500', // Orange for challenging
  racingPoor: '#FF6B35',        // Orange-red for poor
  racingDangerous: '#FF3B30',   // Red for dangerous
  
  // Status and feedback colors
  success: '#34C759',           // iOS green
  warning: '#FF9500',           // iOS orange
  error: '#FF3B30',             // iOS red
  info: '#007AFF',              // iOS blue
  
  // Borders and dividers (subtle in light theme)
  border: '#E5E5EA',            // Light border
  borderLight: '#F2F2F7',       // Very light border
  borderStrong: '#D1D1D6',      // Stronger border
  separator: '#C7C7CC',         // iOS-standard separator
  
  // Interactive states
  buttonBackground: '#007AFF',
  buttonBackgroundPressed: '#0051D5',
  buttonBackgroundDisabled: '#E5E5EA',
  buttonText: '#FFFFFF',
  buttonTextDisabled: '#A0AEC0',
  
  // Sailing-specific colors
  startLineFavored: '#34C759',    // Green for favored end
  startLineNeutral: '#007AFF',    // Blue for neutral
  startLineUnfavored: '#FF9500',  // Orange for unfavored
  
  windLight: '#34C759',           // Green for light wind
  windModerate: '#007AFF',        // Blue for moderate wind
  windStrong: '#FF9500',          // Orange for strong wind
  windGale: '#FF3B30',            // Red for gale
  
  waveCalm: '#5AC8FA',            // Light blue for calm
  waveModerate: '#007AFF',        // Blue for moderate
  waveRough: '#FF9500',           // Orange for rough
  waveHigh: '#FF3B30',            // Red for high waves
  
  // Notice board and communication colors
  officialNotice: '#5856D6',      // Purple for official
  amendment: '#FF9500',           // Orange for amendments
  urgent: '#FF3B30',              // Red for urgent
  social: '#00C896',              // Green for social
  
  // Championship specific
  championshipGold: '#FFD700',    // Gold medal
  championshipSilver: '#C0C0C0',  // Silver medal
  championshipBronze: '#CD7F32',  // Bronze medal
  championshipRed: '#FF3B30',     // Red fleet
  championshipBlue: '#007AFF',    // Blue fleet
  championshipYellow: '#FFD700',  // Yellow fleet
};

// Carrot Weather inspired gradients for light theme
export const dragonLightGradients = {
  // Background gradients
  screenBackground: ['#FFFFFF', '#F8FAFB'],
  cardBackground: ['#FFFFFF', '#FAFBFC'],
  
  // Weather condition gradients
  clearSky: ['#87CEEB', '#F0F8FF'],      // Light blue to very light blue
  partlyCloudy: ['#F0F8FF', '#E6F3FF'],  // Very light blue gradient
  cloudy: ['#F5F5F5', '#E8E8E8'],        // Light gray gradient
  rainy: ['#E6F3FF', '#CCE7FF'],         // Light blue rain gradient
  
  // Racing condition gradients
  optimalRacing: ['#E8F5E8', '#F0FFF0'], // Light green gradient
  challengingRacing: ['#FFF3E6', '#FFEBE6'], // Light orange gradient
  dangerousRacing: ['#FFE6E6', '#FFCCCC'], // Light red gradient
  
  // Championship themed
  championshipHero: ['#F8FAFB', '#FFFFFF'], // Clean gradient for hero sections
  noticeBoardOfficial: ['#F0F0FF', '#F8F8FF'], // Light purple for official notices
};

// Typography system inspired by Carrot Weather's clean hierarchy
export const dragonLightTypography = {
  // Display typography (for hero numbers like temperature, wind speed)
  displayHero: {
    fontSize: 72,
    fontWeight: '200' as const,
    letterSpacing: -2,
    lineHeight: 80,
  },
  displayLarge: {
    fontSize: 48,
    fontWeight: '300' as const,
    letterSpacing: -1,
    lineHeight: 56,
  },
  displayMedium: {
    fontSize: 36,
    fontWeight: '400' as const,
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  displaySmall: {
    fontSize: 28,
    fontWeight: '500' as const,
    letterSpacing: 0,
    lineHeight: 34,
  },
  
  // Headline typography
  headlineLarge: {
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 30,
  },
  headlineMedium: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.15,
    lineHeight: 26,
  },
  headlineSmall: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  
  // Body typography
  bodyLarge: {
    fontSize: 17,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
    lineHeight: 18,
  },
  
  // Label typography
  labelLarge: {
    fontSize: 15,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 20,
  },
  labelMedium: {
    fontSize: 13,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  
  // Specialized typography
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  overline: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 1.5,
    lineHeight: 16,
    textTransform: 'uppercase' as const,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    lineHeight: 20,
  },
  
  // Sailing data specific (monospace for precise data)
  sailingData: {
    fontFamily: 'SF Mono, Monaco, monospace',
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0,
    lineHeight: 18,
  },
  sailingDataLarge: {
    fontFamily: 'SF Mono, Monaco, monospace',
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 22,
  },
};

// Enhanced spacing system for clean layouts
export const dragonLightSpacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  xxxxxl: 48,
  
  // Component-specific spacing
  cardPadding: 16,
  cardMargin: 12,
  sectionSpacing: 24,
  screenPadding: 16,
  
  // Tab and navigation spacing
  tabHeight: 84,
  tabIconSize: 24,
  headerHeight: 56,
  
  // Weather component spacing
  weatherCardPadding: 20,
  weatherIconSize: 32,
  windRoseSize: 120,
};

// Border radius system for clean, modern feel
export const dragonLightBorderRadius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  round: 999,
  
  // Component-specific
  card: 12,
  button: 8,
  input: 8,
  modal: 16,
  weatherCard: 16,
  tab: 12,
};

// Shadow system for light theme depth
export const dragonLightShadows = {
  // Card shadows
  cardSmall: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardMedium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardLarge: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  
  // Button shadows
  button: {
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  
  // Modal shadows
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  
  // Tab bar shadow
  tabBar: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 8,
  },
};

// Animation configurations inspired by Carrot Weather
export const dragonLightAnimations = {
  // Standard UI animations
  default: {
    duration: 250,
    easing: 'ease-out',
  },
  
  // Weather-specific animations
  weatherTransition: {
    duration: 400,
    easing: 'ease-in-out',
  },
  
  // Wind direction changes
  windRotation: {
    duration: 800,
    easing: 'ease-in-out',
  },
  
  // Data refresh animations
  refresh: {
    duration: 300,
    easing: 'ease-out',
  },
  
  // Tab switching
  tabSwitch: {
    duration: 200,
    easing: 'ease-out',
  },
  
  // Modal presentations
  modalPresent: {
    duration: 300,
    easing: 'ease-out',
  },
  
  // Micro-interactions
  buttonPress: {
    duration: 150,
    easing: 'ease-out',
  },
  
  // Racing countdown animations
  countdown: {
    duration: 1000,
    easing: 'ease-in-out',
  },
};

// Weather condition styling (light theme optimized)
export const dragonWeatherConditions = {
  clear: {
    color: dragonLightColors.weatherClear,
    background: dragonLightGradients.clearSky,
    icon: 'sun',
    description: 'Clear skies',
  },
  partlyCloudy: {
    color: dragonLightColors.weatherPartlyCloud,
    background: dragonLightGradients.partlyCloudy,
    icon: 'cloud-sun',
    description: 'Partly cloudy',
  },
  cloudy: {
    color: dragonLightColors.weatherCloudy,
    background: dragonLightGradients.cloudy,
    icon: 'cloud',
    description: 'Cloudy',
  },
  overcast: {
    color: dragonLightColors.weatherCloudy,
    background: dragonLightGradients.cloudy,
    icon: 'clouds',
    description: 'Overcast',
  },
  rain: {
    color: dragonLightColors.weatherRain,
    background: dragonLightGradients.rainy,
    icon: 'cloud-rain',
    description: 'Rain',
  },
  storm: {
    color: dragonLightColors.weatherStorm,
    background: dragonLightGradients.rainy,
    icon: 'cloud-lightning',
    description: 'Thunderstorm',
  },
};

// Racing-specific styling utilities
export const dragonRacingUtils = {
  // Wind condition assessment for light theme
  getWindConditionStyle: (windSpeed: number) => {
    if (windSpeed < 5) {
      return {
        color: dragonLightColors.windLight,
        background: '#E8F5E8',
        description: 'Light winds',
        racing: 'challenging',
      };
    } else if (windSpeed < 12) {
      return {
        color: dragonLightColors.windModerate,
        background: '#E6F3FF',
        description: 'Moderate winds',
        racing: 'optimal',
      };
    } else if (windSpeed < 20) {
      return {
        color: dragonLightColors.windStrong,
        background: '#FFF3E6',
        description: 'Strong winds',
        racing: 'challenging',
      };
    } else {
      return {
        color: dragonLightColors.windGale,
        background: '#FFE6E6',
        description: 'Gale force',
        racing: 'dangerous',
      };
    }
  },
  
  // Start line bias visualization
  getStartLineBias: (bias: number) => {
    if (Math.abs(bias) < 5) {
      return {
        color: dragonLightColors.startLineNeutral,
        description: 'Neutral line',
        advice: 'Start anywhere with clear air',
      };
    } else if (Math.abs(bias) < 15) {
      const favored = bias > 0 ? 'starboard' : 'port';
      return {
        color: dragonLightColors.startLineFavored,
        description: `Slight ${favored} bias`,
        advice: `Consider ${favored} end`,
      };
    } else {
      const favored = bias > 0 ? 'starboard' : 'port';
      return {
        color: dragonLightColors.startLineFavored,
        description: `Strong ${favored} bias`,
        advice: `Start at ${favored} end`,
      };
    }
  },
  
  // Racing condition scoring
  getRacingScore: (windSpeed: number, precipChance: number, visibility: number) => {
    let score = 100;
    
    // Wind speed factor
    if (windSpeed < 3 || windSpeed > 25) score -= 40;
    else if (windSpeed < 5 || windSpeed > 20) score -= 20;
    else if (windSpeed >= 8 && windSpeed <= 15) score += 20;
    
    // Precipitation factor
    if (precipChance > 50) score -= 30;
    else if (precipChance > 20) score -= 10;
    
    // Visibility factor
    if (visibility < 5) score -= 20;
    else if (visibility < 10) score -= 10;
    
    const normalizedScore = Math.max(0, Math.min(100, score));
    
    if (normalizedScore >= 80) {
      return {
        score: normalizedScore,
        condition: 'optimal',
        color: dragonLightColors.racingOptimal,
        description: 'Perfect racing conditions',
      };
    } else if (normalizedScore >= 60) {
      return {
        score: normalizedScore,
        condition: 'good',
        color: dragonLightColors.racingGood,
        description: 'Good racing conditions',
      };
    } else if (normalizedScore >= 40) {
      return {
        score: normalizedScore,
        condition: 'challenging',
        color: dragonLightColors.racingChallenging,
        description: 'Challenging conditions',
      };
    } else if (normalizedScore >= 20) {
      return {
        score: normalizedScore,
        condition: 'poor',
        color: dragonLightColors.racingPoor,
        description: 'Poor racing conditions',
      };
    } else {
      return {
        score: normalizedScore,
        condition: 'dangerous',
        color: dragonLightColors.racingDangerous,
        description: 'Dangerous conditions',
      };
    }
  },
};

// Main theme export combining all systems
export const dragonChampionshipsLightTheme = {
  colors: dragonLightColors,
  gradients: dragonLightGradients,
  typography: dragonLightTypography,
  spacing: dragonLightSpacing,
  borderRadius: dragonLightBorderRadius,
  shadows: dragonLightShadows,
  animations: dragonLightAnimations,
  weatherConditions: dragonWeatherConditions,
  racingUtils: dragonRacingUtils,
};

export default dragonChampionshipsLightTheme;