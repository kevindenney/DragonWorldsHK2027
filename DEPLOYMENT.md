# Dragon Worlds HK 2027 - Deployment Guide

This guide covers the complete deployment process for the Dragon Worlds HK 2027 mobile application.

## Overview

The app is built using Expo and deployed using EAS (Expo Application Services) to both iOS App Store and Google Play Store.

## Prerequisites

### Required Tools
- Node.js 18+ and npm
- EAS CLI: `npm install -g @expo/eas-cli`
- Xcode (for iOS builds)
- Android Studio (for Android builds)
- Git

### Accounts Required
- Expo account (for EAS)
- Apple Developer Program membership (for iOS)
- Google Play Console developer account (for Android)

### Environment Setup
1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Login to EAS**
   ```bash
   eas login
   ```

3. **Configure Project**
   ```bash
   eas build:configure
   ```

## Build Profiles

The project includes several build profiles defined in `eas.json`:

### Development
- **Purpose**: Development and debugging
- **Distribution**: Internal only
- **Features**: Development client, debugging enabled

### Preview
- **Purpose**: Testing and preview builds
- **Distribution**: Internal testing
- **Features**: Production-like but not for store release

### Production
- **Purpose**: App Store releases
- **Distribution**: App stores
- **Features**: Optimized, signed for distribution

## Deployment Process

### 1. Pre-Build Checklist

Run the comprehensive preparation script:
```bash
npm run prepare-submission
```

This script will:
- Check all dependencies and configuration
- Validate required assets
- Generate submission materials
- Create detailed checklists

### 2. Build for Production

#### iOS Build
```bash
npm run bundle:ios
```

#### Android Build
```bash
npm run bundle:android
```

#### Both Platforms
```bash
npm run bundle:all
```

### 3. Validate Builds

After builds complete, validate them:
```bash
npm run validate-build
```

Or validate a specific build:
```bash
./scripts/post-build-validation.sh -b [BUILD_ID] -p [PLATFORM]
```

### 4. Submit to App Stores

#### iOS App Store
```bash
npm run submit:ios
```

#### Google Play Store
```bash
npm run submit:android
```

## Environment Configuration

### Environment Variables

The app uses environment-aware configuration through `deploymentConfig.ts`:

```typescript
// Development
API_URL=https://dev-api.dragonworlds.com
WEATHER_API_URL=https://dev-weather-api.dragonworlds.com

// Staging
API_URL=https://staging-api.dragonworlds.com
WEATHER_API_URL=https://staging-weather-api.dragonworlds.com

// Production
API_URL=https://api.dragonworlds.com
WEATHER_API_URL=https://weather-api.dragonworlds.com
```

### Feature Flags

Features can be toggled per environment:
- `analyticsEnabled`: User analytics tracking
- `sentryEnabled`: Crash reporting
- `debugMenuEnabled`: Development debug tools
- `pushNotificationsEnabled`: Push notifications

## Testing Strategy

### Pre-Release Testing

1. **Unit Tests**
   ```bash
   npm run test:coverage
   ```

2. **Accessibility Testing**
   ```bash
   npm run test:accessibility
   ```

3. **Performance Analysis**
   ```bash
   npm run build:analyze
   ```

4. **Bundle Optimization**
   ```bash
   npm run optimize
   ```

### Device Testing

Test on real devices before submission:
- iPhone (various models and iOS versions)
- iPad (if supporting tablets)
- Android phones (different screen sizes)
- Android tablets (if supporting tablets)

## Performance Optimization

### Bundle Analysis

Regular bundle analysis helps maintain optimal app size:
```bash
npm run build:analyze
```

### Key Optimizations
- Metro bundler configuration for production
- Image optimization and lazy loading
- Code splitting and dynamic imports
- Tree shaking for unused code removal
- Performance monitoring with custom metrics

## Monitoring and Analytics

### Crash Reporting
- Sentry integration for error tracking
- Real-time crash monitoring
- Performance issue detection

