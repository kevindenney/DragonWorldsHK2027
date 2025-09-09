# Dragon World Championships 2027 - Design Guidelines

## Overview
This document outlines the design principles, visual standards, and implementation guidelines for the Dragon World Championships 2027 mobile application. The app serves as the official companion for the sailing regatta, providing live race data, weather information, social features, and participant services.

## Apple Human Interface Guidelines Compliance
- Use iOS navigation patterns (tab bars, navigation bars, modals)
- Follow 8pt grid system for spacing
- Minimum 44pt touch targets
- SF Pro font family with Apple's typography scale
- iOS color system (label, secondaryLabel, systemBackground)
- Standard iOS component patterns and animations
- Proper safe area handling for all devices
- iOS accessibility features (VoiceOver, Dynamic Type)

### Apple Typography Scale
- **Large Title**: 34pt
- **Title 1**: 28pt  
- **Title 2**: 22pt
- **Headline**: 17pt semibold
- **Body**: 17pt
- **Callout**: 16pt

### Apple Spacing System
- **Standard Units**: 4pt, 8pt, 12pt, 16pt, 20pt, 24pt, 32pt, 40pt

### Apple Component Standards
- **Corner radius**: 8pt, 12pt, 16pt
- **Cards**: 12pt corner radius with subtle shadow
- **Lists**: iOS TableView patterns
- **Buttons**: iOS standard button styles

## Design Philosophy

### Core Principles
1. **Professional Excellence**: Reflect the prestige and professionalism of world-class sailing competition
2. **Maritime Heritage**: Honor sailing traditions while embracing modern technology
3. **Accessibility First**: Ensure usability in challenging marine environments and various lighting conditions
4. **Performance Focused**: Prioritize speed and reliability for real-time race data
5. **Sponsor Integration**: Seamlessly incorporate sponsor branding without compromising user experience

### Target Audience
- **Primary**: Race participants, officials, and sailing enthusiasts
- **Secondary**: Spectators, media, and general sailing community
- **Tertiary**: Sponsors and maritime industry professionals

## Visual Identity

### Color Palette

#### Primary Colors
- **Sailing Blue**: `#2B5CE6` - Primary brand color representing ocean and sky
- **Championship Gold**: `#FFD700` - Secondary color for achievements and premium features
- **Racing Cyan**: `#00BCD4` - Accent color for interactive elements

#### Supporting Colors
- **Background White**: `#FFFFFF` - Clean, professional backgrounds
- **Surface Gray**: `#F8FAFB` - Card backgrounds and subtle divisions
- **Text Primary**: `#1A1A1A` - High contrast for readability
- **Text Secondary**: `#4A5568` - Supporting information
- **Text Muted**: `#718096` - Less important details

#### Status Colors
- **Success Green**: `#10B981` - Green flag, completed states
- **Warning Amber**: `#F59E0B` - Yellow flag, caution states
- **Error Red**: `#EF4444` - Red flag, urgent alerts
- **Info Blue**: `#3B82F6` - Blue flag, informational content

#### Marine Weather Colors
- **Calm**: `#10B981` (Green) - 0-3 knots
- **Light**: `#3B82F6` (Blue) - 4-10 knots
- **Moderate**: `#F59E0B` (Amber) - 11-16 knots
- **Strong**: `#EF4444` (Red) - 17-25 knots
- **Gale**: `#8B0000` (Dark Red) - 26+ knots

### Typography

#### Font System
- **Primary**: System fonts (iOS: San Francisco, Android: Roboto)
- **Weight Range**: 100-900 with emphasis on 400 (regular), 600 (semibold), 700 (bold)

#### Hierarchy
```
H1: 32px/40px, Weight 700, -0.5px letter spacing
H2: 28px/36px, Weight 600, -0.25px letter spacing
H3: 24px/32px, Weight 600, 0px letter spacing
H4: 20px/28px, Weight 600, 0.25px letter spacing
H5: 18px/24px, Weight 500, 0px letter spacing
H6: 16px/22px, Weight 500, 0.15px letter spacing
Body1: 16px/24px, Weight 400, 0.5px letter spacing
Body2: 14px/20px, Weight 400, 0.25px letter spacing
Caption: 12px/16px, Weight 400, 0.4px letter spacing
Button: 16px/20px, Weight 600, 0.75px letter spacing
```

### Spacing System

#### Base Unit: 8px
- **XS**: 4px (0.5 units)
- **SM**: 8px (1 unit)
- **MD**: 16px (2 units)
- **LG**: 24px (3 units)
- **XL**: 32px (4 units)
- **XXL**: 48px (6 units)
- **XXXL**: 64px (8 units)

#### Component Spacing
- **Cards**: 16px internal padding, 8px external margins
- **Buttons**: 16px horizontal, 12px vertical padding
- **Lists**: 8px between items, 16px section spacing
- **Headers**: 24px top/bottom padding

### Iconography

