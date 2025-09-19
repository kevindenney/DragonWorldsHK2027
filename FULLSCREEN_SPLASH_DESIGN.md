# Full-Screen Dragon Worlds HK 2027 Splash Screen Design

## Design Specifications

### Image Dimensions
- **Primary**: 1080 x 1920 pixels (9:16 aspect ratio for mobile)
- **Tablet**: 1536 x 2048 pixels (3:4 aspect ratio for iPad)
- **Format**: PNG with transparency support
- **File name**: `splash-dragon-worlds-fullscreen.png`

### Layout Design

#### Background
- **Color**: #DC2626 (current app red theme)
- **Style**: Solid color fill

#### Logo Placement
- **Position**: Upper center of screen (approximately 30% from top)
- **Size**: Dragon logo scaled to 40% of screen width
- **Original**: Use existing dragon-logo.png as base

#### Typography
- **Primary Text**: "DRAGON WORLDS"
- **Secondary Text**: "HK 2027"
- **Font**: Bold, modern sans-serif (Arial Black, Helvetica Bold, or similar)
- **Color**: White (#FFFFFF) with subtle drop shadow
- **Positioning**:
  - "DRAGON WORLDS" centered below logo (50px spacing)
  - "HK 2027" centered below main text (30px spacing)
- **Size Guidelines**:
  - "DRAGON WORLDS": 72px font size
  - "HK 2027": 48px font size

#### Design Elements
- **Drop Shadow**: Add subtle drop shadow to both logo and text
  - Color: rgba(0, 0, 0, 0.3)
  - Offset: 2px x, 3px y
  - Blur: 5px
- **Spacing**: Maintain adequate breathing room around all elements
- **Safe Area**: Keep all important elements 10% from screen edges

### Design Tools & Creation Steps

#### Using Figma/Adobe Illustrator/Photoshop
1. Create new document with dimensions 1080 x 1920px
2. Set background color to #DC2626
3. Import existing dragon-logo.png
4. Scale and position dragon logo in upper center
5. Add "DRAGON WORLDS" text with specified typography
6. Add "HK 2027" text below
7. Apply drop shadows to all elements
8. Export as PNG with maximum quality

#### Alternative: Using Canva
1. Create custom size design (1080 x 1920px)
2. Set background to solid color #DC2626
3. Upload dragon-logo.png asset
4. Add text elements with bold fonts
5. Apply shadow effects
6. Download as PNG

### Color Palette
- **Background**: #DC2626 (Dragon Red)
- **Text**: #FFFFFF (White)
- **Shadow**: rgba(0, 0, 0, 0.3) (Semi-transparent black)

### Mobile-First Considerations
- Text remains readable on smallest supported devices (iPhone SE: 375x667)
- Logo scales proportionally across different screen sizes
- Elements positioned to avoid status bar and home indicator areas
- Safe area margins maintained for notched devices

### Brand Guidelines
- Maintain consistency with app's red theme (#DC2626)
- Dragon logo remains primary brand element
- "Dragon Worlds HK 2027" provides clear event identification
- Professional, sporty aesthetic appropriate for sailing regatta

## Implementation Notes

### File Management
- **Original file**: `./assets/splash-dragon-worlds-fullscreen.png`
- **Backup current**: Current splash assets preserved as backups
- **High-resolution**: Ensure crisp display on high-DPI devices

### Expo Configuration
- Use `resizeMode: "cover"` for full-screen coverage
- Update all platform-specific splash configurations
- Test with production build (not Expo Go)

### Platform Variations (Optional)
Consider creating platform-specific versions if needed:
- **iOS**: `./assets/ios-splash-dragon-worlds.png`
- **Android**: `./assets/android-splash-dragon-worlds.png`

This design will create a professional, full-screen splash screen that prominently displays both the Dragon logo and the "Dragon Worlds HK 2027" event branding.