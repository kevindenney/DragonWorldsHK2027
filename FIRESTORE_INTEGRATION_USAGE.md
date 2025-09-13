# Firestore Integration Usage Guide

## Overview

This guide demonstrates how to use the Firestore database integration for user profile management in the DragonWorldsHK2027 app.

## Quick Start

```typescript
import { userProfileService, authService } from '../services';
import { userDatabaseService } from '../services/database';

// Listen to authentication state and sync with Firestore
authService.subscribe((authState) => {
  if (authState.isAuthenticated && authState.user) {
    console.log('User authenticated:', authState.user);
    // User profile is automatically created/synced via authSyncService
  }
});
```

## User Profile Management

### Creating User Profiles

User profiles are automatically created when users sign in for the first time:

```typescript
import { authService } from '../services/auth';

// Sign in with email/password - profile auto-created
const user = await authService.login({
  email: 'user@example.com',
  password: 'password123'
});

// Sign in with Google - profile auto-created
const googleUser = await authService.signInWithGoogle();
```

### Reading User Profiles

```typescript
import { userProfileService, userDatabaseService } from '../services';

// Get current user profile
const currentUser = userProfileService.getCurrentUser();

// Get any user profile by UID (admins only)
const userProfile = await userDatabaseService.getUserProfile(userId);

// Subscribe to current user profile changes
const unsubscribe = userProfileService.subscribeToCurrentUserProfile((user) => {
  if (user) {
    console.log('User profile updated:', user);
  }
});

// Later, unsubscribe
unsubscribe();
```

### Updating User Profiles

```typescript
import { userProfileService } from '../services';

// Update basic profile information
await userProfileService.updateProfileInfo({
  displayName: 'New Display Name',
  photoURL: 'https://example.com/photo.jpg',
  profile: {
    bio: 'Sailing enthusiast from Hong Kong',
    location: 'Hong Kong',
    sailing: {
      experienceLevel: 'advanced',
      homePort: 'Aberdeen',
      sailingClub: 'Royal Hong Kong Yacht Club'
    }
  }
});

// Update user preferences
await userProfileService.updatePreferences({
  notifications: {
    email: true,
    push: true,
    sms: false
  },
  theme: 'dark',
  privacy: {
    profileVisible: true,
    emailVisible: false
  }
});

// Update weather preferences
await userProfileService.updateWeatherPreferences({
  units: {
    temperature: 'celsius',
    windSpeed: 'knots',
    pressure: 'hPa'
  },
  alerts: {
    enabled: true,
    windSpeedThreshold: 25,
    severeWeatherAlerts: true
  }
});
```

## Database Operations

### Direct Database Service Usage

```typescript
import { userDatabaseService } from '../services/database';

// Get users by role (admin function)
const admins = await userDatabaseService.getUsersByRole('admin', {
  limit: 10,
  orderBy: { field: 'metadata.lastLoginAt', direction: 'desc' }
});

// Search users by email
const users = await userDatabaseService.searchUsers('john@', {
  limit: 5
});

// Get user activity logs
const activities = await userDatabaseService.getUserActivities(userId, {
  limit: 20,
  orderBy: { field: 'timestamp', direction: 'desc' }
});

// Get user notifications
const notifications = await userDatabaseService.getUserNotifications(userId, {
  where: [{ field: 'status', operator: '==', value: 'unread' }],
  limit: 10
});
```

### User Session Tracking

```typescript
import { userDatabaseService } from '../services/database';

// Start user session
const session = await userDatabaseService.createUserSession({
  uid: userId,
  sessionId: generateSessionId(),
  deviceInfo: {
    platform: Platform.OS,
    version: Constants.nativeAppVersion || '1.0.0',
    model: Platform.OS === 'ios' ? getDeviceTypeSync() : 'Android'
  },
  startTime: toFirestoreTimestamp()
});

// End user session
await userDatabaseService.updateUserSession(session.id, {
  endTime: toFirestoreTimestamp(),
  duration: Date.now() - new Date(session.startTime).getTime()
});
```

## Real-time Updates

### Subscribe to User Changes

```typescript
import { userDatabaseService } from '../services/database';

// Subscribe to specific user profile changes
const unsubscribe = userDatabaseService.subscribeToUserProfile(userId, (user) => {
  if (user) {
    updateUI(user);
  }
});

// Subscribe to user notifications
const notificationUnsubscribe = userDatabaseService.subscribeToCollection(
  'user_notifications',
  {
    where: [
      { field: 'uid', operator: '==', value: userId },
      { field: 'status', operator: '==', value: 'unread' }
    ],
    orderBy: { field: 'sentAt', direction: 'desc' }
  },
  (notifications) => {
    updateNotificationBadge(notifications.length);
  }
);
```

## Error Handling

