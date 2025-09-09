# Firestore Database Structure and Indexing

## Overview

This document outlines the complete Firestore database structure for DragonWorldsHK2027, including collection schemas, indexing strategies, and performance considerations.

## Collection Structure

### 1. Users Collection (`/users/{userId}`)

**Purpose**: Main user profile data
**Document ID**: Firebase Auth UID

```typescript
{
  uid: string,                    // Firebase Auth UID
  email: string,                  // User email (indexed)
  displayName: string,            // User display name (indexed)
  photoURL?: string,              // Profile photo URL
  phoneNumber?: string,           // Phone number in E.164 format
  emailVerified: boolean,         // Email verification status
  role: 'user' | 'admin' | 'superadmin',  // User role (indexed)
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification',  // User status (indexed)
  providers: AuthProvider[],      // Authentication providers used
  linkedProviders: LinkedProvider[],  // Detailed provider info
  primaryProvider: AuthProvider,  // Primary auth provider
  profile: {
    bio?: string,
    website?: string,
    location?: string,
    dateOfBirth?: string,        // YYYY-MM-DD format
    gender?: string,
    timezone?: string,
    language?: string,           // ISO 639-1 codes
    sailing?: SailingProfile     // Sailing-specific data
  },
  preferences: {
    notifications: {
      email: boolean,
      push: boolean,
      sms: boolean
    },
    privacy: {
      profileVisible: boolean,
      emailVisible: boolean,
      phoneVisible: boolean,
      allowProviderLinking: boolean,
      allowDataSync: boolean
    },
    theme: 'light' | 'dark' | 'auto',
    oauth: {
      autoSyncProfile: boolean,
      allowMultipleAccounts: boolean,
      preferredProvider?: AuthProvider
    }
  },
  metadata: {
    createdAt: string,           // ISO timestamp
    updatedAt: string,           // ISO timestamp (indexed)
    lastLoginAt?: string,        // ISO timestamp (indexed)
    lastActiveAt?: string,       // ISO timestamp
    loginCount: number
  },
  tags?: string[]               // User tags for admin purposes
}
```

**Required Indexes**:
- `email` (ascending)
- `role` (ascending)
- `status` (ascending)
- `metadata.updatedAt` (descending)
- `metadata.lastLoginAt` (descending)
- Composite: `role, status` (both ascending)
- Composite: `status, metadata.lastLoginAt` (ascending, descending)

### 2. User Sessions Collection (`/user_sessions/{sessionId}`)

**Purpose**: Track user sessions for analytics and security
**Document ID**: Auto-generated

```typescript
{
  uid: string,                    // User ID (indexed)
  sessionId: string,              // Unique session identifier
  deviceInfo: {
    platform: string,            // iOS, Android, Web
    version: string,              // App/OS version
    model?: string               // Device model
  },
  startTime: string,             // ISO timestamp (indexed)
  endTime?: string,              // ISO timestamp
  duration?: number,             // Session duration in ms
  actions?: Array<{
    action: string,
    timestamp: string,
    data?: Record<string, any>
  }>
}
```

**Required Indexes**:
- `uid` (ascending)
- `startTime` (descending)
- Composite: `uid, startTime` (ascending, descending)

### 3. User Activity Collection (`/user_activity/{activityId}`)

**Purpose**: Log user actions for audit and analytics
**Document ID**: Auto-generated

```typescript
{
  uid: string,                    // User ID (indexed)
  action: string,                 // Action name (indexed)
  timestamp: string,              // ISO timestamp (indexed)
  metadata?: Record<string, any>, // Action-specific data
  sessionId?: string,             // Related session
  ipAddress?: string,             // User IP (hashed)
  userAgent?: string              // User agent string
}
```

**Required Indexes**:
- `uid` (ascending)
- `action` (ascending)
- `timestamp` (descending)
- Composite: `uid, timestamp` (ascending, descending)
- Composite: `action, timestamp` (ascending, descending)
- Composite: `uid, action, timestamp` (all ascending for action, desc for timestamp)

### 4. User Notifications Collection (`/user_notifications/{notificationId}`)

**Purpose**: Store user notifications and their status
**Document ID**: Auto-generated