### Analytics
- User behavior tracking
- Feature usage analytics
- Performance metrics
- Custom sailing-specific events

### Performance Monitoring
- App launch times
- API response times
- Component render performance
- Memory usage tracking

## Over-the-Air Updates

### Update Strategy
1. Critical bug fixes: Immediate OTA updates
2. Minor features: Weekly release cycle  
3. Major features: App Store releases

### Update Commands
```bash
# Create update
eas update --branch production --message "Bug fixes and improvements"

# Preview update
eas update --branch preview --message "Testing new features"
```

## Version Management

### Semantic Versioning
- **Major**: Breaking changes or major new features
- **Minor**: New features, backwards compatible
- **Patch**: Bug fixes and small improvements

### Version Bumping
```bash
# Update version in app.json
# Increment build numbers for each platform
# Update CHANGELOG.md
# Create git tag
```

## Store Submission Checklist

### iOS App Store
- [ ] Production build completed successfully
- [ ] TestFlight testing completed
- [ ] App Store Connect metadata complete
- [ ] Screenshots for all device sizes
- [ ] App icon and assets uploaded
- [ ] Privacy policy and support URLs set
- [ ] In-app purchases configured
- [ ] Age rating completed
- [ ] App Review Guidelines compliance verified

### Google Play Store
- [ ] Production AAB build completed
- [ ] Internal testing completed
- [ ] Play Console listing complete
- [ ] Screenshots for all device types
- [ ] Feature graphic and icon uploaded
- [ ] Content rating completed
- [ ] Data safety form completed
- [ ] Play policies compliance verified

## Troubleshooting

### Common Build Issues

1. **Build Fails**
   - Check EAS build logs
   - Verify all dependencies are compatible
   - Ensure certificates are valid

2. **App Crashes on Launch**
   - Check native module compatibility
   - Verify asset paths and imports
   - Test on multiple devices

3. **Store Rejection**
   - Review rejection feedback carefully
   - Address all mentioned issues
   - Re-test thoroughly before resubmission

### Support Resources

- **EAS Documentation**: https://docs.expo.dev/eas/
- **Expo Forums**: https://forums.expo.dev/
- **React Native Issues**: https://github.com/facebook/react-native/issues
- **Project Issues**: https://github.com/dragonworlds/hk2027-app/issues

## Security Considerations

### Code Protection
- Enable Hermes engine for Android
- Obfuscation for sensitive code
- API key protection using environment variables

### Data Protection
- Encrypt sensitive local data
- Use secure network communications (HTTPS)
- Implement proper authentication flows
- Follow platform security guidelines

## Rollback Strategy

### Emergency Rollback
1. **Over-the-Air**: Revert to previous update
2. **App Store**: Request expedited review for hotfix
3. **Google Play**: Use staged rollout controls

### Rollback Commands
```bash
# Revert OTA update
eas update --branch production --message "Reverting to stable version"

# Emergency app store build
./scripts/build.sh -p ios -e production --skip-tests
```

## CI/CD Integration

### GitHub Actions
The project can be integrated with GitHub Actions for automated:
- Testing on pull requests
- Automated builds on merge
- Store submissions on releases

### Example Workflow
```yaml
# .github/workflows/build-and-deploy.yml
name: Build and Deploy
on:
  push:
    tags: ['v*']
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test:ci
      - name: Build for production
        run: npm run bundle:all
```

## Support and Maintenance

### Post-Launch Monitoring
- Monitor crash rates and user feedback
- Track key performance metrics
- Regular security updates
- Dependency updates and maintenance

### Update Schedule
- **Critical fixes**: As needed
- **Minor updates**: Bi-weekly
- **Major releases**: Monthly or quarterly

---

For questions or issues with deployment, please refer to:
- Project documentation
- EAS CLI documentation  
- Contact the development team

**Happy Deploying! ⛵🚀**