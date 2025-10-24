import React from 'react';
import { View, Text, Modal, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';

/**
 * SIMPLE SCROLL TEST - Use this to verify basic scrolling works on Android
 *
 * To test:
 * 1. Import this in your map screen
 * 2. Show it with: <SimpleScrollTest visible={true} onClose={() => {}} />
 * 3. Try scrolling - does the red box scroll?
 *
 * If this DOESN'T scroll, the issue is Modal + Android fundamental incompatibility
 * If this DOES scroll, the issue is in our LocationDetailModal layout
 */
export const SimpleScrollTest: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <TouchableOpacity onPress={onClose} style={{ padding: 20, backgroundColor: 'blue' }}>
          <Text style={{ color: 'white' }}>Close Test</Text>
        </TouchableOpacity>

        <ScrollView
          style={{ flex: 1 }}
          onLayout={(e) => console.log('[TEST ScrollView] Layout:', e.nativeEvent.layout)}
          onContentSizeChange={(w, h) => console.log('[TEST ScrollView] Content size:', { width: w, height: h })}
        >
          <View style={{ height: 2000, backgroundColor: 'red', padding: 20 }}>
            <Text style={{ fontSize: 24, marginBottom: 20 }}>
              SCROLL TEST - This box is 2000px tall
            </Text>
            <Text>If you can scroll and see this text, basic scrolling works!</Text>
            {Array.from({ length: 50 }).map((_, i) => (
              <Text key={i} style={{ marginTop: 10 }}>
                Line {i + 1}
              </Text>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};