```typescript
{
  uid: string,                    // User ID (indexed)
  notificationId: string,         // Unique notification ID
  type: 'race_update' | 'weather_alert' | 'system' | 'marketing',  // Type (indexed)
  title: string,                  // Notification title
  message: string,                // Notification message
  data?: Record<string, any>,     // Additional data
  sentAt: string,                 // ISO timestamp (indexed)
  readAt?: string,                // ISO timestamp
  deliveredAt?: string,           // ISO timestamp
  channel: 'push' | 'email' | 'sms' | 'in_app',  // Delivery channel
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'  // Status (indexed)
}
```

**Required Indexes**:
- `uid` (ascending)
- `type` (ascending)
- `sentAt` (descending)
- `status` (ascending)
- Composite: `uid, sentAt` (ascending, descending)
- Composite: `uid, status` (both ascending)
- Composite: `uid, type, sentAt` (ascending, ascending, descending)

### 5. User Preferences Collection (`/user_preferences/{userId}_{type}`)

**Purpose**: Extended user preferences (weather, etc.)
**Document ID**: `{userId}_weather`, `{userId}_app`, etc.

```typescript
// Weather Preferences
{
  uid: string,                    // User ID
  units: {
    temperature: 'celsius' | 'fahrenheit',
    windSpeed: 'knots' | 'kmh' | 'mph' | 'ms',
    pressure: 'hPa' | 'inHg' | 'mmHg',
    distance: 'nautical' | 'metric' | 'imperial'
  },
  alerts: {
    enabled: boolean,
    windSpeedThreshold: number,
    temperatureThreshold: {
      min: number,
      max: number
    },
    severeWeatherAlerts: boolean
  },
  favoriteLocations: Array<{
    id: string,
    name: string,
    coordinates: {
      latitude: number,
      longitude: number
    },
    addedAt: string
  }>
}
```

### 6. Regatta Participants Collection (`/regatta_participants/{participantId}`)

**Purpose**: Track user participation in sailing events
**Document ID**: Auto-generated

```typescript
{
  userId: string,                 // User ID (indexed)
  regattaId: string,              // Regatta identifier (indexed)
  boatName?: string,              // Boat name
  sailNumber?: string,            // Sail number
  boatClass?: string,             // Boat class (indexed)
  registrationDate: string,       // ISO timestamp
  status: 'registered' | 'confirmed' | 'cancelled',  // Status (indexed)
  crew?: Array<{
    name: string,
    role: string
  }>,
  results?: Array<{
    raceNumber: number,
    position?: number,
    points?: number,
    dnf?: boolean,
    dns?: boolean
  }>
}
```

**Required Indexes**:
- `userId` (ascending)
- `regattaId` (ascending)
- `boatClass` (ascending)
- `status` (ascending)
- Composite: `regattaId, boatClass` (both ascending)
- Composite: `userId, status` (both ascending)

### 7. Weather Favorites Collection (`/weather_favorites/{favoriteId}`)

**Purpose**: User's favorite weather locations
**Document ID**: Auto-generated

```typescript
{
  userId: string,                 // User ID (indexed)
  locationName: string,           // Location name
  coordinates: {
    latitude: number,
    longitude: number
  },
  addedAt: string,               // ISO timestamp (indexed)
  lastViewed?: string,           // ISO timestamp
  alertsEnabled: boolean,
  customName?: string            // User's custom name for location
}
```

**Required Indexes**:
- `userId` (ascending)
- `addedAt` (descending)
- Composite: `userId, addedAt` (ascending, descending)

### 8. User Subscriptions Collection (`/user_subscriptions/{subscriptionId}`)

**Purpose**: Track premium subscriptions and payments
**Document ID**: Auto-generated

```typescript
{
  userId: string,                 // User ID (indexed)
  subscriptionId: string,         // Payment provider subscription ID
  planType: string,               // Subscription plan (indexed)
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid',  // Status (indexed)
  startDate: string,              // ISO timestamp
  endDate: string,                // ISO timestamp (indexed)
  renewalDate?: string,           // ISO timestamp
  paymentMethod: string,          // Payment method type
  amount: number,                 // Subscription amount
  currency: string,               // Currency code
  paymentProvider: string,        // Stripe, Apple, Google, etc.
  metadata?: Record<string, any>
}
```

**Required Indexes**:
- `userId` (ascending)
- `status` (ascending)
- `endDate` (ascending)
- `planType` (ascending)
- Composite: `userId, status` (both ascending)
- Composite: `status, endDate` (both ascending)

## Indexing Strategy

### Performance Optimization

