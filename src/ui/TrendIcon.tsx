import React from 'react';
import {Text} from 'react-native';

interface TrendIconProps {
  value: 'up' | 'down' | 'flat';
  size?: number;
}

export default function TrendIcon({value, size = 12}: TrendIconProps) {
  const colors = {
    up: '#16a34a',    // green
    down: '#dc2626',  // red
    flat: '#64748b'   // gray
  };

  const icons = {
    up: '▲',
    down: '▼',
    flat: '→'
  };

  return (
    <Text style={{
      color: colors[value],
      fontSize: size,
      marginLeft: 4
    }}>
      {icons[value]}
    </Text>
  );
}