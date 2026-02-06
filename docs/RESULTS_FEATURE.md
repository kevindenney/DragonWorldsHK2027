# Results Management System

## Overview

The RegattaFlow results system displays live championship standings scraped from racingrulesofsailing.org, with intelligent fallback to bundled mock data for testing and offline scenarios.

## Architecture

### Data Flow

```
User Opens Results Tab
        ↓
  Check Dev Mode
        ↓
Dev Mode ON ────────→ Return Mock Data
        ↓                    ↓
  Check Cache         Update Timestamp
  (5-min TTL)               ↓
        ↓             Display Results
Cache Hit → Return Cached Data
        ↓
  Cache Miss
        ↓
Fetch from Cloud Function
        ↓
API Success ──────→ Cache & Display
        ↓
API Failure ──────→ Fallback to Mock Data
```

### Key Files

| File | Purpose |
|------|---------|
| `src/services/resultsService.ts` | Core service with caching, API calls, and dev mode |
| `src/utils/scoringUtils.ts` | Scoring validation and calculation utilities |
| `src/utils/timeUtils.ts` | Timestamp formatting (formatRelativeTime) |
| `src/screens/tabs/ModernResultsScreen.tsx` | Main results display UI |
| `src/data/mockChampionshipData.ts` | Bundled mock championship data |
| `src/screens/DataSourcesScreen.tsx` | Dev mode toggle UI |

## Features

### 1. Dev Mode Toggle

**Purpose:** Force mock data display for UI testing without API dependency.

**API:**
```typescript
import { resultsService } from '@/services/resultsService';

// Enable mock data (dev builds only)
resultsService.setForceMockData(true);

// Check current state
const isUsingMock = resultsService.getForceMockData();

// Disable mock data
resultsService.setForceMockData(false);
```

**UI Access:**
1. Navigate to More → Data Sources screen
2. Scroll to "Developer Settings" section (only visible in `__DEV__` builds)
3. Toggle "Force Mock Results Data" switch
4. Navigate to Results tab to see mock data

**Visual Indicator:**
- Yellow banner appears: "Dev Mode: Using Mock Data"
- Only visible when `__DEV__` and `forceMockData` are both true

### 2. Mock Championship Data

**APAC Championship 2026:**
- 12 competitors
- 7 races, 1 discard
- Fleet size penalty: 13 points (DNF/DNS/OCS)
- Includes realistic scenarios: DNF, OCS, gear failures

**Dragon Worlds 2027:**
- 15 competitors
- 12 races, 2 discards
- Fleet size penalty: 16 points (DNF/DNS/OCS)
- Includes ties, comebacks, and penalty scenarios

**Scoring System:**
```
Low Point System:
- 1st place = 1 point
- 2nd place = 2 points
- ...
- DNF/DNS/OCS = Fleet size + 1 points

Discards:
- 1-6 races: 1 discard
- 7-9 races: 1 discard
- 10-12 races: 2 discards
```

### 3. Auto-Updating Timestamp

**Behavior:**
- Shows relative time since last data fetch
- Updates every 60 seconds while screen is focused
- Pauses when app is backgrounded or screen loses focus
- Resumes immediately when returning to screen

**Display Formats:**
| Time Elapsed | Display |
|--------------|---------|
| < 60 seconds | "just now" |
| 1-59 minutes | "5 mins ago" |
| 1-23 hours | "2 hours ago" |
| > 24 hours | "Jan 15, 10:30 AM" |

**API:**
```typescript
import { resultsService } from '@/services/resultsService';
import { formatRelativeTime } from '@/utils/timeUtils';

const lastFetch = resultsService.getLastFetchTime('dragon-worlds-2027');
if (lastFetch) {
  const formatted = formatRelativeTime(lastFetch);
  console.log(`Updated: ${formatted}`); // "Updated: 5 mins ago"
}
```

### 4. Scoring Validation Utilities

**Available Functions:**

