import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const TestComponent: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🎯 NEW DARK SKY COMPONENTS LOADED! 🎯</Text>
      <Text style={styles.subtext}>If you see this, our components are working!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ff0000',
    padding: 20,
    margin: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtext: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
});