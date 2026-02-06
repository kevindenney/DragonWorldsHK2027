/**
 * Web fallback for ModernWeatherMapScreen
 * react-native-maps is not available on web platform
 */

import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Map, ChevronLeft } from 'lucide-react-native';

export function ModernWeatherMapScreen({ onBack }: { onBack?: () => void }) {
  return (
    <View style={styles.container}>
      {onBack && (
        <SafeAreaView style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ChevronLeft size={24} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        </SafeAreaView>
      )}

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Map size={64} color="#666666" />
        </View>
        <Text style={styles.title}>Weather Map Not Available</Text>
        <Text style={styles.subtitle}>
          The interactive weather map is only available on iOS and Android devices.
        </Text>
        <Text style={styles.hint}>
          Please use the mobile app to view real-time weather conditions, wind data, and tide information for Hong Kong sailing areas.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    marginTop: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  hint: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ModernWeatherMapScreen;
