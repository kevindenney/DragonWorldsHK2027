#!/bin/bash

# Dragon Worlds HK 2027 - App Store Submission Preparation Script
# This script prepares all materials needed for iOS App Store and Google Play Store submission

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${GREEN}${1}${NC}"
}

# Default values
CHECK_ONLY=false
GENERATE_SCREENSHOTS=false
VALIDATE_ASSETS=true
PLATFORM="both"

# Function to show usage
show_usage() {
    cat << EOF
Dragon Worlds HK 2027 Submission Preparation Script

Usage: $0 [OPTIONS]

OPTIONS:
    -c, --check-only           Only check submission readiness, don't prepare
    -s, --screenshots          Generate screenshot templates
    -p, --platform PLATFORM    Platform to prepare for (ios, android, both)
    --skip-validation          Skip asset validation
    -h, --help                 Show this help message

EXAMPLES:
    $0                         Prepare submission for both platforms
    $0 -p ios                  Prepare only for iOS App Store
    $0 -c                      Check submission readiness only
    $0 -s                      Generate screenshot templates

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--check-only)
            CHECK_ONLY=true
            shift
            ;;
        -s|--screenshots)
            GENERATE_SCREENSHOTS=true
            shift
            ;;
        -p|--platform)
            PLATFORM="$2"
            shift 2
            ;;
        --skip-validation)
            VALIDATE_ASSETS=false
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate platform parameter
if [[ "$PLATFORM" != "ios" && "$PLATFORM" != "android" && "$PLATFORM" != "both" ]]; then
    print_error "Invalid platform: $PLATFORM. Must be ios, android, or both"
    exit 1
fi

print_header "🚀 Dragon Worlds HK 2027 - Submission Preparation"
print_status "Platform: $PLATFORM"
print_status "Check only: $CHECK_ONLY"
print_status "Generate screenshots: $GENERATE_SCREENSHOTS"
echo

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check EAS CLI
    if ! command -v eas &> /dev/null; then
        print_error "EAS CLI is not installed. Install with: npm install -g @expo/eas-cli"
        exit 1
    fi
    
    # Check if logged into EAS
    if ! eas whoami &> /dev/null; then
        print_error "Not logged into EAS CLI. Run: eas login"
        exit 1
    fi
    
    # Check ImageMagick for screenshot processing (optional)
    if command -v convert &> /dev/null; then
        print_success "ImageMagick found - screenshot processing available"
        HAS_IMAGEMAGICK=true
    else
        print_warning "ImageMagick not found - screenshot processing will be limited"
        HAS_IMAGEMAGICK=false
    fi
    
    print_success "Dependencies check completed"
}

# Validate app configuration
validate_configuration() {
    print_status "Validating app configuration..."
    
    # Check app.json
    if [[ ! -f "app.json" ]]; then
        print_error "app.json not found"
        exit 1
    fi
    
    # Check EAS configuration
    if [[ ! -f "eas.json" ]]; then
        print_error "eas.json not found"
        exit 1
    fi
    
    # Validate required fields in app.json
    local APP_NAME=$(node -p "require('./app.json').expo.name" 2>/dev/null)
    local APP_VERSION=$(node -p "require('./app.json').expo.version" 2>/dev/null)
    local BUNDLE_ID=$(node -p "require('./app.json').expo.ios?.bundleIdentifier || require('./app.json').expo.android?.package" 2>/dev/null)
    
    if [[ -z "$APP_NAME" ]]; then
        print_error "App name not found in app.json"
        exit 1
    fi
    
    if [[ -z "$APP_VERSION" ]]; then
        print_error "App version not found in app.json"
        exit 1
    fi
    
    if [[ -z "$BUNDLE_ID" ]]; then
        print_error "Bundle identifier not found in app.json"
        exit 1
    fi
    
    print_success "App configuration validation passed"
    print_status "App: $APP_NAME"
    print_status "Version: $APP_VERSION"
    print_status "Bundle ID: $BUNDLE_ID"
}

