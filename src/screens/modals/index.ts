// Modal Screen Components - iOS Design Guidelines Compliant
// Export all modal components for easy importing

export { EventDetailModal } from './EventDetailModal';
export { WeatherDetailModal } from './WeatherDetailModal';
export { LocationDetailModal } from './LocationDetailModal';
export { SubscriptionModal } from './SubscriptionModal';

// Export common types used across modals
export interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
}

export interface SponsorArea {
  titlePrefix?: string;
  footer?: string;
  logoPlaceholder?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}