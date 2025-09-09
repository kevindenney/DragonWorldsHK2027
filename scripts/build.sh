#!/bin/bash

# Dragon Worlds HK 2027 - Build Script
# This script handles building the app for different environments and platforms

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PLATFORM=""
ENVIRONMENT="production"
SKIP_TESTS=false
SKIP_LINT=false
AUTO_SUBMIT=false
CLEAR_CACHE=false

# Function to print colored output
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

# Function to show usage
show_usage() {
    cat << EOF
Dragon Worlds HK 2027 Build Script

Usage: $0 [OPTIONS]

OPTIONS:
    -p, --platform PLATFORM     Platform to build for (ios, android, all)
    -e, --environment ENV        Environment to build for (development, preview, production)
    -s, --skip-tests            Skip running tests before build
    -l, --skip-lint             Skip linting before build
    -a, --auto-submit           Automatically submit to app stores after build
    -c, --clear-cache           Clear all caches before building
    -h, --help                  Show this help message

EXAMPLES:
    $0 -p ios -e production              Build iOS production
    $0 -p android -e preview             Build Android preview
    $0 -p all -e production -a           Build both platforms for production and submit
    $0 -p ios -e development -s -l       Build iOS development, skip tests and lint

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--platform)
            PLATFORM="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -l|--skip-lint)
            SKIP_LINT=true
            shift
            ;;
        -a|--auto-submit)
            AUTO_SUBMIT=true
            shift
            ;;
        -c|--clear-cache)
            CLEAR_CACHE=true
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

# Validate required parameters
if [[ -z "$PLATFORM" ]]; then
    print_error "Platform is required. Use -p or --platform to specify ios, android, or all"
    show_usage
    exit 1
fi

if [[ "$PLATFORM" != "ios" && "$PLATFORM" != "android" && "$PLATFORM" != "all" ]]; then
    print_error "Invalid platform: $PLATFORM. Must be ios, android, or all"
    exit 1
fi

if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "preview" && "$ENVIRONMENT" != "production" ]]; then
    print_error "Invalid environment: $ENVIRONMENT. Must be development, preview, or production"
    exit 1
fi

# Print build configuration
print_status "🚀 Dragon Worlds HK 2027 Build Configuration"
print_status "Platform: $PLATFORM"
print_status "Environment: $ENVIRONMENT"
print_status "Skip Tests: $SKIP_TESTS"
print_status "Skip Lint: $SKIP_LINT"
print_status "Auto Submit: $AUTO_SUBMIT"
print_status "Clear Cache: $CLEAR_CACHE"
echo

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
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
    
    print_success "All dependencies are installed"
}

# Clear caches if requested
clear_caches() {
    if [[ "$CLEAR_CACHE" == true ]]; then
        print_status "Clearing caches..."
        
        # Clear npm cache
        npm cache clean --force
        
        # Clear Expo cache
        npx expo r -c
        
        # Clear Metro cache
        npx react-native start --reset-cache &
        sleep 3
        pkill -f "react-native start" || true
        
        # Clear node_modules and reinstall
        rm -rf node_modules
        npm install
        
        print_success "Caches cleared"
    fi
}

# Run linting
run_lint() {
    if [[ "$SKIP_LINT" == false ]]; then
        print_status "Running linting..."
        
        if ! npm run lint; then
            print_error "Linting failed"
            exit 1
        fi
        
        if ! npm run typecheck; then
            print_error "Type checking failed"
            exit 1
        fi
        
        print_success "Linting passed"
    else
        print_warning "Skipping linting"
    fi
}

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == false ]]; then
        print_status "Running tests..."
        
        if ! npm run test:ci; then
            print_error "Tests failed"
            exit 1
        fi
        
        print_success "Tests passed"
    else
        print_warning "Skipping tests"
    fi
}

# Build for specific platform
build_platform() {
    local platform=$1
    local build_profile=""
    
    # Determine build profile based on environment and platform
    if [[ "$ENVIRONMENT" == "production" ]]; then
        if [[ "$platform" == "ios" ]]; then
            build_profile="production-ios"
        else
            build_profile="production-android"
        fi
    else
        build_profile="$ENVIRONMENT"
    fi
    
    print_status "Building $platform for $ENVIRONMENT environment..."
    
    # Start the build
    if ! eas build --platform "$platform" --profile "$build_profile" --non-interactive; then
        print_error "Build failed for $platform"
        exit 1
    fi
    
    print_success "$platform build completed"
}

# Submit to app stores
submit_to_stores() {
    if [[ "$AUTO_SUBMIT" == true && "$ENVIRONMENT" == "production" ]]; then
        print_status "Submitting to app stores..."
        
        if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
            print_status "Submitting iOS build to App Store..."
            if ! eas submit --platform ios --profile production --non-interactive; then
                print_error "iOS submission failed"
                exit 1
            fi
            print_success "iOS submitted to App Store"
        fi
        
        if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
            print_status "Submitting Android build to Play Store..."
            if ! eas submit --platform android --profile production --non-interactive; then
                print_error "Android submission failed"
                exit 1
            fi
            print_success "Android submitted to Play Store"
        fi
    elif [[ "$AUTO_SUBMIT" == true && "$ENVIRONMENT" != "production" ]]; then
        print_warning "Auto-submit is only available for production builds"
    fi
}

# Generate build report
generate_build_report() {
    print_status "Generating build report..."
    
    # Get build information
    BUILD_TIME=$(date)
    GIT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    
    # Create build report
    cat > build-report.txt << EOF
Dragon Worlds HK 2027 - Build Report
====================================

Build Time: $BUILD_TIME
Platform: $PLATFORM
Environment: $ENVIRONMENT
Git Commit: $GIT_COMMIT
Git Branch: $GIT_BRANCH

Configuration:
- Skip Tests: $SKIP_TESTS
- Skip Lint: $SKIP_LINT
- Auto Submit: $AUTO_SUBMIT
- Clear Cache: $CLEAR_CACHE

Build Status: SUCCESS
EOF
    
    print_success "Build report generated: build-report.txt"
}

# Main build process
main() {
    print_status "🏁 Starting Dragon Worlds HK 2027 build process..."
    
    # Check dependencies
    check_dependencies
    
    # Clear caches if requested
    clear_caches
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm ci
    
    # Run pre-build checks
    run_lint
    run_tests
    
    # Build for specified platform(s)
    if [[ "$PLATFORM" == "all" ]]; then
        build_platform "ios"
        build_platform "android"
    else
        build_platform "$PLATFORM"
    fi
    
    # Submit to stores if requested
    submit_to_stores
    
    # Generate build report
    generate_build_report
    
    print_success "🎉 Build process completed successfully!"
    
    # Print next steps
    echo
    print_status "Next steps:"
    if [[ "$ENVIRONMENT" == "production" && "$AUTO_SUBMIT" == false ]]; then
        echo "  - Review the build in EAS Console"
        echo "  - Test the build thoroughly"
        echo "  - Submit to app stores with: eas submit --platform $PLATFORM"
    elif [[ "$ENVIRONMENT" != "production" ]]; then
        echo "  - Download and test the build"
        echo "  - Share with stakeholders for review"
    fi
    echo "  - Monitor app performance and crash reports"
    echo "  - Update release notes and documentation"
}

# Trap errors and cleanup
trap 'print_error "Build process failed. Check the logs above for details."; exit 1' ERR

# Run main function
main