# Dragon Worlds HK 2027 - Comprehensive Test Report

**Date:** 2026-02-13
**App Version:** Expo SDK 53, React Native 0.79.6, React 19
**Test Frameworks:** Jest 29 + React Native Testing Library 13, Maestro 2.1.0

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Jest Test Suites | 15 |
| Jest Suites Passing | 12 (80%) |
| Jest Suites Failing | 3 (pre-existing issues) |
| Total Jest Tests | 204 |
| Jest Tests Passing | 202 (99%) |
| Jest Tests Failing | 2 (pre-existing) |
| New Test Suites Added | 8 |
| New Tests Added | 47 |
| Maestro E2E Flows Written | 14 (11 test flows + 3 support flows) |
| Maestro E2E Flows Executed | 11 (on Android Pixel 6 API 34) |
| **Maestro Flows Fully Passing** | **11/11 (100%)** |

---

## Testing Approach

### Strategy

Two testing tiers were implemented:

1. **Maestro E2E tests** for full user-flow testing on Android emulator (Pixel 6 API 34)
2. **Jest + React Native Testing Library** component rendering tests for all major screens

All 11 Maestro E2E flows pass on Android using a pre-created Firebase test account with a reusable login subflow. iOS execution remains blocked by Maestro/iOS 26.0 incompatibility. Jest component tests (47 new tests across 8 suites) all pass.

### Test Infrastructure Created

| File | Purpose |
|------|---------|
| `src/testing/testUtils.tsx` | Shared test utilities: `renderWithProviders()`, mock navigation, mock auth, mock route |
| `src/testing/setupTests.ts` | Global mocks: reanimatedWrapper, expo-linear-gradient, react-native-safe-area-context |
| `e2e/maestro/flows/00-signup-test-account.yaml` | Creates the test account in Firebase Auth (run once) |
| `e2e/maestro/flows/00-login-subflow.yaml` | Reusable login subflow included by all authenticated flows |
| `e2e/maestro/flows/00-test-login.yaml` | Quick validation that login subflow works |

### Bug Fix: Auth Error Code Preservation

During E2E testing, a bug was discovered and fixed in `src/auth/firebase/authService.ts`: the `handleAuthError` method was creating a new `Error` object without preserving the Firebase error `code` property. This prevented the `UnifiedEmailAuthScreen` from auto-switching from "Create Account" to "Welcome Back" when a user tried to register with an already-existing email (`auth/email-already-in-use` code was lost). The fix adds `newError.code = error.code` to preserve the error code through the error handling chain.

---

## Jest Component Test Results

### New Screen Tests (8 suites, 47 tests - all passing)

| Test Suite | Tests | Status | Key Assertions |
|-----------|-------|--------|----------------|
| `WelcomeScreen.test.tsx` | 7 | PASS | Renders, testIDs (welcome-screen, welcome-btn-email, welcome-btn-google, welcome-btn-apple), text content, pressable buttons |
| `UnifiedEmailAuthScreen.test.tsx` | 6 | PASS | Renders, testIDs (auth-email, auth-continue, auth-back), email input accepts text, shows email step |
| `ScheduleScreen.test.tsx` | 6 | PASS | Renders, header "Schedule", event-switch, date-picker, schedule-content, profile-button |
| `NoticesScreen.test.tsx` | 4 | PASS | Renders, header "Notices" after async loading, event-switch, profile-button |
| `ModernResultsScreen.test.tsx` | 4 | PASS | Renders, header "Results", event-switch, profile-button |
| `RaceFormsScreen.test.tsx` | 4 | PASS | Renders, header "Forms", event-switch, form sections |
| `MoreScreen.test.tsx` | 10 | PASS | Renders, headers (RACE, EVENT), testIDs for all menu items (entrants, news, contacts, sponsors, weather), navigation press |
| `FloatingTabBar.test.tsx` | 6 | PASS | Renders, all 5 tab testIDs, labels, active highlighting, press response |

### Pre-Existing Test Suites (7 suites, 157 tests)

| Test Suite | Tests | Status | Notes |
|-----------|-------|--------|-------|
| `authUtils.test.ts` | 59 | PASS | Validation, permissions, avatar, password generation |
| `timeUtils.test.ts` | 24 | PASS | Time formatting utilities |
| `scoringUtils.test.ts` | 68 | PASS | Sailing scoring calculations |
| `noticesStore.test.ts` | 4 | PASS | Zustand store state management |
| `emulator.integration.test.ts` | 0 (skipped) | FAIL | Firebase ESM import error - requires `--experimental-vm-modules` |
| `firestore.rules.test.ts` | 0 (skipped) | FAIL | Firebase ESM import error - `@firebase/rules-unit-testing` |
| `windStationService.test.ts` | 2 | FAIL | Network timeout - tests hit real external API without mocking |

