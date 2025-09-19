# RHKYC Logo Integration for Splash Screen

## Overview
This document outlines the steps to integrate the Royal Hong Kong Yacht Club (RHKYC) logo into the Dragon Worlds HK 2027 app splash screen.

## Legal Requirements
⚠️ **IMPORTANT**: Before proceeding, you must obtain proper permission to use the RHKYC logo.

1. Contact RHKYC PR & Communications Department
2. Request permission to use the club logo in the Dragon Worlds HK 2027 app
3. Follow their Corporate Logo Guidelines
4. Obtain the official logo file in high resolution (preferably PNG with transparency)

## Technical Implementation

### Current Splash Screen Setup
- **Current logo**: `./assets/dragon-logo.png` (1500x1500px)
- **Background color**: #DC2626 (red)
- **Configuration locations in app.json**:
  - Main splash (lines 24-28)
  - iOS splash (lines 41-45)
  - Android splash (lines 99-103)
  - expo-splash-screen plugin (lines 177-185)

### Recommended Design Approach
**Option 1: Side-by-side layout**
- Create 1500x1500px canvas with red background (#DC2626)
- Dragon logo on left side (scaled to ~700px width)
- RHKYC logo on right side (scaled proportionally)
- Maintain visual balance and legibility

**Option 2: Corner placement**
- Keep dragon logo as main focal point (center)
- Place RHKYC logo in bottom-right corner (scaled to ~300px)
- Add subtle shadow or outline for visibility

### File Naming Convention
- New combined splash image: `./assets/splash-dragon-rhkyc.png`
- Keep original dragon logo as backup: `./assets/dragon-logo-backup.png`

### Configuration Update Required
Update these 4 image references in app.json:
1. `"splash" → "image"`: `"./assets/splash-dragon-rhkyc.png"`
2. `"ios" → "splash" → "image"`: `"./assets/splash-dragon-rhkyc.png"`
3. `"android" → "splash" → "image"`: `"./assets/splash-dragon-rhkyc.png"`
4. `"plugins" → "expo-splash-screen" → "image"`: `"./assets/splash-dragon-rhkyc.png"`

## Next Steps
1. ✅ Obtain RHKYC logo with proper permissions
2. ✅ Create combined splash screen design (1500x1500px PNG)
3. ✅ Save as `./assets/splash-dragon-rhkyc.png`
4. ✅ Update app.json configuration (automatically handled)
5. ✅ Test on iOS and Android simulators

## Testing Checklist
- [ ] iOS simulator shows new splash screen correctly
- [ ] Android emulator shows new splash screen correctly
- [ ] Both logos are clearly visible and properly proportioned
- [ ] Red background color is maintained (#DC2626)
- [ ] Splash screen scales properly on different device sizes

## Backup & Recovery
- Original dragon logo backed up as `dragon-logo-backup.png`
- To revert: restore original image path in app.json configuration