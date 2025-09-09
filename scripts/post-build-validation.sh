#!/bin/bash

# Dragon Worlds HK 2027 - Post-Build Validation Script
# Validates builds after EAS build completion and before submission

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_header() { echo -e "${GREEN}${1}${NC}"; }

# Default values
BUILD_ID=""
PLATFORM=""
PROFILE="production"
DOWNLOAD_BUILD=false

show_usage() {
    cat << EOF
Dragon Worlds HK 2027 Post-Build Validation Script

Usage: $0 [OPTIONS]

OPTIONS:
    -b, --build-id ID       EAS build ID to validate
    -p, --platform PLATFORM Platform of the build (ios, android)
    -r, --profile PROFILE   Build profile used (default: production)
    -d, --download          Download and inspect the build artifact
    -h, --help              Show this help message

EXAMPLES:
    $0 -b abc123-def456 -p ios
    $0 -b xyz789 -p android -d
    $0 --build-id abc123 --platform ios --download

If no build ID is provided, the script will validate the most recent build.

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--build-id)
            BUILD_ID="$2"
            shift 2
            ;;
        -p|--platform)
            PLATFORM="$2"
            shift 2
            ;;
        -r|--profile)
            PROFILE="$2"
            shift 2
            ;;
        -d|--download)
            DOWNLOAD_BUILD=true
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

print_header "🔍 Dragon Worlds HK 2027 - Post-Build Validation"
echo

# Check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v eas &> /dev/null; then
        print_error "EAS CLI is not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_error "jq is required for JSON parsing. Install with: brew install jq"
        exit 1
    fi
    
    if ! eas whoami &> /dev/null; then
        print_error "Not logged into EAS CLI"
        exit 1
    fi
    
    print_success "Dependencies check passed"
}

# Get build information
get_build_info() {
    print_status "Retrieving build information..."
    
    if [[ -z "$BUILD_ID" ]]; then
        # Get most recent build
        local recent_builds
        if [[ -n "$PLATFORM" ]]; then
            recent_builds=$(eas build:list --platform "$PLATFORM" --limit=1 --json)
        else
            recent_builds=$(eas build:list --limit=1 --json)
        fi
        
        BUILD_ID=$(echo "$recent_builds" | jq -r '.[0].id')
        PLATFORM=$(echo "$recent_builds" | jq -r '.[0].platform')
        
        if [[ "$BUILD_ID" == "null" || -z "$BUILD_ID" ]]; then
            print_error "No recent builds found"
            exit 1
        fi
        
        print_status "Using most recent build: $BUILD_ID ($PLATFORM)"
    fi
    
    # Get detailed build info
    local build_info=$(eas build:view "$BUILD_ID" --json)
    
    if [[ -z "$build_info" ]]; then
        print_error "Could not retrieve build information for ID: $BUILD_ID"
        exit 1
    fi
    
    # Extract build details
    BUILD_STATUS=$(echo "$build_info" | jq -r '.status')
    BUILD_PLATFORM=$(echo "$build_info" | jq -r '.platform')
    BUILD_PROFILE=$(echo "$build_info" | jq -r '.buildProfile')
    BUILD_VERSION=$(echo "$build_info" | jq -r '.appVersion')
    BUILD_NUMBER=$(echo "$build_info" | jq -r '.appBuildVersion')
    BUILD_SDK=$(echo "$build_info" | jq -r '.sdkVersion')
    BUILD_CREATED=$(echo "$build_info" | jq -r '.createdAt')
    BUILD_COMPLETED=$(echo "$build_info" | jq -r '.completedAt')
    ARTIFACT_URL=$(echo "$build_info" | jq -r '.artifacts.buildUrl // empty')
    
    # Override platform if not set
    [[ -z "$PLATFORM" ]] && PLATFORM="$BUILD_PLATFORM"
    
    print_success "Build information retrieved"
    echo "  Build ID: $BUILD_ID"
    echo "  Platform: $BUILD_PLATFORM"
    echo "  Profile: $BUILD_PROFILE"
    echo "  Status: $BUILD_STATUS"
    echo "  Version: $BUILD_VERSION ($BUILD_NUMBER)"
    echo "  SDK: $BUILD_SDK"
    echo "  Created: $BUILD_CREATED"
    echo "  Completed: $BUILD_COMPLETED"
}