### Pre-Existing Failures Analysis

All 3 failing suites have pre-existing issues unrelated to the new tests:

1. **Firebase test suites** (`emulator.integration.test.ts`, `firestore.rules.test.ts`): These fail because `@firebase/rules-unit-testing` uses ESM `import()` which requires the `--experimental-vm-modules` Node.js flag. Jest's default CommonJS transform cannot handle this. Fix: run these suites with the experimental flag or migrate to a Firebase-compatible test runner.

2. **WindStationService** (`windStationService.test.ts`): Tests call a real external wind data API which times out in CI. Fix: mock the HTTP client or add a longer timeout for integration tests.

---

## Screen Coverage Matrix

| Screen | Component Test | testIDs Added | Maestro Flow | Notes |
|--------|---------------|---------------|-------------|-------|
| WelcomeScreen | 7 tests | Yes (5 IDs) | 02-auth-welcome.yaml | Auth entry point |
| UnifiedEmailAuthScreen | 6 tests | Yes (3 IDs) | 03-auth-email-signup.yaml | Email auth flow |
| ScheduleScreen | 6 tests | No (uses mocked children) | 05-schedule-screen.yaml | Main tab |
| NoticesScreen | 4 tests | No | 06-notices-screen.yaml | Async loading tested |
| ModernResultsScreen | 4 tests | No | 07-results-screen.yaml | Main tab |
| RaceFormsScreen | 4 tests | No | 08-forms-screen.yaml | Main tab |
| MoreScreen | 10 tests | Yes (10 IDs) | 09-more-subscreens.yaml | Sub-navigation |
| FloatingTabBar | 6 tests | Yes (5 IDs) | 04-tab-navigation.yaml | Bottom navigation |
| EntrantsScreen | - | testID only | Part of 09/10 flows | Via More menu |
| NewsScreen | - | testID only | Part of 09/10 flows | Via More menu |
| ContactsScreen | - | testID only | Part of 09/10 flows | Via More menu |
| SponsorsScreen | - | testID only | Part of 09 flow | Via More menu |
| WeatherScreen | - | testID only | Part of 09 flow | Via More menu (map view) |

---

## Maestro E2E Tests — Android Execution Results

**Device:** Pixel 6 emulator, Android 14 (API 34)
**Authentication:** Pre-created Firebase test account with reusable login subflow
**Driver Setup:** Manual APK installation required (see setup notes below)

### All 11 Test Flows Passing

| Flow | File | Result | What It Tests |
|------|------|--------|---------------|
| 01 | `01-app-launch.yaml` | **PASS** | Cold start, welcome screen, branding, auth buttons, background/foreground cycle |
| 02 | `02-auth-welcome.yaml` | **PASS** | Welcome screen elements, all 3 auth buttons, email screen navigation, back button |
| 03 | `03-auth-email-signup.yaml` | **PASS** | Email input, Firebase check, signup form elements (Display Name, Password, Confirm Password), back navigation, email persistence |
| 04 | `04-tab-navigation.yaml` | **PASS** | Login, all 5 tab testIDs, navigate to each tab (Schedule/Notices/Results/Forms/More), 10-cycle rapid tab switching |
| 05 | `05-schedule-screen.yaml` | **PASS** | Login, Schedule header, APAC 2026 default event, event switching (Worlds 2027 ↔ APAC 2026), scroll behavior |
| 06 | `06-notices-screen.yaml` | **PASS** | Login, Notices header, event switcher, event switching, scroll through notices |
| 07 | `07-results-screen.yaml` | **PASS** | Login, Results header, APAC 2026, Live Results link, Rules link, event switching, scroll |
| 08 | `08-forms-screen.yaml` | **PASS** | Login, Forms header, form sections (Scoring, Administrative), individual forms, QR code toggle, event switching, scroll |
| 09 | `09-more-subscreens.yaml` | **PASS** | Login, More menu (RACE/EVENT/APP sections), 7 menu items, navigate to 8 sub-screens (Entrants, Weather, News, Contacts, Sponsors, Shipping, Data Sources, About RegattaFlow) |
| 10 | `10-full-app-tour.yaml` | **PASS** | Login, full user journey: Schedule → event switching → Notices → Results → Forms → More → Entrants → News → Contacts → return to Schedule, final tab verification |
| 11 | `11-stress-test.yaml` | **PASS** | Login, 20-cycle rapid tab switching, rapid More menu sub-screen navigation, 6-cycle rapid event switching, deep navigation chain, final stability verification |

