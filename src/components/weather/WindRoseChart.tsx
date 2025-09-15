import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeInDown } from '../../utils/reanimatedWrapper';
import { Navigation, ArrowUp } from 'lucide-react-native';
import { colors, typography, spacing } from '../../constants/theme';
import { darkSkyColors, darkSkyTypography, darkSkySpacing } from '../../constants/darkSkyTheme';

const { width } = Dimensions.get('window');

interface WindData {
  direction: number;
  speed: number;
  timestamp: string;
  gust?: number;
}

interface WindRoseChartProps {
  windHistory: WindData[];
  currentWind: {
    direction: number;
    speed: number;
    gust?: number;
  };
  showRacingLines?: boolean;
  courseBearing?: number; // Race course bearing for tactical display
}

export const WindRoseChart: React.FC<WindRoseChartProps> = ({
  windHistory,
  currentWind,
  showRacingLines = false,
  courseBearing = 0
}) => {
  const chartSize = Math.min(width - (spacing.lg * 2), 300);
  const center = chartSize / 2;
  const radius = center - 40;

  // Group wind data by direction sectors
  const getWindSectors = () => {
    const sectors: { [key: number]: WindData[] } = {};
    const sectorSize = 22.5; // 16 sectors
    
    windHistory.forEach(wind => {
      const sector = Math.round(wind.direction / sectorSize) * sectorSize;
      if (!sectors[sector]) sectors[sector] = [];
      sectors[sector].push(wind);
    });

    return sectors;
  };

  const windSectors = getWindSectors();

  const getWindStrengthColor = (speed: number): string => {
    if (speed < 5) return darkSkyColors.windCalm;
    if (speed < 10) return darkSkyColors.windLight;
    if (speed < 15) return darkSkyColors.windModerate;
    if (speed < 20) return darkSkyColors.windFresh;
    if (speed < 25) return darkSkyColors.windStrong;
    return darkSkyColors.windGale;
  };

  const getSectorFrequency = (sector: number): number => {
    return windSectors[sector]?.length || 0;
  };

  const getSectorAverageSpeed = (sector: number): number => {
    const sectorData = windSectors[sector];
    if (!sectorData || sectorData.length === 0) return 0;
    return sectorData.reduce((sum, wind) => sum + wind.speed, 0) / sectorData.length;
  };

  const renderCompassRose = () => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const directionAngles = [0, 45, 90, 135, 180, 225, 270, 315];

    return directions.map((direction, index) => {
      const angle = directionAngles[index];
      const radian = (angle * Math.PI) / 180;
      const labelRadius = radius + 25;
      const x = center + Math.cos(radian - Math.PI / 2) * labelRadius;
      const y = center + Math.sin(radian - Math.PI / 2) * labelRadius;

      return (
        <View
          key={direction}
          style={[
            styles.compassLabel,
            {
              position: 'absolute',
              left: x - 12,
              top: y - 12,
            }
          ]}
        >
          <Text style={styles.compassText}>{direction}</Text>
        </View>
      );
    });
  };

  const renderWindSectors = () => {
    const sectorElements: JSX.Element[] = [];
    const maxFrequency = Math.max(...Object.values(windSectors).map(sector => sector.length));

    // Render frequency bars for each sector
    for (let angle = 0; angle < 360; angle += 22.5) {
      const frequency = getSectorFrequency(angle);
      const averageSpeed = getSectorAverageSpeed(angle);
      
      if (frequency === 0) continue;

      const radian = (angle * Math.PI) / 180;
      const barLength = (frequency / maxFrequency) * (radius * 0.8);
      const barWidth = 8;
      
      const startX = center + Math.cos(radian - Math.PI / 2) * 20;
      const startY = center + Math.sin(radian - Math.PI / 2) * 20;
      const endX = center + Math.cos(radian - Math.PI / 2) * (20 + barLength);
      const endY = center + Math.sin(radian - Math.PI / 2) * (20 + barLength);

      sectorElements.push(
        <View
          key={`sector-${angle}`}
          style={[
            styles.windSector,
            {
              position: 'absolute',
              left: startX,
              top: startY,
              width: Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)),
              height: barWidth,
              backgroundColor: getWindStrengthColor(averageSpeed),
              transform: [
                { rotate: `${angle}deg` },
                { translateX: -barWidth / 2 }
              ],
              opacity: 0.8,
            }
          ]}
        />
      );

      // Add speed labels for significant sectors
      if (frequency > maxFrequency * 0.3) {
        const labelX = center + Math.cos(radian - Math.PI / 2) * (radius + 10);
        const labelY = center + Math.sin(radian - Math.PI / 2) * (radius + 10);

        sectorElements.push(
          <View
            key={`label-${angle}`}
            style={[
              styles.speedLabel,
              {
                position: 'absolute',
                left: labelX - 15,
                top: labelY - 8,
              }
            ]}
          >
            <Text style={styles.speedText}>{Math.round(averageSpeed)}</Text>
          </View>
        );
      }
    }

    return sectorElements;
  };

  const renderCurrentWindIndicator = () => {
    const radian = (currentWind.direction * Math.PI) / 180;
    const indicatorLength = radius * 0.9;
    const x = center + Math.cos(radian - Math.PI / 2) * indicatorLength;
    const y = center + Math.sin(radian - Math.PI / 2) * indicatorLength;

    return (
      <View
        style={[
          styles.currentWindIndicator,
          {
            position: 'absolute',
            left: x - 15,
            top: y - 15,
            transform: [{ rotate: `${currentWind.direction}deg` }],
          }
        ]}
      >
        <ArrowUp 
          color={getWindStrengthColor(currentWind.speed)} 
          size={30}
          strokeWidth={3}
        />
      </View>
    );
  };

  const renderRacingLines = () => {
    if (!showRacingLines) return null;

    const elements: JSX.Element[] = [];
    
    // Course line
    const courseRadian = (courseBearing * Math.PI) / 180;
    const courseX1 = center + Math.cos(courseRadian - Math.PI / 2) * 30;
    const courseY1 = center + Math.sin(courseRadian - Math.PI / 2) * 30;
    const courseX2 = center + Math.cos(courseRadian - Math.PI / 2) * radius;
    const courseY2 = center + Math.sin(courseRadian - Math.PI / 2) * radius;

    elements.push(
      <View
        key="course-line"
        style={[
          styles.courseLine,
          {
            position: 'absolute',
            left: Math.min(courseX1, courseX2),
            top: Math.min(courseY1, courseY2),
            width: Math.abs(courseX2 - courseX1),
            height: Math.abs(courseY2 - courseY1),
          }
        ]}
      />
    );

    // Laylines (±45 degrees from current wind)
    const laylineAngles = [
      currentWind.direction - 45,
      currentWind.direction + 45
    ];

    laylineAngles.forEach((angle, index) => {
      const radian = (angle * Math.PI) / 180;
      const x1 = center + Math.cos(radian - Math.PI / 2) * 30;
      const y1 = center + Math.sin(radian - Math.PI / 2) * 30;
      const x2 = center + Math.cos(radian - Math.PI / 2) * radius;
      const y2 = center + Math.sin(radian - Math.PI / 2) * radius;

      elements.push(
        <View
          key={`layline-${index}`}
          style={[
            styles.layline,
            {
              position: 'absolute',
              left: Math.min(x1, x2),
              top: Math.min(y1, y2),
              width: Math.abs(x2 - x1),
              height: Math.abs(y2 - y1),
            }
          ]}
        />
      );
    });

    return elements;
  };

  const getPredominantDirection = (): string => {
    let maxFrequency = 0;
    let predominantSector = 0;

    Object.entries(windSectors).forEach(([sector, data]) => {
      if (data.length > maxFrequency) {
        maxFrequency = data.length;
        predominantSector = parseInt(sector);
      }
    });

    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(predominantSector / 22.5) % 16;
    return directions[index];
  };

  return (
    <Animated.View style={styles.container} entering={FadeInDown.delay(300)}>
      <Text style={styles.title}>Wind Rose Analysis</Text>
      
      <View style={[styles.chartContainer, { width: chartSize, height: chartSize }]}>
        {/* Concentric circles */}
        <View style={[styles.circle, styles.outerCircle, { width: radius * 2, height: radius * 2 }]} />
        <View style={[styles.circle, styles.middleCircle, { width: radius * 1.3, height: radius * 1.3 }]} />
        <View style={[styles.circle, styles.innerCircle, { width: radius * 0.6, height: radius * 0.6 }]} />

        {/* Center dot */}
        <View style={styles.centerDot} />

        {/* Compass rose labels */}
        {renderCompassRose()}

        {/* Wind frequency sectors */}
        {renderWindSectors()}

        {/* Racing lines */}
        {renderRacingLines()}

        {/* Current wind indicator */}
        {renderCurrentWindIndicator()}
      </View>

      {/* Wind statistics */}
      <View style={styles.statisticsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Current</Text>
          <Text style={styles.statValue}>
            {currentWind.speed}kts @ {currentWind.direction}°
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Predominant</Text>
          <Text style={styles.statValue}>
            {getPredominantDirection()}
          </Text>
        </View>

        {showRacingLines && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Course</Text>
            <Text style={styles.statValue}>{courseBearing}°</Text>
          </View>
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Wind Speed (kts)</Text>
        <View style={styles.legendItems}>
          {[
            { range: '0-5', color: darkSkyColors.windCalm, label: 'Calm' },
            { range: '5-10', color: darkSkyColors.windLight, label: 'Light' },
            { range: '10-15', color: darkSkyColors.windModerate, label: 'Moderate' },
            { range: '15-20', color: darkSkyColors.windFresh, label: 'Fresh' },
            { range: '20+', color: darkSkyColors.windStrong, label: 'Strong' },
          ].map((item) => (
            <View key={item.range} style={styles.legendItem}>
              <View style={[styles.legendColorBar, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkSkyColors.cardBackground,
    borderRadius: darkSkySpacing.cardRadius,
    padding: darkSkySpacing.cardPadding,
    marginVertical: darkSkySpacing.cardMargin,
    borderWidth: 1,
    borderColor: darkSkyColors.cardBorder,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: darkSkyColors.textPrimary,
    marginBottom: spacing.md,
  },
  chartContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: darkSkyColors.cardBorder,
  },
  outerCircle: {
    opacity: 0.3,
  },
  middleCircle: {
    opacity: 0.2,
  },
  innerCircle: {
    opacity: 0.1,
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: darkSkyColors.accent,
    position: 'absolute',
  },
  compassLabel: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassText: {
    fontSize: 12,
    fontWeight: '600',
    color: darkSkyColors.textSecondary,
  },
  windSector: {
    borderRadius: 2,
  },
  speedLabel: {
    backgroundColor: darkSkyColors.backgroundTertiary,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: darkSkyColors.cardBorder,
  },
  speedText: {
    fontSize: 9,
    color: darkSkyColors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  currentWindIndicator: {
    zIndex: 10,
  },
  courseLine: {
    backgroundColor: darkSkyColors.racingIdeal,
    height: 2,
    opacity: 0.8,
  },
  layline: {
    backgroundColor: darkSkyColors.warning,
    height: 1,
    opacity: 0.6,
  },
  statisticsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: darkSkyColors.cardBorder,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: darkSkyColors.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: darkSkyColors.textPrimary,
    textAlign: 'center',
  },
  legend: {
    width: '100%',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: darkSkyColors.cardBorder,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: darkSkyColors.textSecondary,
    marginBottom: spacing.xs,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    alignItems: 'center',
  },
  legendColorBar: {
    width: 20,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  legendText: {
    fontSize: 10,
    color: darkSkyColors.textMuted,
  },
});