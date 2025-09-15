/**
 * Minimal stubs for map components to prevent import errors
 * These components are not functional - they just prevent crashes
 */

import React from 'react';
import { View } from 'react-native';

// Minimal stub components that don't render anything functional
export const MapView = ({ children, ...props }: any) => <View {...props}>{children}</View>;
export const Marker = ({ children, ...props }: any) => <View {...props}>{children}</View>;
export const Heatmap = ({ children, ...props }: any) => <View {...props}>{children}</View>;
export const Circle = ({ children, ...props }: any) => <View {...props}>{children}</View>;
export const Polygon = ({ children, ...props }: any) => <View {...props}>{children}</View>;
export const Polyline = ({ children, ...props }: any) => <View {...props}>{children}</View>;

// Constants
export const PROVIDER_GOOGLE = 'google';

// Default export
export default MapView;