### Login Subflow Architecture

All authenticated flows (04-11) use `runFlow: "00-login-subflow.yaml"` which handles:

1. Enter test email (`maestro.e2etest2026@gmail.com`) on welcome screen
2. Wait for Firestore `checkEmailExists` to complete (~60-90s cold start on emulator)
3. Firestore returns `false` (user doc not in Firestore) → app shows "Create Account" form
4. Fill minimal signup data and tap Create Account
5. Firebase Auth returns `auth/email-already-in-use` → app auto-switches to "Welcome Back" signin
6. Enter password (`Test2026Aa!`) and sign in → navigated to main app

This login approach works around the Firestore document gap (account exists in Firebase Auth but not in Firestore) by leveraging the `email-already-in-use` error to trigger the signin flow.

### Key Maestro Findings

**Firestore Cold Start:** On the Android emulator, the first Firestore query after `clearState: true` takes 60-90 seconds. The login subflow uses a 120-second timeout to accommodate this.

**Android Accessibility Tree Gaps:**
- Weather screen (map-based view) doesn't expose "Weather" title text
- Shipping and Data Sources screens use WebView-like content not in the accessibility tree
- Notice category filter "All 2" doesn't match plain "All" text selector
- Entrants screen shows event title instead of "Entrants" header

**Text Input on Android:**
- Display Name field is auto-focused on mount — `inputText` works directly without tapping
- Password/Confirm Password fields require `tapOn: below: "Label"` to focus the TextInput child
- Using testIDs on container Views doesn't focus child TextInputs (testID is on View, not TextInput)
- `pressKey: tab` does NOT reliably move focus between React Native TextInput fields on Android

### iOS Execution Blocker

Maestro 2.1.0's XCTest driver fails on iOS 26.0 (Xcode 26.0.1):
```
UnknownFailure(errorResponse=Request for viewHierarchy failed, code: 500, body: )
```
No older iOS runtimes were available. Monitor Maestro releases for iOS 26 support.

### Android Driver Setup Note

Maestro 2.1.0 does not auto-install its instrumentation APKs on Android API 34. Manual setup required:
```bash
# Extract APKs from Maestro JAR
jar -xf ~/.maestro/lib/maestro-client.jar maestro-server.apk maestro-app.apk
# Install on emulator
adb install maestro-server.apk
adb install maestro-app.apk
# Start instrumentation server
adb shell am instrument -w dev.mobile.maestro.test/androidx.test.runner.AndroidJUnitRunner &
# Set up port forwarding
adb forward tcp:7001 tcp:7001
```

---

## Test Infrastructure Upgrades

| Package | Previous | Updated | Reason |
|---------|----------|---------|--------|
| `react-test-renderer` | 18.2.0 | 19.0.0 | React 19 compatibility (ReactCurrentOwner error) |
| `@testing-library/react-native` | 12.9.0 | 13.3.3 | React 19 host component detection fix |

---

## Key Technical Findings

### Bug Fix: Firebase Error Code Preservation

**File:** `src/auth/firebase/authService.ts` (line ~683)

The `handleAuthError` method was stripping the Firebase error `code` property when creating a new Error object. This prevented `UnifiedEmailAuthScreen.handleSignUp()` from detecting `auth/email-already-in-use` and auto-switching to the signin screen. Fix: added `newError.code = error.code` to preserve the error code.

### Mocking Patterns Required (Jest)

1. **Named exports throughout**: The entire codebase uses named exports (`export const X`, `export function X`). All mock factories must use `{ ComponentName: ... }` pattern, not `{ default: ... }`.

2. **Barrel import mocking**: NoticesScreen imports from `../../components/ios` (barrel). The barrel must be mocked as a whole module with all used exports.

3. **Async component loading**: NoticesScreen creates a `NoticeBoardService` class instance and calls `getEvent()` on mount. The mock must resolve this promise for the component to render past its loading state. Tests use `jest.useFakeTimers()` + `act(async () => { jest.runAllTimers() })`.

