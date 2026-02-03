# HKDW App Update - Progress Tracker

> Last Updated: 2026-02-02

## Current Focus
🎯 **Not started yet** - Awaiting plan approval

---

## Phase 1: Tab Bar Redesign
**Goal**: Create floating pill tab bar with scroll-to-hide

### Tasks
- [ ] Create `FloatingTabBar.tsx` component
  - [ ] Pill shape with rounded corners (borderRadius: 32)
  - [ ] Semi-transparent background with blur
  - [ ] Platform-specific shadows
  - [ ] Haptic feedback on press
- [ ] Create `TabBarVisibilityContext.tsx`
  - [ ] Shared animated value for tab bar position
  - [ ] Context provider for visibility control
- [ ] Update `TabNavigator.tsx` to use FloatingTabBar
- [ ] Add scroll handlers to tab screens:
  - [ ] ScheduleScreen.tsx
  - [ ] NoticesScreen.tsx
  - [ ] ResultsScreen.tsx
  - [ ] EntrantsScreen.tsx
  - [ ] MapScreen.tsx
  - [ ] MoreHome (in MoreStackNavigator)

### Files
| File | Status | Notes |
|------|--------|-------|
| `/src/components/navigation/FloatingTabBar.tsx` | ⬜ Not started | New file |
| `/src/contexts/TabBarVisibilityContext.tsx` | ⬜ Not started | New file |
| `/src/services/navigation/TabNavigator.tsx` | ⬜ Not started | Modify |

---

## Phase 2: Shipping Tab (Coming Soon)
**Goal**: Add placeholder tab for boat container tracking

### Tasks
- [ ] Create `ShippingScreen.tsx` with "Coming Soon" UI
  - [ ] Sailing boat illustration or icon
  - [ ] Feature description text
  - [ ] Optional email signup
- [ ] Add Shipping tab to TabNavigator
- [ ] Add Ship icon import

### Files
| File | Status | Notes |
|------|--------|-------|
| `/src/screens/tabs/ShippingScreen.tsx` | ⬜ Not started | New file |
| `/src/services/navigation/TabNavigator.tsx` | ⬜ Not started | Add tab |

---

## Phase 3: Authentication
**Goal**: Enable Google and Apple sign-in

### Tasks
- [ ] Firebase Console setup
  - [ ] Enable Google Sign-In provider
  - [ ] Enable Apple Sign-In provider
  - [ ] Get OAuth client IDs
- [ ] Update environment variables
  - [ ] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
  - [ ] EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
  - [ ] EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
  - [ ] EXPO_PUBLIC_APPLE_CLIENT_ID
- [ ] Enable OAuth methods in authStore.ts
- [ ] Add social login buttons to LoginScreen.tsx
- [ ] Test login flows

### Files
| File | Status | Notes |
|------|--------|-------|
| `/src/stores/authStore.ts` | ⬜ Not started | Enable methods |
| `/src/screens/auth/LoginScreen.tsx` | ⬜ Not started | Add buttons |
| `/src/config/firebase.ts` | ⬜ Not started | Verify config |
| `.env` | ⬜ Not started | Add client IDs |

---

## Phase 4: Notice Board Updates
**Goal**: Add media category and podcast entry

### Tasks
- [ ] Add MEDIA_ANNOUNCEMENTS category to types
- [ ] Add podcast entry to notice board
  - [ ] URL: https://open.spotify.com/episode/22sImt7qEH1E0ldiVmoBQ9
  - [ ] Podcast icon
  - [ ] Proper category assignment
- [ ] Update NoticesScreen UI for media section

### Files
| File | Status | Notes |
|------|--------|-------|
| `/src/types/noticeBoard.ts` | ⬜ Not started | Add category |
| `/src/services/noticeBoardService.ts` | ⬜ Not started | Add podcast |
| `/src/screens/tabs/NoticesScreen.tsx` | ⬜ Not started | Media section |

---

## Phase 5: Results Scraper
**Goal**: Update cloud function for live event data

### Tasks
- [ ] Update scrapeRaceResults.js
  - [ ] Support event ID parameter
  - [ ] Parse APAC (13241) results
  - [ ] Parse Worlds (13242) results
  - [ ] Extract standings and race results
- [ ] Create scrapeEventDocuments.js
  - [ ] Scrape notice board documents
  - [ ] Extract PDF links and metadata
- [ ] Deploy updated functions

### Files
| File | Status | Notes |
|------|--------|-------|
| `/functions/scrapeRaceResults.js` | ⬜ Not started | Update |
| `/functions/scrapeEventDocuments.js` | ⬜ Not started | New file |

---

## Phase 6: Results Integration
**Goal**: Wire live data to Results screen

### Tasks
- [ ] Update resultsService.ts
  - [ ] Add API calls to cloud function
  - [ ] 5-minute cache layer
  - [ ] Offline fallback to bundled data
- [ ] Update ResultsScreen.tsx
  - [ ] Fetch from live service
  - [ ] Loading states
  - [ ] Error handling
- [ ] Update externalUrls.ts with new endpoints

### Files
| File | Status | Notes |
|------|--------|-------|
| `/src/services/resultsService.ts` | ⬜ Not started | Wire API |
| `/src/screens/tabs/ResultsScreen.tsx` | ⬜ Not started | Live data |
| `/src/config/externalUrls.ts` | ⬜ Not started | Add URLs |

---

## Quick Reference

### Event IDs
- **Asia Pacific**: 13241
- **Dragon Worlds**: 13242

### Key URLs
```
Documents: https://www.racingrulesofsailing.org/documents/{id}/event
Schedules: https://www.racingrulesofsailing.org/schedules/{id}/event
Protest Form: https://www.racingrulesofsailing.org/protests/new?event_id={id}
Podcast: https://open.spotify.com/episode/22sImt7qEH1E0ldiVmoBQ9
```

### Design Specs (Tab Bar)
- Height: 64px
- Border Radius: 32
- Background: rgba(235, 235, 240, 0.97)
- Active Color: #007AFF
- Inactive Color: #8E8E93

---

## Notes & Blockers

*Add notes here as we work*

---

## Legend
- ⬜ Not started
- 🔄 In progress
- ✅ Complete
- ⚠️ Blocked
- 🔍 Needs review