# Check required assets
check_assets() {
    print_status "Checking required assets..."
    
    local missing_assets=()
    
    # Check app icons
    if [[ ! -f "assets/icon.png" ]]; then
        missing_assets+=("App icon (assets/icon.png)")
    fi
    
    if [[ ! -f "assets/adaptive-icon.png" ]] && [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
        missing_assets+=("Android adaptive icon (assets/adaptive-icon.png)")
    fi
    
    # Check splash screen
    if [[ ! -f "assets/splash-icon.png" ]]; then
        missing_assets+=("Splash screen (assets/splash-icon.png)")
    fi
    
    # Check store assets directory
    if [[ ! -d "store-assets" ]]; then
        print_warning "store-assets directory not found, creating..."
        mkdir -p store-assets
    fi
    
    # Check store descriptions
    if [[ ! -f "store-assets/app-store-description.md" ]] && [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
        missing_assets+=("iOS App Store description")
    fi
    
    if [[ ! -f "store-assets/google-play-description.md" ]] && [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
        missing_assets+=("Google Play Store description")
    fi
    
    if [[ ${#missing_assets[@]} -gt 0 ]]; then
        print_warning "Missing assets found:"
        for asset in "${missing_assets[@]}"; do
            echo "  - $asset"
        done
        
        if [[ "$CHECK_ONLY" == true ]]; then
            return 1
        fi
        
        print_status "Continuing with available assets..."
    else
        print_success "All required assets found"
    fi
}

# Generate screenshot templates
generate_screenshot_templates() {
    print_status "Generating screenshot templates..."
    
    local screenshot_dir="store-assets/screenshots"
    mkdir -p "$screenshot_dir"
    
    # iOS screenshot sizes (points, will be converted to pixels)
    declare -A ios_sizes=(
        ["iphone-6.5"]="414x896"      # iPhone 14 Pro Max, 13 Pro Max, 12 Pro Max
        ["iphone-5.5"]="414x736"      # iPhone 8 Plus
        ["iphone-4.7"]="375x667"      # iPhone SE (3rd gen), 8, 7, 6s, 6
        ["ipad-12.9"]="1024x1366"     # iPad Pro (6th gen), (5th gen), (4th gen), (3rd gen)
        ["ipad-10.5"]="834x1112"      # iPad Air (5th gen), (4th gen), Pro (2nd gen)
    )
    
    # Android screenshot sizes (dp, will be converted to pixels)
    declare -A android_sizes=(
        ["phone"]="360x640"           # Standard Android phone
        ["7-inch-tablet"]="600x960"   # 7-inch tablet
        ["10-inch-tablet"]="800x1280" # 10-inch tablet
    )
    
    # Generate iOS templates
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
        print_status "Generating iOS screenshot templates..."
        mkdir -p "$screenshot_dir/ios"
        
        for size_name in "${!ios_sizes[@]}"; do
            local size="${ios_sizes[$size_name]}"
            local width=$(echo $size | cut -d'x' -f1)
            local height=$(echo $size | cut -d'x' -f2)
            
            # Create template files
            for i in {1..6}; do
                local filename="$screenshot_dir/ios/screenshot-${size_name}-${i}.txt"
                cat > "$filename" << EOF
iOS Screenshot Template
Size: ${size} points
Device: ${size_name}
Screenshot ${i}

Required screenshots for App Store:
1. Weather screen showing sailing conditions
2. Race schedule with upcoming events
3. Live race tracking map
4. Results and standings
5. Social features and community
6. Settings and subscription options

Notes:
- Screenshots should be actual device screenshots
- Use high-resolution displays (Retina)
- Show realistic data, not placeholder text
- Ensure good contrast and readability
- Include diverse content to show app features
EOF
            done
        done
        
        # Create iOS screenshot checklist
        cat > "$screenshot_dir/ios/README.md" << EOF
# iOS App Store Screenshots

## Required Sizes

$(for size_name in "${!ios_sizes[@]}"; do
    echo "- **${size_name}**: ${ios_sizes[$size_name]} points"
done)

## Screenshot Requirements

1. **Format**: PNG or JPEG
2. **Color space**: RGB
3. **Content**: Must show actual app functionality
4. **Text**: Should be legible and in supported languages
5. **Status bar**: Should show realistic carrier, time, battery

## Tips

- Use actual devices or high-quality simulators
- Take screenshots in RGB color space
- Avoid excessive text overlay
- Show key app features across the screenshot set
- Consider localization for different markets

## Naming Convention

Use descriptive names:
- screenshot-iphone-6.5-1-weather.png
- screenshot-iphone-6.5-2-schedule.png
- etc.
EOF
    fi
    
    # Generate Android templates
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
        print_status "Generating Android screenshot templates..."
        mkdir -p "$screenshot_dir/android"
        
        for size_name in "${!android_sizes[@]}"; do
            local size="${android_sizes[$size_name]}"
            local width=$(echo $size | cut -d'x' -f1)
            local height=$(echo $size | cut -d'x' -f2)
            
            for i in {1..8}; do
                local filename="$screenshot_dir/android/screenshot-${size_name}-${i}.txt"
                cat > "$filename" << EOF
Android Screenshot Template
Size: ${size} dp
Device: ${size_name}
Screenshot ${i}

Required screenshots for Google Play:
1. Weather screen showing sailing conditions
2. Race schedule with upcoming events  
3. Live race tracking map
4. Results and standings
5. Social features and community
6. Settings and subscription options
7. App home screen/dashboard
8. Additional feature screen

Notes:
- Screenshots should be actual device screenshots
- Use high-resolution displays (minimum 320 DPI)
- Show realistic data, not placeholder text
- Ensure good contrast and readability
- Include Material Design elements
EOF
            done
        done
        
        # Create Android screenshot checklist
        cat > "$screenshot_dir/android/README.md" << EOF
# Google Play Store Screenshots

## Required Sizes

$(for size_name in "${!android_sizes[@]}"; do
    echo "- **${size_name}**: ${android_sizes[$size_name]} dp"
done)

## Screenshot Requirements

1. **Format**: PNG or JPEG
2. **Minimum**: 320 DPI
3. **Maximum**: 3840x3840 pixels
4. **Content**: Must show actual app functionality
5. **Quantity**: 2-8 screenshots per device type

## Tips

- Use actual Android devices or high-quality emulators
- Follow Material Design guidelines in screenshots
- Show key app features and user flows
- Consider different screen densities
- Test on various Android versions

## Naming Convention

Use descriptive names:
- screenshot-phone-1-weather.png
- screenshot-phone-2-schedule.png
- screenshot-tablet-1-dashboard.png
- etc.
EOF
    fi
    
    print_success "Screenshot templates generated in store-assets/screenshots/"
}

# Prepare submission checklist
create_submission_checklist() {
    print_status "Creating submission checklist..."
    
    local checklist_file="store-assets/submission-checklist.md"
    
    cat > "$checklist_file" << EOF
# App Store Submission Checklist - Dragon Worlds HK 2027

## Pre-Submission Requirements

### App Development
- [ ] App builds successfully for production
- [ ] All features work as expected
- [ ] No critical bugs or crashes
- [ ] Performance is optimized
- [ ] Memory usage is reasonable
- [ ] Battery usage is optimized
- [ ] Network handling is robust
- [ ] Offline functionality works
- [ ] All user flows tested

### Testing
- [ ] Unit tests pass (80%+ coverage)
- [ ] Integration tests pass
- [ ] UI tests completed
- [ ] Manual testing on real devices
- [ ] Accessibility testing completed
- [ ] Performance testing completed
- [ ] Security testing completed

### App Store Connect / Google Play Console Setup
- [ ] Developer account verified
- [ ] App created in console
- [ ] Bundle ID / Package name matches
- [ ] Certificates and provisioning profiles ready
- [ ] App signing configured

## iOS App Store Submission

### App Information
- [ ] App name: "Dragon Worlds HK 2027"
- [ ] Subtitle: "Official Dragon Class World Championship App"
- [ ] Categories: Sports (Primary), Weather (Secondary)
- [ ] Age Rating: 4+ (All ages)
- [ ] App description written and reviewed
- [ ] Keywords selected and optimized
- [ ] Support URL: https://dragonworlds.com/app-support
- [ ] Marketing URL: https://dragonworlds.com/app
- [ ] Privacy Policy URL: https://dragonworlds.com/privacy-policy

### App Assets
- [ ] App icon (1024x1024px) uploaded
- [ ] Screenshots for all required device sizes:
  - [ ] iPhone 6.5" (414x896pt) - 6 screenshots
  - [ ] iPhone 5.5" (414x736pt) - 6 screenshots  
  - [ ] iPhone 4.7" (375x667pt) - 6 screenshots
  - [ ] iPad Pro 12.9" (1024x1366pt) - 6 screenshots
  - [ ] iPad Pro 10.5" (834x1112pt) - 6 screenshots

### App Build
- [ ] Production build uploaded via EAS
- [ ] Build processed successfully
- [ ] TestFlight testing completed
- [ ] No critical issues found
- [ ] App Store Review Guidelines compliance checked

### App Privacy
- [ ] Privacy nutrition label completed
- [ ] Data collection practices documented
- [ ] Third-party SDK privacy compliance verified
- [ ] User consent flows implemented

### Pricing & Availability
- [ ] Pricing tier selected (Free)
- [ ] In-app purchases configured:
  - [ ] Professional Weather (\$4.99/month)
  - [ ] Race Analytics (\$9.99/month)
  - [ ] Elite Access (\$19.99/month)
- [ ] Availability territories selected

## Google Play Store Submission

### Store Listing
- [ ] App name: "Dragon Worlds HK 2027"
- [ ] Short description (80 characters max)
- [ ] Full description (4000 characters max)
- [ ] Categories: Sports (Primary)
- [ ] Content rating: Everyone
- [ ] Tags and keywords optimized
- [ ] Developer contact information
- [ ] Privacy Policy URL

### App Assets
- [ ] High-res icon (512x512px) uploaded
- [ ] Feature graphic (1024x500px) created
- [ ] Screenshots for all device types:
  - [ ] Phone screenshots (minimum 2, maximum 8)
  - [ ] 7-inch tablet screenshots (minimum 2, maximum 8)
  - [ ] 10-inch tablet screenshots (minimum 2, maximum 8)
- [ ] Promotional video (optional)

### App Bundle
- [ ] Android App Bundle (.aab) generated
- [ ] Build uploaded via EAS
- [ ] Internal testing completed
- [ ] Closed testing with alpha/beta users
- [ ] No critical issues found

### App Content
- [ ] Content rating questionnaire completed
- [ ] Target audience and content selected
- [ ] Ads and in-app purchases declared
- [ ] Permissions usage clearly explained
- [ ] Data safety section completed

### Publishing
- [ ] Release name and notes prepared
- [ ] Rollout percentage set (start with 5-20%)
- [ ] Countries and regions selected
- [ ] Pricing and in-app products configured

## Post-Submission

### Monitoring
- [ ] App store approval status monitored
- [ ] Crash reporting configured (Sentry)
- [ ] Analytics tracking verified
- [ ] Performance monitoring active
- [ ] User feedback channels established

### Marketing
- [ ] Press release prepared
- [ ] Social media content created
- [ ] Website updated with app links
- [ ] Email announcement sent
- [ ] Sailing community outreach planned

### Support
- [ ] Customer support processes ready
- [ ] FAQ documentation prepared
- [ ] Bug reporting system in place
- [ ] Update and maintenance plan created

## Review Guidelines Compliance

### iOS App Review Guidelines
- [ ] App provides enough functionality and content
- [ ] Metadata is accurate and appropriate
- [ ] App works on all supported devices
- [ ] No placeholder content or "lorem ipsum" text
- [ ] All external links work correctly
- [ ] In-app purchases properly implemented
- [ ] Subscription terms clearly presented
- [ ] Privacy practices clearly disclosed

### Google Play Policy Compliance  
- [ ] App provides stable, engaging user experience
- [ ] All metadata accurately represents the app
- [ ] No prohibited content included
- [ ] Required permissions properly justified
- [ ] Monetization practices comply with policies
- [ ] User data handling is transparent
- [ ] Target API level requirements met

## Final Pre-Launch Checklist

- [ ] All team members have reviewed the app
- [ ] Legal and compliance review completed
- [ ] Final build tested on production environment
- [ ] Analytics and monitoring systems verified
- [ ] Customer support team briefed and ready
- [ ] Launch day communication plan finalized
- [ ] Post-launch monitoring plan established

---

**Submission Date**: ___________
**Submitted By**: ___________
**Platform**: ___________
**Build Version**: ___________
**Notes**: 

EOF

    print_success "Submission checklist created: $checklist_file"
}

# Check build status
check_builds() {
    print_status "Checking EAS build status..."
    
    # Get recent builds
    local builds_output
    if builds_output=$(eas build:list --limit=5 --json 2>/dev/null); then
        echo "$builds_output" | jq -r '.[] | "Build: \(.id) | Platform: \(.platform) | Status: \(.status) | Created: \(.createdAt)"'
        print_success "Recent builds retrieved"
    else
        print_warning "Could not retrieve build information. Run 'eas build:list' manually to check."
    fi
}

# Generate submission report
generate_submission_report() {
    print_status "Generating submission report..."
    
    local report_file="store-assets/submission-report.txt"
    local timestamp=$(date)
    local git_commit=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    local git_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    
    cat > "$report_file" << EOF
Dragon Worlds HK 2027 - Submission Report
========================================

Generated: $timestamp
Platform: $PLATFORM
Git Commit: $git_commit
Git Branch: $git_branch

Configuration Status:
- app.json: $([ -f app.json ] && echo "✓ Found" || echo "✗ Missing")
- eas.json: $([ -f eas.json ] && echo "✓ Found" || echo "✗ Missing")
- Assets directory: $([ -d assets ] && echo "✓ Found" || echo "✗ Missing")
- Store assets: $([ -d store-assets ] && echo "✓ Found" || echo "✗ Missing")

App Information:
- Name: $(node -p "require('./app.json').expo.name" 2>/dev/null || echo "Not found")
- Version: $(node -p "require('./app.json').expo.version" 2>/dev/null || echo "Not found")
- Bundle ID (iOS): $(node -p "require('./app.json').expo.ios?.bundleIdentifier" 2>/dev/null || echo "Not found")
- Package (Android): $(node -p "require('./app.json').expo.android?.package" 2>/dev/null || echo "Not found")

Required Assets:
- App Icon: $([ -f assets/icon.png ] && echo "✓ Found" || echo "✗ Missing")
- Splash Screen: $([ -f assets/splash-icon.png ] && echo "✓ Found" || echo "✗ Missing")
- Adaptive Icon: $([ -f assets/adaptive-icon.png ] && echo "✓ Found" || echo "✗ Missing")

Store Materials:
- iOS Description: $([ -f store-assets/app-store-description.md ] && echo "✓ Found" || echo "✗ Missing")
- Android Description: $([ -f store-assets/google-play-description.md ] && echo "✓ Found" || echo "✗ Missing")
- Screenshot Templates: $([ -d store-assets/screenshots ] && echo "✓ Generated" || echo "✗ Not generated")
- Submission Checklist: $([ -f store-assets/submission-checklist.md ] && echo "✓ Created" || echo "✗ Missing")

Next Steps:
1. Review the submission checklist
2. Complete any missing assets or configurations
3. Take required screenshots for all device sizes
4. Run final builds with: npm run bundle:${PLATFORM}
5. Test builds thoroughly on real devices
6. Submit to app stores following the checklist

EOF

    print_success "Submission report generated: $report_file"
}

# Main execution flow
main() {
    print_header "Starting submission preparation for $PLATFORM..."
    
    # Always check dependencies and configuration
    check_dependencies
    validate_configuration
    
    # Check assets
    if [[ "$VALIDATE_ASSETS" == true ]]; then
        if ! check_assets; then
            if [[ "$CHECK_ONLY" == true ]]; then
                print_error "Asset validation failed"
                exit 1
            fi
        fi
    fi
    
    # If only checking, show build status and exit
    if [[ "$CHECK_ONLY" == true ]]; then
        check_builds
        print_success "Submission readiness check completed"
        exit 0
    fi
    
    # Generate materials
    if [[ "$GENERATE_SCREENSHOTS" == true ]]; then
        generate_screenshot_templates
    fi
    
    create_submission_checklist
    check_builds
    generate_submission_report
    
    # Final summary
    print_header "🎉 Submission preparation completed!"
    echo
    print_success "Materials generated:"
    echo "  📄 Submission checklist: store-assets/submission-checklist.md"
    echo "  📊 Submission report: store-assets/submission-report.txt"
    
    if [[ "$GENERATE_SCREENSHOTS" == true ]]; then
        echo "  📸 Screenshot templates: store-assets/screenshots/"
    fi
    
    echo
    print_status "Next steps:"
    echo "  1. Review the submission checklist"
    echo "  2. Complete any missing requirements"
    echo "  3. Take screenshots for all required device sizes"
    echo "  4. Build final production versions:"
    
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
        echo "     npm run bundle:ios"
    fi
    
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
        echo "     npm run bundle:android"
    fi
    
    echo "  5. Submit to app stores following the detailed checklist"
    echo
    print_success "Good luck with your app submission! 🚀"
}

# Run main function
main