# Validate build status
validate_build_status() {
    print_status "Validating build status..."
    
    case "$BUILD_STATUS" in
        "finished")
            print_success "Build completed successfully"
            ;;
        "in-queue"|"in-progress")
            print_warning "Build is still in progress. Status: $BUILD_STATUS"
            print_status "Please wait for build completion before validation"
            exit 1
            ;;
        "errored"|"canceled")
            print_error "Build failed. Status: $BUILD_STATUS"
            exit 1
            ;;
        *)
            print_warning "Unknown build status: $BUILD_STATUS"
            ;;
    esac
}

# Validate build configuration
validate_build_configuration() {
    print_status "Validating build configuration..."
    
    # Check build profile
    if [[ "$BUILD_PROFILE" != "production" && "$BUILD_PROFILE" != "production-ios" && "$BUILD_PROFILE" != "production-android" ]]; then
        print_warning "Build profile is not production: $BUILD_PROFILE"
    else
        print_success "Production build profile confirmed"
    fi
    
    # Check version format
    if [[ ! "$BUILD_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_warning "Version format may not follow semantic versioning: $BUILD_VERSION"
    else
        print_success "Version format is valid: $BUILD_VERSION"
    fi
    
    # Check SDK version
    local expected_sdk="~53.0.22"
    if [[ "$BUILD_SDK" != *"53."* ]]; then
        print_warning "SDK version may be outdated: $BUILD_SDK (expected: $expected_sdk)"
    else
        print_success "SDK version is acceptable: $BUILD_SDK"
    fi
}

# Check artifact availability
check_artifact() {
    print_status "Checking build artifact..."
    
    if [[ -z "$ARTIFACT_URL" || "$ARTIFACT_URL" == "null" ]]; then
        print_error "Build artifact URL not available"
        return 1
    fi
    
    # Test artifact URL accessibility
    local http_status
    http_status=$(curl -s -o /dev/null -w "%{http_code}" "$ARTIFACT_URL")
    
    if [[ "$http_status" == "200" ]]; then
        print_success "Build artifact is accessible"
        echo "  Artifact URL: $ARTIFACT_URL"
    else
        print_error "Build artifact is not accessible (HTTP $http_status)"
        return 1
    fi
}

# Download and inspect build
download_and_inspect() {
    if [[ "$DOWNLOAD_BUILD" != true ]]; then
        return 0
    fi
    
    print_status "Downloading build artifact..."
    
    if [[ -z "$ARTIFACT_URL" ]]; then
        print_error "No artifact URL available for download"
        return 1
    fi
    
    # Create downloads directory
    local download_dir="./build-artifacts"
    mkdir -p "$download_dir"
    
    # Determine file extension based on platform
    local file_extension
    case "$BUILD_PLATFORM" in
        "ios")
            file_extension=".ipa"
            ;;
        "android")
            file_extension=".apk"
            if [[ "$BUILD_PROFILE" == *"production"* ]]; then
                file_extension=".aab"  # Android App Bundle for production
            fi
            ;;
        *)
            file_extension=".bin"
            ;;
    esac
    
    local download_file="$download_dir/dragonworlds-${BUILD_VERSION}-${BUILD_NUMBER}-${BUILD_PLATFORM}${file_extension}"
    
    # Download with progress
    if curl -L --progress-bar -o "$download_file" "$ARTIFACT_URL"; then
        print_success "Build downloaded: $download_file"
        
        # Get file size
        local file_size=$(ls -lh "$download_file" | awk '{print $5}')
        echo "  File size: $file_size"
        
        # Basic file inspection
        inspect_build_file "$download_file"
        
    else
        print_error "Failed to download build artifact"
        return 1
    fi
}