4. **Zustand selector pattern**: `useToastStore((state) => state.showToast)` requires the mock to accept and apply a selector function.

5. **Navigation with getParent()**: MoreScreen calls `navigation.getParent().setOptions()` and `getParent().addListener()`. The mock must return an object with all expected methods including `addListener`.

6. **reanimatedWrapper**: A global mock in `setupTests.ts` handles the custom `reanimatedWrapper.ts` animation abstraction, providing stubs for `useSharedValue`, `useAnimatedStyle`, `withTiming`, `withSpring`, etc.

### Module Path Map

Several import paths were non-obvious:

| Import in code | Actual file location |
|----------------|---------------------|
| `../../hooks/useAuth` | `src/hooks/useAuth.ts` (NoticesScreen) |
| `../../auth/useAuth` | `src/auth/useAuth.ts` (most other screens) |
| `../../components/ios` | `src/components/ios/index.ts` (barrel) |
| `../../utils/haptics` | `src/utils/haptics.ts` |
| `../../services/noticeBoardService` | `src/services/noticeBoardService.ts` (default export class) |

---

## Recommendations

### Immediate (Low Effort)

1. **Fix windStationService test**: Mock the HTTP client instead of hitting real API to prevent timeout failures.
2. **Add `--forceExit` to test script**: The `package.json` test script should include `--forceExit` to handle lingering async operations cleanly.

### Short Term

3. **Create Firestore user document on signup**: The `register` method in `authService.ts` should ensure the Firestore user document is created reliably. Currently, the `setDoc` call may silently fail or timeout, leaving accounts without Firestore documents. This causes `checkEmailExists` to return `false` for existing accounts.
4. **Add testIDs to remaining screens**: ScheduleScreen, NoticesScreen, ResultsScreen, and RaceFormsScreen lack comprehensive testIDs for interactive elements.
5. **Fix Firebase test infrastructure**: Either add `--experimental-vm-modules` to a separate test script or migrate Firebase rules tests to the Firebase CLI test runner.
6. **Script Maestro Android driver setup**: Automate the manual APK extraction/installation steps so Maestro works out-of-the-box on Android emulators.

### Medium Term

7. **Add interaction tests**: Current screen tests verify rendering only. Add tests for button presses, form submissions, navigation flows.
8. **Add async state tests**: Test loading, error, and empty states for data-fetching screens (Notices, Results, Schedule).
9. **Add Zustand store tests**: Only `noticesStore` has tests. Add coverage for `eventStore`, `newsStore`, `userStore`, `toastStore`.

### Long Term

10. **CI integration**: Add Jest tests to CI pipeline with coverage thresholds.
11. **Visual regression**: Consider adding snapshot tests or visual regression tools for critical UI screens.
12. **Performance benchmarking**: Add render performance tests for complex screens (Notices with many items, Results with large datasets).

---

## Files Created/Modified

### New Files
- `src/testing/testUtils.tsx` - Test utilities and mocks
- `src/screens/__tests__/WelcomeScreen.test.tsx` - 7 tests
- `src/screens/__tests__/UnifiedEmailAuthScreen.test.tsx` - 6 tests
- `src/screens/__tests__/ScheduleScreen.test.tsx` - 6 tests
- `src/screens/__tests__/NoticesScreen.test.tsx` - 4 tests
- `src/screens/__tests__/ModernResultsScreen.test.tsx` - 4 tests
- `src/screens/__tests__/RaceFormsScreen.test.tsx` - 4 tests
- `src/screens/__tests__/MoreScreen.test.tsx` - 10 tests
- `src/components/__tests__/FloatingTabBar.test.tsx` - 6 tests
- `e2e/maestro/flows/00-signup-test-account.yaml` - Account creation flow (run once)
- `e2e/maestro/flows/00-login-subflow.yaml` - Reusable login subflow
- `e2e/maestro/flows/00-test-login.yaml` - Login validation flow
- `e2e/maestro/flows/01-app-launch.yaml` through `11-stress-test.yaml` - 11 Maestro test flows

### Modified Files
- `src/testing/setupTests.ts` - Added global mocks for reanimatedWrapper, expo-linear-gradient
- `src/auth/firebase/authService.ts` - Fixed error code preservation in `handleAuthError`
- `package.json` - Updated react-test-renderer (19.0.0), @testing-library/react-native (13.3.3)
