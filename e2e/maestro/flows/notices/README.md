# Notices Notification System - Maestro E2E Tests

End-to-end tests for the notices notification system, including toast notifications, tab badges, and per-event tracking.

## Test Flows

| Flow | Description |
|------|-------------|
| `01-basic-viewing.yaml` | Tests initial state, badge clearing, and basic viewing behavior |
| `02-pull-to-refresh.yaml` | Tests pull-to-refresh gesture and toast notifications |
| `03-event-switching.yaml` | Tests per-event tracking between APAC 2026 and Worlds 2027 |
| `04-persistence.yaml` | Tests AsyncStorage persistence across app restarts |
| `00-notices-suite.yaml` | Master suite that runs all notice tests in sequence |

## Running Tests

### Prerequisites

1. **Development server running:**
   ```bash
   npm start
   ```

2. **iOS Simulator running:**
   - Open Xcode > Open Developer Tool > Simulator
   - Or let Maestro launch it automatically

3. **Maestro CLI installed:**
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```

### Run Individual Flows

```bash
# Basic viewing test
maestro test e2e/maestro/flows/notices/01-basic-viewing.yaml

# Pull to refresh test
maestro test e2e/maestro/flows/notices/02-pull-to-refresh.yaml

# Event switching test
maestro test e2e/maestro/flows/notices/03-event-switching.yaml

# Persistence test
maestro test e2e/maestro/flows/notices/04-persistence.yaml
```

### Run All Notice Tests

```bash
# Run the full suite
maestro test e2e/maestro/flows/notices/00-notices-suite.yaml

# Or run directory (runs all .yaml files)
maestro test e2e/maestro/flows/notices/
```

### Run with Studio (Interactive Mode)

```bash
maestro studio e2e/maestro/flows/notices/01-basic-viewing.yaml
```

## Expected Behavior

### 01-basic-viewing.yaml
- App launches and navigates to Notices tab
- Badge (`badge-noticeboard`) is NOT visible (all notices marked as seen)
- Navigating away and back keeps badge hidden

### 02-pull-to-refresh.yaml
- Pull-to-refresh triggers toast notification
- Toast shows either:
  - "Notices are up to date" (info variant)
  - "X new notices" (success variant)
- Toast auto-dismisses after ~3 seconds

### 03-event-switching.yaml
- Event switcher toggles between "APAC 2026" and "Worlds 2027"
- Each event maintains separate seen state
- Switching back to previously viewed event shows no badge

### 04-persistence.yaml
- Notices are marked as seen
- App is terminated completely
- After restart, seen state is preserved (no badge)

## TestIDs Used

| TestID | Component | Purpose |
|--------|-----------|---------|
| `tab-noticeboard` | FloatingTabBar | Navigate to Notices tab |
| `tab-results` | FloatingTabBar | Navigate to Results tab |
| `badge-noticeboard` | TabBadge | Assert badge visibility on Notices tab |
| `badge-more` | TabBadge | Assert badge visibility on More tab |
| `toast-container` | Toast | Assert toast is visible |
| `toast-message` | Toast | Assert toast message content |

## Known Limitations

1. **AsyncStorage verification**: Cannot directly verify AsyncStorage contents; inferred from badge behavior
2. **Toast timing**: Auto-dismiss timing may vary; tests use generous waits
3. **Animated components**: `assertNotVisible` may not work perfectly with fading animations
4. **New notices simulation**: Cannot simulate new notices arriving in background without API mocking

## Troubleshooting

### Test fails with timeout
- Ensure dev server is running (`npm start`)
- Check simulator is responsive
- Increase `timeout` values in `extendedWaitUntil`

### Badge assertions fail
- Badge only appears when `count > 0`
- First visit to Notices tab marks all as seen
- Use `optional: true` for `assertNotVisible` on badge

### Toast not appearing
- Ensure pull-to-refresh gesture is performed correctly
- Toast appears after data refresh completes
- Check for any error toasts that might appear instead

## Related Files

- `src/stores/noticesStore.ts` - Zustand store for seen tracking
- `src/screens/tabs/NoticesScreen.tsx` - Main notices screen with toast
- `src/components/navigation/FloatingTabBar.tsx` - Tab bar with badges
- `src/components/shared/Toast.tsx` - Toast notification component