```typescript
import { 
  userProfileService, 
  UserProfileServiceError,
  FirestoreServiceError 
} from '../services';

try {
  await userProfileService.updateProfile({
    displayName: 'New Name'
  });
} catch (error) {
  if (error instanceof UserProfileServiceError) {
    switch (error.code) {
      case 'not_authenticated':
        // Redirect to login
        break;
      case 'profile_update_failed':
        // Show error message
        break;
    }
  } else if (error instanceof FirestoreServiceError) {
    switch (error.code) {
      case 'permission_denied':
        // Handle permission error
        break;
      case 'service_unavailable':
        // Show retry option
        break;
    }
  }
}
```

## Admin Functions

```typescript
import { userDatabaseService } from '../services/database';

// Admin: Get all users with pagination
const { data: users, hasMore, lastDoc } = await userDatabaseService.getUsers({
  limit: 20,
  orderBy: { field: 'metadata.createdAt', direction: 'desc' }
});

// Admin: Batch update users
await userDatabaseService.batchUpdateUsers([
  {
    uid: 'user1',
    data: { status: 'active' }
  },
  {
    uid: 'user2',
    data: { role: 'admin' }
  }
]);

// Admin: Get user statistics
const totalUsers = await userDatabaseService.getUsersCount();
const activeUsers = await userDatabaseService.getUsersCount({ status: 'active' });
const admins = await userDatabaseService.getUsersCount({ role: 'admin' });
```

## Integration with React Components

```typescript
import React, { useEffect, useState } from 'react';
import { userProfileService } from '../services';
import type { User } from '../types/auth';

export const UserProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to user profile changes
    const unsubscribe = userProfileService.subscribeToCurrentUserProfile((userData) => {
      setUser(userData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleUpdateProfile = async (updates: any) => {
    try {
      await userProfileService.updateProfileInfo(updates);
      // UI will automatically update via subscription
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!user) return <NotAuthenticatedView />;

  return (
    <View>
      <Text>{user.displayName}</Text>
      <Text>{user.email}</Text>
      <Button onPress={() => handleUpdateProfile({ displayName: 'New Name' })} />
    </View>
  );
};
```

## Best Practices

### 1. Always Use the Service Layer

```typescript
// ✅ Good - Use service layer
import { userProfileService } from '../services';
const user = await userProfileService.updateProfile(updates);

// ❌ Bad - Direct database access
import { userDatabaseService } from '../services/database';
const user = await userDatabaseService.updateUserProfile(uid, updates);
```

### 2. Handle Authentication States

```typescript
// ✅ Good - Check authentication
if (userProfileService.getCurrentUser()) {
  await userProfileService.updateProfile(updates);
} else {
  // Redirect to login
}

// ❌ Bad - No auth check
await userProfileService.updateProfile(updates); // Will throw error if not authenticated
```

### 3. Proper Error Handling

```typescript
// ✅ Good - Specific error handling
try {
  await userProfileService.updateProfile(updates);
} catch (error) {
  if (error instanceof UserProfileServiceError) {
    handleProfileError(error);
  } else {
    handleGenericError(error);
  }
}

// ❌ Bad - Generic error handling
try {
  await userProfileService.updateProfile(updates);
} catch (error) {
  console.error('Something went wrong:', error);
}
```

### 4. Clean Up Subscriptions

```typescript
// ✅ Good - Proper cleanup
useEffect(() => {
  const unsubscribe = userProfileService.subscribeToCurrentUserProfile(setUser);
  return unsubscribe; // Clean up on unmount
}, []);

// ❌ Bad - No cleanup
useEffect(() => {
  userProfileService.subscribeToCurrentUserProfile(setUser);
}, []); // Memory leak!
```

## Performance Considerations

1. **Use Pagination**: Always use pagination for large datasets
2. **Subscribe Wisely**: Only subscribe to data you actually need
3. **Cache Strategy**: Service layer handles caching automatically
4. **Batch Operations**: Use batch updates for multiple changes
5. **Index Optimization**: Follow the indexing strategy in firestore-structure.md

## Security Notes

1. **Client-Side Validation**: Always validate data on the client
2. **Server-Side Rules**: Security rules enforce data integrity
3. **Role-Based Access**: Different permissions for users/admins
4. **Activity Logging**: All actions are automatically logged
5. **Privacy Controls**: Respect user privacy preferences

## Testing

```typescript
// Mock the services for testing
import { userProfileService } from '../services';

jest.mock('../services', () => ({
  userProfileService: {
    getCurrentUser: jest.fn(),
    updateProfile: jest.fn(),
    subscribeToCurrentUserProfile: jest.fn()
  }
}));

test('should update user profile', async () => {
  const mockUser = { id: '1', displayName: 'Test User' };
  (userProfileService.updateProfile as jest.Mock).mockResolvedValue(mockUser);
  
  const result = await userProfileService.updateProfile({ displayName: 'New Name' });
  expect(result).toEqual(mockUser);
});
```

This integration provides a robust, type-safe, and scalable solution for user profile management with real-time updates, proper error handling, and comprehensive security rules.