# Inspect downloaded build file
inspect_build_file() {
    local file_path="$1"
    print_status "Inspecting build file..."
    
    # Check file type
    local file_type=$(file "$file_path")
    echo "  File type: $file_type"
    
    case "$BUILD_PLATFORM" in
        "ios")
            inspect_ios_build "$file_path"
            ;;
        "android")
            inspect_android_build "$file_path"
            ;;
    esac
}

# Inspect iOS build
inspect_ios_build() {
    local ipa_path="$1"
    
    # Check if unzip is available
    if ! command -v unzip &> /dev/null; then
        print_warning "unzip not available, skipping detailed iOS inspection"
        return
    fi
    
    # Create temporary directory for extraction
    local temp_dir=$(mktemp -d)
    
    # Extract IPA
    if unzip -q "$ipa_path" -d "$temp_dir"; then
        print_success "IPA extracted for inspection"
        
        # Find app bundle
        local app_bundle=$(find "$temp_dir" -name "*.app" -type d | head -1)
        
        if [[ -n "$app_bundle" ]]; then
            # Check Info.plist
            local info_plist="$app_bundle/Info.plist"
            if [[ -f "$info_plist" ]]; then
                if command -v plutil &> /dev/null; then
                    local bundle_id=$(plutil -extract CFBundleIdentifier raw "$info_plist" 2>/dev/null)
                    local bundle_version=$(plutil -extract CFBundleShortVersionString raw "$info_plist" 2>/dev/null)
                    local bundle_build=$(plutil -extract CFBundleVersion raw "$info_plist" 2>/dev/null)
                    
                    echo "  Bundle ID: ${bundle_id:-'Unknown'}"
                    echo "  Bundle Version: ${bundle_version:-'Unknown'}"
                    echo "  Bundle Build: ${bundle_build:-'Unknown'}"
                    
                    # Validate bundle ID
                    if [[ "$bundle_id" == "com.dragonworlds.hk2027" ]]; then
                        print_success "Bundle ID is correct"
                    else
                        print_warning "Bundle ID may be incorrect: $bundle_id"
                    fi
                fi
            fi
            
            # Check for common files
            check_ios_app_structure "$app_bundle"
        fi
    else
        print_warning "Could not extract IPA for inspection"
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
}

# Check iOS app structure
check_ios_app_structure() {
    local app_bundle="$1"
    
    # Check for required files
    local required_files=("Info.plist" "main.jsbundle")
    local optional_files=("assets")
    
    for file in "${required_files[@]}"; do
        if [[ -e "$app_bundle/$file" ]]; then
            echo "  ✓ $file found"
        else
            print_warning "$file not found in app bundle"
        fi
    done
    
    # Check bundle size
    local bundle_size=$(du -sh "$app_bundle" | cut -f1)
    echo "  App bundle size: $bundle_size"
}

# Inspect Android build
inspect_android_build() {
    local apk_path="$1"
    
    # Check if aapt is available (Android SDK build tools)
    if command -v aapt &> /dev/null; then
        print_status "Using aapt to inspect Android build"
        
        # Get basic APK info
        local package_info=$(aapt dump badging "$apk_path" 2>/dev/null | head -5)
        if [[ -n "$package_info" ]]; then
            echo "  Package info:"
            echo "$package_info" | sed 's/^/    /'
        fi
        
        # Check permissions
        local permissions=$(aapt dump permissions "$apk_path" 2>/dev/null)
        if [[ -n "$permissions" ]]; then
            local perm_count=$(echo "$permissions" | wc -l)
            echo "  Permissions: $perm_count declared"
        fi
        
    else
        print_warning "aapt not available, skipping detailed Android inspection"
        print_status "To enable Android inspection, install Android SDK build tools"
    fi
    
    # Basic file checks
    if command -v unzip &> /dev/null; then
        # Check if it's a valid APK/AAB
        if unzip -t "$apk_path" &>/dev/null; then
            print_success "Android package structure is valid"
            
            # List main components
            local manifest_exists=$(unzip -l "$apk_path" | grep -c "AndroidManifest.xml" || true)
            local assets_exists=$(unzip -l "$apk_path" | grep -c "assets/" || true)
            local resources_exists=$(unzip -l "$apk_path" | grep -c "resources.arsc" || true)
            
            echo "  ✓ AndroidManifest.xml: $([ $manifest_exists -gt 0 ] && echo 'Found' || echo 'Missing')"
            echo "  ✓ Assets: $([ $assets_exists -gt 0 ] && echo 'Found' || echo 'Missing')"
            echo "  ✓ Resources: $([ $resources_exists -gt 0 ] && echo 'Found' || echo 'Missing')"
        else
            print_error "Android package structure appears corrupted"
        fi
    fi
}