1. **Query Patterns**:
   - User profile lookups by UID (automatic)
   - User searches by email, display name
   - Admin queries by role, status
   - Activity logs by user and time range
   - Notifications by user, type, and read status

2. **Composite Indexes**:
   - Optimize for common multi-field queries
   - Order by most selective field first
   - Consider query frequency and data size

3. **Single Field Indexes**:
   - All fields used in `where` clauses
   - Fields used in `orderBy` operations
   - Fields with high cardinality

### Index Configuration Commands

```bash
# Users collection indexes
firebase firestore:indexes --add-field "users" "email" "ASCENDING"
firebase firestore:indexes --add-field "users" "role" "ASCENDING"
firebase firestore:indexes --add-field "users" "status" "ASCENDING"
firebase firestore:indexes --add-field "users" "metadata.updatedAt" "DESCENDING"
firebase firestore:indexes --add-field "users" "metadata.lastLoginAt" "DESCENDING"

# Composite indexes for users
firebase firestore:indexes --add-composite "users" "role:ASCENDING,status:ASCENDING"
firebase firestore:indexes --add-composite "users" "status:ASCENDING,metadata.lastLoginAt:DESCENDING"

# User activity indexes
firebase firestore:indexes --add-field "user_activity" "uid" "ASCENDING"
firebase firestore:indexes --add-field "user_activity" "action" "ASCENDING"
firebase firestore:indexes --add-field "user_activity" "timestamp" "DESCENDING"
firebase firestore:indexes --add-composite "user_activity" "uid:ASCENDING,timestamp:DESCENDING"
firebase firestore:indexes --add-composite "user_activity" "action:ASCENDING,timestamp:DESCENDING"
firebase firestore:indexes --add-composite "user_activity" "uid:ASCENDING,action:ASCENDING,timestamp:DESCENDING"

# User notifications indexes
firebase firestore:indexes --add-field "user_notifications" "uid" "ASCENDING"
firebase firestore:indexes --add-field "user_notifications" "type" "ASCENDING"
firebase firestore:indexes --add-field "user_notifications" "sentAt" "DESCENDING"
firebase firestore:indexes --add-field "user_notifications" "status" "ASCENDING"
firebase firestore:indexes --add-composite "user_notifications" "uid:ASCENDING,sentAt:DESCENDING"
firebase firestore:indexes --add-composite "user_notifications" "uid:ASCENDING,status:ASCENDING"
```

## Data Retention and Cleanup

### Automated Cleanup (Cloud Functions)

1. **Old Sessions**: Remove sessions older than 90 days
2. **Activity Logs**: Archive logs older than 1 year
3. **Notifications**: Remove read notifications older than 30 days
4. **Expired Subscriptions**: Archive cancelled subscriptions after 1 year

### GDPR Compliance

1. **Data Export**: Implement user data export functionality
2. **Data Deletion**: Complete user data removal on account deletion
3. **Data Anonymization**: Replace PII with anonymized IDs in analytics

## Performance Monitoring

### Key Metrics

1. **Query Performance**:
   - Average query time by collection
   - 95th percentile response times
   - Failed query rate

2. **Index Usage**:
   - Index hit rate
   - Unused indexes
   - Index size vs collection size

3. **Data Growth**:
   - Document count growth rate
   - Storage usage by collection
   - Read/write operation costs

### Optimization Strategies

1. **Query Optimization**:
   - Use proper field ordering in composite indexes
   - Limit result sets with pagination
   - Cache frequently accessed data

2. **Cost Optimization**:
   - Minimize document reads
   - Use selective queries
   - Implement proper pagination

3. **Scalability**:
   - Design for horizontal scaling
   - Avoid hotspots in document IDs
   - Use subcollections for large datasets

## Security Considerations

1. **Field-Level Security**: Sensitive fields should be protected
2. **Role-Based Access**: Implement proper RBAC in security rules
3. **Data Validation**: Validate all data at the security rule level
4. **Audit Logging**: Log all administrative actions

## Migration Strategy

### Schema Changes

1. **Additive Changes**: New optional fields can be added safely
2. **Field Renames**: Require data migration scripts
3. **Type Changes**: May require collection recreation
4. **Index Changes**: Can be updated without downtime

### Version Management

1. Use Cloud Functions for complex migrations
2. Implement gradual rollout for breaking changes  
3. Maintain backward compatibility when possible
4. Test all migrations in staging environment first