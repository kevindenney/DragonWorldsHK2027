// iOS Component Library - Apple Human Interface Guidelines Compliant
// Foundational components that strictly follow Apple HIG standards

export { IOSButton } from './IOSButton';
export type { IOSButtonProps, IOSButtonVariant, IOSButtonSize } from './IOSButton';

export { IOSCard } from './IOSCard';
export type { IOSCardProps, IOSCardVariant } from './IOSCard';

export { IOSList, IOSListSection } from './IOSList';
export type { 
  IOSListProps, 
  IOSListItem, 
  IOSListSectionProps 
} from './IOSList';

export { IOSModal, IOSActionSheet } from './IOSModal';
export type { 
  IOSModalProps, 
  IOSModalPresentationStyle,
  IOSActionSheetProps 
} from './IOSModal';

export { IOSNavigationBar } from './IOSNavigationBar';
export type { 
  IOSNavigationBarProps, 
  IOSNavigationAction,
  IOSNavigationBarStyle 
} from './IOSNavigationBar';

export { IOSText } from './IOSText';
export type { IOSTextProps, IOSTextStyle, IOSTextWeight } from './IOSText';

export { IOSBadge } from './IOSBadge';
export type { IOSBadgeProps, IOSBadgeVariant, IOSBadgeColor, IOSBadgeSize } from './IOSBadge';

export { IOSSection, IOSContentGroup } from './IOSSection';
export type { IOSSectionProps, IOSContentGroupProps } from './IOSSection';

export { IOSSegmentedControl } from './IOSSegmentedControl';
export type { IOSSegmentedControlProps, IOSSegmentedControlOption } from './IOSSegmentedControl';

// Type definitions and HIG specifications
export type {
  IOSComponentBase,
  IOSSystemColors,
  IOSTypographyStyle,
  IOSTypographyScale,
  IOSSpacing,
  IOSComponentSizes,
  IOSButtonHIGSpec,
  IOSListHIGSpec,
  IOSModalHIGSpec,
  IOSNavigationBarHIGSpec,
  IOSCardHIGSpec,
  IOSHIGSpecification,
  IOSDynamicTypeSupport,
  IOSAccessibilitySupport,
} from './types';