# Generate validation report
generate_validation_report() {
    print_status "Generating validation report..."
    
    local report_file="./build-validation-report-${BUILD_ID}.txt"
    local timestamp=$(date)
    
    cat > "$report_file" << EOF
Dragon Worlds HK 2027 - Build Validation Report
===============================================

Validation Date: $timestamp
Build ID: $BUILD_ID
Platform: $BUILD_PLATFORM
Profile: $BUILD_PROFILE

Build Information:
- Status: $BUILD_STATUS
- Version: $BUILD_VERSION
- Build Number: $BUILD_NUMBER
- SDK Version: $BUILD_SDK
- Created: $BUILD_CREATED
- Completed: $BUILD_COMPLETED

Validation Results:
- Build Status: $([ "$BUILD_STATUS" = "finished" ] && echo "✓ PASSED" || echo "✗ FAILED")
- Configuration: $([ "$BUILD_PROFILE" = "production" ] && echo "✓ PASSED" || echo "⚠ WARNING")
- Artifact Access: $([ -n "$ARTIFACT_URL" ] && echo "✓ PASSED" || echo "✗ FAILED")
- Download: $([ "$DOWNLOAD_BUILD" = true ] && echo "✓ COMPLETED" || echo "- SKIPPED")

$([ -n "$ARTIFACT_URL" ] && echo "Artifact URL: $ARTIFACT_URL" || echo "Artifact URL: Not available")

Recommendations:
$([ "$BUILD_STATUS" != "finished" ] && echo "- Wait for build completion before proceeding")
$([ "$BUILD_PROFILE" != "production" ] && [ "$BUILD_PROFILE" != "production-ios" ] && [ "$BUILD_PROFILE" != "production-android" ] && echo "- Ensure using production build profile for app store submission")
$([ -z "$ARTIFACT_URL" ] && echo "- Build artifact is not available - rebuild may be required")

Next Steps:
1. Review validation results above
2. Download and test the build on real devices
3. Perform manual quality assurance testing
4. Submit to TestFlight/Internal Testing for further validation
5. Once validated, proceed with app store submission

EOF

    print_success "Validation report generated: $report_file"
}

# Main execution
main() {
    check_dependencies
    get_build_info
    validate_build_status
    validate_build_configuration
    
    if check_artifact; then
        download_and_inspect
    fi
    
    generate_validation_report
    
    print_header "✅ Build validation completed!"
    echo
    print_success "Build $BUILD_ID ($BUILD_PLATFORM) validation summary:"
    echo "  Status: $BUILD_STATUS"
    echo "  Version: $BUILD_VERSION ($BUILD_NUMBER)"
    echo "  Profile: $BUILD_PROFILE"
    echo "  Artifact: $([ -n "$ARTIFACT_URL" ] && echo 'Available' || echo 'Not available')"
    echo
    
    if [[ "$BUILD_STATUS" == "finished" && -n "$ARTIFACT_URL" ]]; then
        print_success "✅ Build is ready for testing and submission!"
        echo
        print_status "Recommended next steps:"
        echo "  1. Download and test on real devices"
        echo "  2. Perform thorough quality assurance"
        echo "  3. Submit to TestFlight (iOS) or Internal Testing (Android)"
        echo "  4. Collect feedback from testers"
        echo "  5. Submit to app stores when ready"
    else
        print_warning "⚠️  Build requires attention before proceeding"
        echo
        print_status "Please address any issues found in the validation report"
    fi
}

# Run main function
main