```typescript
import {
  validateScoringConsistency,
  calculateDiscardCount,
  findDiscards,
  calculateNetPoints,
  validateChampionshipScoring,
  logScoringValidationWarnings,
} from '@/utils/scoringUtils';

// Validate a single competitor
const result = validateScoringConsistency(
  [1, 3, 2, 5, 2, 1, 4], // race results
  [5],                    // discards
  13                      // expected total
);
// { isValid: true, calculated: 13, expected: 13, difference: 0 }

// Calculate number of discards for race count
const discards = calculateDiscardCount(7); // returns 1

// Find worst results to discard
const toDiscard = findDiscards([1, 3, 2, 5, 2, 1, 4], 1); // returns [5]

// Calculate net points after discards
const netPoints = calculateNetPoints([1, 3, 2, 5, 2, 1, 4], 1); // returns 13

// Validate all competitors in championship
const issues = validateChampionshipScoring(competitors);

// Log warnings to console (dev only)
logScoringValidationWarnings('APAC 2026', competitors);
```

## Testing

### Unit Tests

**Location:** `src/utils/__tests__/timeUtils.test.ts`

**Coverage:** 27 test cases for `formatRelativeTime()`
- Recent times (< 1 min)
- Minutes ago (1-59 mins)
- Hours ago (1-23 hours)
- Formatted dates (> 24 hours)
- Edge cases (0, negative, future)
- Invalid inputs

**Running Tests:**
```bash
npm test -- --testPathPattern="timeUtils.test.ts"
```

### Manual Testing Checklist

**Dev Mode:**
- [ ] Toggle appears only in `__DEV__` builds
- [ ] Toggle persists during navigation
- [ ] Banner shows when mock data active
- [ ] Cache clears when toggled
- [ ] Works with both APAC and Worlds data

**Timestamp:**
- [ ] Shows "just now" immediately after fetch
- [ ] Updates to "1 min ago" after 60 seconds
- [ ] Stops updating when screen loses focus
- [ ] Resumes when screen regains focus
- [ ] Pauses when app goes to background

**Scoring:**
- [ ] All mock competitors have valid scores
- [ ] Discards properly excluded from totals
- [ ] Position ordering is correct

## API Reference

### ResultsService

```typescript
class ResultsService {
  /**
   * Get championship data with caching and fallback
   * @param eventId - Event ID ('asia-pacific-2026' or '13241')
   * @param forceRefresh - Bypass cache
   */
  async getChampionship(eventId: string, forceRefresh?: boolean): Promise<Championship>

  /**
   * Force mock data in dev mode
   * @param enabled - Whether to use mock data
   * @note Only works in __DEV__ builds
   */
  setForceMockData(enabled: boolean): void

  /**
   * Check if mock data is being forced
   */
  getForceMockData(): boolean

  /**
   * Get timestamp of last successful fetch
   * @param eventId - Event ID
   * @returns Unix timestamp in ms, or null
   */
  getLastFetchTime(eventId: string): number | null

  /**
   * Clear cache for specific event or all events
   */
  clearCache(eventId?: string): void
}
```

### Time Utilities

```typescript
/**
 * Format timestamp as relative time
 * @param timestamp - Date, number (ms), or ISO string
 * @returns Human-readable string
 */
function formatRelativeTime(timestamp: string | number | Date): string
```

### Scoring Utilities

```typescript
interface ScoringValidationResult {
  isValid: boolean;
  calculated: number;
  expected: number;
  difference: number;
  message?: string;
}

function validateScoringConsistency(
  raceResults: number[],
  discards: number[],
  expectedTotal: number
): ScoringValidationResult

function calculateDiscardCount(totalRaces: number): number

function findDiscards(raceResults: number[], discardCount: number): number[]

function calculateNetPoints(raceResults: number[], discardCount: number): number
```

## Troubleshooting

### "No Results" showing when dev mode is off
- Check network connectivity
- Verify racingrulesofsailing.org is accessible
- Check cloud function logs for errors
- Results may genuinely be empty if racing hasn't started

### Timestamp not updating
- Ensure screen is focused (navigate away and back)
- Check if app was backgrounded (timestamp updates on foreground)
- Verify `useFocusEffect` is working correctly

### Scoring validation warnings in console
- Check mock data for calculation errors
- Ensure discards match worst results
- Verify fleet size penalty (DNF = fleet + 1)

## Future Enhancements (Planned)

1. **AsyncStorage Persistence** - Remember dev mode state across restarts
2. **CSV Export** - Export standings for offline analysis
3. **Offline Caching** - Show cached results when offline
4. **Competitor Detail Screen** - Drill down into individual performance
5. **Live Race Tracking** - Real-time position updates during racing