#### Icon System
- **Primary Library**: Lucide React Native
- **Size Standards**: 16px, 20px, 24px, 32px, 48px
- **Style**: Consistent stroke width (2px), rounded corners
- **Color**: Match text hierarchy (primary, secondary, muted)

#### Navigation Icons
- **Live**: Activity icon
- **Weather**: Cloud icon
- **Schedule**: Calendar icon
- **Social**: Users icon
- **Services**: Settings icon

#### Contextual Icons
- **Race Status**: Anchor, Trophy, Flag variations
- **Weather**: Wind, Thermometer, Eye, Waves
- **Actions**: Map, Phone, Bell, Share
- **Premium**: Crown, Star, Lock icons

### Elevation & Shadows

#### Shadow Levels
```
Small: iOS (0, 1, 0.1, 2) | Android (elevation: 2)
Medium: iOS (0, 2, 0.15, 4) | Android (elevation: 4)
Large: iOS (0, 4, 0.2, 8) | Android (elevation: 8)
Card: iOS (0, 2, 0.1, 3) | Android (elevation: 3)
Button: iOS (0, 1, 0.2, 2) | Android (elevation: 2)
Modal: iOS (0, 8, 0.25, 16) | Android (elevation: 16)
```

### Border Radius

#### Radius Scale
- **None**: 0px - Sharp corners for technical elements
- **XS**: 2px - Small UI elements
- **SM**: 4px - Input fields, small buttons
- **MD**: 8px - Cards, medium components
- **LG**: 12px - Large cards, modal corners
- **XL**: 16px - Hero elements, major cards
- **Round**: 999px - Pills, circular elements

## Component Design Standards

### Buttons

