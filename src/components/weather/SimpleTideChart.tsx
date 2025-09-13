import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { IOSText } from '../ios/IOSText';
import { TrendingUp } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface TidePoint {
  time: string;
  height: number;
}

interface SimpleTideChartProps {
  tideData: TidePoint[];
  currentHeight: number;
}

export const SimpleTideChart: React.FC<SimpleTideChartProps> = ({
  tideData,
  currentHeight
}) => {
  const chartWidth = width - 64; // Account for padding
  const chartHeight = 80; // Reduced height for cleaner look
  
  // Simpler tide pattern for cleaner visualization
  const simpleTidePoints = [
    { x: 0, y: 40 },
    { x: chartWidth * 0.25, y: 20 },
    { x: chartWidth * 0.5, y: 60 },
    { x: chartWidth * 0.75, y: 15 },
    { x: chartWidth, y: 50 }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TrendingUp size={20} color="#007AFF" />
        <IOSText textStyle="headline" weight="semibold" style={styles.title}>
          Tide Trend
        </IOSText>
      </View>
      
      <View style={styles.chartContainer}>
        <View style={[styles.chartArea, { width: chartWidth, height: chartHeight }]}>
          {/* Simplified line segments */}
          {simpleTidePoints.map((point, index) => {
            if (index === 0) return null;
            const prevPoint = simpleTidePoints[index - 1];
            const lineWidth = Math.sqrt(
              Math.pow(point.x - prevPoint.x, 2) + 
              Math.pow(point.y - prevPoint.y, 2)
            );
            const angle = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x) * 180 / Math.PI;
            
            return (
              <View
                key={index}
                style={[
                  styles.lineSegment,
                  {
                    position: 'absolute',
                    left: prevPoint.x,
                    top: prevPoint.y,
                    width: lineWidth,
                    transform: [{ rotate: `${angle}deg` }]
                  }
                ]}
              />
            );
          })}
          
          {/* Time labels positioned at bottom */}
          <View style={styles.timeLabels}>
            {['03:00', '09:00', '15:00', '21:00'].map((time) => (
              <IOSText 
                key={time} 
                textStyle="caption1" 
                color="secondaryLabel" 
                style={styles.timeLabel}
              >
                {time}
              </IOSText>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  title: {
    color: '#000000',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartArea: {
    position: 'relative',
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 32,
  },
  lineSegment: {
    height: 2.5,
    backgroundColor: '#007AFF',
    borderRadius: 1.25,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
  },
  timeLabel: {
    color: '#8E8E93',
    fontSize: 11,
  },
});