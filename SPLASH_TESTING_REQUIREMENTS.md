# Splash Screen Testing Requirements

## Current Implementation Status

### ✅ Configuration Complete
- Updated all 4 splash screen references in `app.json`
- File path: `./assets/splash-dragon-worlds-fullscreen.png`
- ResizeMode: `cover` for full-screen display
- Background color: `#DC2626` (Dragon Red)
- Configuration loads successfully in Expo

### 📁 Files Created/Modified
- `./assets/splash-dragon-worlds-fullscreen.png` - Placeholder image (currently dragon logo)
- `FULLSCREEN_SPLASH_DESIGN.md` - Complete design specifications
- `app.json` - Updated splash configurations

## Testing Requirements

### ⚠️ CRITICAL: Splash Screen Testing Limitations
**Splash screens CANNOT be tested in:**
- Expo Go app
- Development builds (`expo start`)
- Local development server

**Splash screens CAN ONLY be tested in:**
- Production builds (`expo build`)
- EAS Preview builds
- EAS Production builds
- Standalone app installations

### Required Testing Commands

#### Option 1: EAS Preview Build (Recommended)
```bash
# Install EAS CLI if not already installed
npm install -g @expo/eas-cli

# Login to Expo account
eas login

# Create preview build for iOS
eas build --platform ios --profile preview

# Create preview build for Android
eas build --platform android --profile preview
```

#### Option 2: Production Build
```bash
# Build for production
expo build:ios
expo build:android
```

#### Option 3: Prebuild + Native Development
```bash
# Generate native code
npx expo prebuild --clean

# Open in Xcode (iOS)
npx pod install --project-directory=ios
open ios/dragonworldshk2027.xcworkspace

# Open in Android Studio (Android)
npx react-native run-android
```

## Design Implementation Steps

### Step 1: Create Actual Full-Screen Design
Currently using placeholder. Create the actual design using the specifications in `FULLSCREEN_SPLASH_DESIGN.md`:

1. **Canvas**: 1080 x 1920 pixels
2. **Background**: Solid #DC2626 (Dragon Red)
3. **Logo**: Dragon logo positioned in upper-center (40% screen width)
4. **Text**: "DRAGON WORLDS" (72px) and "HK 2027" (48px) in white
5. **Typography**: Bold sans-serif with drop shadows
6. **Export**: High-quality PNG as `splash-dragon-worlds-fullscreen.png`

### Step 2: Replace Placeholder Image
```bash
# Replace the current placeholder with your designed image
cp /path/to/your/designed-splash.png ./assets/splash-dragon-worlds-fullscreen.png
```

### Step 3: Build and Test
```bash
# Clear cache and rebuild
npx expo prebuild --clean

# Create test build
eas build --platform ios --profile preview
```

## Validation Checklist

### Visual Testing
- [ ] Dragon logo clearly visible and properly sized
- [ ] "DRAGON WORLDS HK 2027" text is readable
- [ ] Red background (#DC2626) fills entire screen
- [ ] No white margins or letterboxing
- [ ] Image scales properly on different device sizes
- [ ] Text and logo don't overlap device UI elements (notch, home indicator)

### Platform Testing
- [ ] iOS splash screen displays correctly
- [ ] Android splash screen displays correctly
- [ ] Tablet layouts work properly (iPad, Android tablets)
- [ ] Different screen aspect ratios supported

### Performance Testing
- [ ] Splash screen loads quickly
- [ ] Smooth transition to main app
- [ ] No visible glitches or artifacts

## Common Issues and Solutions

### Issue: White Margins Appear
- **Cause**: Image dimensions don't match screen aspect ratio
- **Solution**: Use `resizeMode: "cover"` (already configured) or create multiple image sizes

### Issue: Text Cut Off
- **Cause**: Safe area not considered in design
- **Solution**: Keep text 10% from screen edges in design

### Issue: Splash Not Updating
- **Cause**: Cache or development build limitations
- **Solution**: Use production build, run `npx expo prebuild --clean`

## Current Configuration Summary

```json
{
  "splash": {
    "image": "./assets/splash-dragon-worlds-fullscreen.png",
    "resizeMode": "cover",
    "backgroundColor": "#DC2626"
  }
}
```

This configuration is active across:
- Main expo configuration
- iOS platform configuration
- Android platform configuration
- expo-splash-screen plugin

## Next Steps
1. Create the actual full-screen design using provided specifications
2. Replace placeholder image with designed version
3. Create EAS preview build for testing
4. Validate splash screen appearance on actual devices