#### Primary Button
- **Background**: Sailing Blue (#2B5CE6)
- **Text**: White
- **Height**: 44px (medium), 32px (small), 56px (large)
- **Border Radius**: 8px
- **Shadow**: Button level elevation

#### Secondary Button
- **Background**: Transparent
- **Border**: 1px Sailing Blue
- **Text**: Sailing Blue
- **Same dimensions as primary**

#### Text Button
- **Background**: Transparent
- **Text**: Sailing Blue
- **No border or shadow**

### Cards

#### Standard Card
- **Background**: Surface Gray (#F8FAFB)
- **Border Radius**: 12px
- **Padding**: 16px
- **Shadow**: Card level elevation
- **Border**: None (elevation provides separation)

#### Premium Card
- **Border**: 2px Championship Gold (#FFD700)
- **Background**: White with gold accent
- **Special crown icon indicator**

#### Urgent/Alert Card
- **Left Border**: 4px Warning/Error color
- **Background**: Surface Gray
- **Icon**: Matching alert level color

### Navigation

#### Tab Bar
- **Height**: 60px
- **Background**: Surface Gray
- **Active Color**: Sailing Blue
- **Inactive Color**: Text Muted
- **Icon Size**: 24px
- **Border Top**: 1px Border Light

#### Stack Navigation
- **Header Height**: 56px
- **Background**: White
- **Title**: H6 typography
- **Back Button**: Sailing Blue

### Forms & Inputs

#### Text Input
- **Height**: 44px
- **Padding**: 16px horizontal
- **Border**: 1px Border Light
- **Border Radius**: 8px
- **Focus State**: Sailing Blue border
- **Error State**: Error Red border

#### Selection Controls
- **Checkboxes**: 20px, Border Radius 4px
- **Radio Buttons**: 20px, circular
- **Switches**: iOS/Android platform standard
- **Active Color**: Sailing Blue

## Layout Guidelines

### Grid System
- **Margins**: 16px (left/right screen edges)
- **Gutters**: 16px (between grid columns)
- **Columns**: Flexible based on content
- **Breakpoints**: Responsive design for tablets

### Content Hierarchy
1. **Primary Actions**: Prominent placement, primary styling
2. **Secondary Actions**: Supporting placement, secondary styling
3. **Tertiary Actions**: Minimal styling, text-based
4. **Information Display**: Clear hierarchy with typography scale

### Safe Areas
- **Top**: Account for status bar and notches
- **Bottom**: Account for home indicator and tab bars
- **Sides**: Consistent 16px margins on all devices

## Interaction Design

### Touch Targets
- **Minimum Size**: 44px x 44px (Apple/Google recommendations)
- **Optimal Size**: 48px x 48px for primary actions
- **Spacing**: 8px minimum between touch targets

### Feedback
- **Visual**: Color change, opacity, or scale on press
- **Haptic**: Light feedback for confirmations, medium for alerts
- **Audio**: Optional, respecting system settings

### Animations
- **Duration**: 200-300ms for micro-interactions
- **Easing**: Standard platform curves (ease-out for iOS, acceleration/deceleration for Android)
- **Purpose**: Provide context and smooth transitions

### Loading States
- **Skeleton Screens**: For content loading
- **Spinners**: For short operations (<2 seconds)
- **Progress Bars**: For measurable operations
- **Pull-to-Refresh**: Standard platform implementation

## Accessibility

### Color Contrast
- **Normal Text**: 4.5:1 minimum ratio
- **Large Text**: 3:1 minimum ratio
- **UI Components**: 3:1 minimum ratio
- **Test Tools**: Color Oracle, Stark, WebAIM

### Typography
- **Dynamic Type**: Support system font size preferences
- **Minimum Size**: 12px for caption text
- **Maximum Size**: Reasonable scaling for large accessibility sizes

### Navigation
- **Focus Indicators**: Clear visual focus states
- **Screen Reader**: Proper labeling and navigation order
- **Voice Control**: Support platform voice navigation

### Content
- **Alt Text**: Descriptive text for all images
- **Captions**: Video content accessibility
- **Clear Language**: Avoid jargon, provide definitions

## Platform Considerations

### iOS Specific
- **Safe Area**: Respect notch and home indicator
- **Navigation**: Platform-standard back gesture and navigation
- **Typography**: San Francisco font family
- **Shadows**: Use iOS shadow properties

### Android Specific
- **Material Design**: Follow key Material Design principles
- **Navigation**: Support Android back button and gesture navigation
- **Typography**: Roboto font family
- **Elevation**: Use Android elevation system

### Cross-Platform Consistency
- **Core Experience**: Identical functionality and information architecture
- **Platform Adaptation**: UI follows platform conventions
- **Brand Consistency**: Colors, spacing, and key visual elements remain consistent

## Sponsor Integration Guidelines

### Brand Guidelines
- **Respect**: Maintain sponsor brand integrity
- **Integration**: Seamless incorporation without UX disruption
- **Hierarchy**: Primary app branding takes precedence
- **Consistency**: Uniform treatment across sponsor content

### Placement Areas
- **Header Banners**: Minimal height, clear messaging
- **Inline Cards**: Between content sections, labeled as sponsored
- **Premium Indicators**: Crown icons for premium sponsors
- **Footer Attribution**: Data source and partnership acknowledgments

### Content Standards
- **Relevance**: Sponsor content must relate to sailing/marine context
- **Quality**: Professional imagery and copy standards
- **Performance**: No impact on app loading or functionality
- **User Control**: Clear identification and optional interaction

## Data Visualization

### Weather Data
- **Wind Direction**: Compass icons with rotation
- **Wind Speed**: Color-coded based on marine weather scale
- **Trends**: Arrow indicators for increasing/decreasing patterns
- **Forecasts**: Horizontal scrolling cards with clear time indicators

### Race Data
- **Live Positions**: Real-time updates with smooth transitions
- **Results**: Clear hierarchy with position, boat number, country
- **Timing**: Large, prominent display for current race time
- **Status**: Color-coded indicators (green, yellow, red flags)

### Charts & Graphs
- **Simple**: Avoid complexity in mobile environment
- **Responsive**: Adapt to different screen sizes
- **Interactive**: Touch-friendly interaction zones
- **Accessible**: Support screen readers and alternative input methods

## Content Strategy

### Tone of Voice
- **Professional**: Authoritative and knowledgeable
- **Accessible**: Clear to both experts and newcomers
- **Exciting**: Capture the thrill of competitive sailing
- **International**: Respectful of global sailing community

### Content Hierarchy
1. **Critical Information**: Safety, race status, urgent weather
2. **Primary Content**: Live results, current conditions, schedule
3. **Secondary Content**: Historical data, detailed analysis, social
4. **Tertiary Content**: Background information, context, entertainment

### Internationalization
- **Multi-language Support**: English primary, with localization framework
- **Cultural Sensitivity**: Respect for international participants
- **Time Zones**: Clear indication of local vs. UTC times
- **Units**: Metric system primary, with optional imperial conversion

## Quality Assurance

### Testing Requirements
- **Device Testing**: iOS and Android across multiple screen sizes
- **Performance**: 60fps animations, <3 second load times
- **Network**: Graceful degradation for poor connectivity
- **Accessibility**: Screen reader and voice control testing

### Review Process
1. **Design Review**: Stakeholder approval before development
2. **Development Review**: Code review for design implementation
3. **Testing Review**: QA verification of design standards
4. **User Testing**: Validation with target user groups

### Maintenance
- **Design System Updates**: Regular review and iteration
- **Component Library**: Maintain centralized design components
- **Documentation**: Keep guidelines current with app evolution
- **Feedback Integration**: Incorporate user and stakeholder feedback

---

## Implementation Notes

This design system is implemented in the codebase through:
- `src/constants/theme.ts` - Color palette, typography, spacing, and component constants
- React Native StyleSheet patterns following these guidelines
- Consistent component architecture across all screens
- TypeScript interfaces ensuring design system adherence

For questions or clarifications about these guidelines, refer to the design system implementation in the codebase or contact the development team.