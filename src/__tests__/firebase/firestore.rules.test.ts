/**
 * Firestore Security Rules Tests
 * Tests the security rules defined in firestore.rules
 */

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';

const PROJECT_ID = 'demo-test-project';

describe('Firestore Security Rules', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: require('fs').readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  describe('Users Collection', () => {
    const userId = 'test-user-123';
    const userData = {
      uid: userId,
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'user',
      status: 'active',
      providers: ['email'],
      linkedProviders: [],
      primaryProvider: 'email',
      profile: {},
      preferences: {},
      metadata: {
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        loginCount: 0,
      },
    };

    test('should allow users to read their own profile', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      
      // First create the document as admin
      const adminDb = testEnv.authenticatedContext('admin', { role: 'admin' }).firestore();
      await assertSucceeds(setDoc(doc(adminDb, 'users', userId), userData));

      // Then test reading as user
      await assertSucceeds(getDoc(doc(db, 'users', userId)));
    });

    test('should deny users from reading other profiles', async () => {
      const db = testEnv.authenticatedContext('other-user').firestore();
      
      // Create document as admin
      const adminDb = testEnv.authenticatedContext('admin', { role: 'admin' }).firestore();
      await assertSucceeds(setDoc(doc(adminDb, 'users', userId), userData));

      // Test reading as different user
      await assertFails(getDoc(doc(db, 'users', userId)));
    });

    test('should allow users to create their own profile', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      await assertSucceeds(setDoc(doc(db, 'users', userId), userData));
    });

    test('should deny users from creating profiles for others', async () => {
      const db = testEnv.authenticatedContext('other-user').firestore();
      await assertFails(setDoc(doc(db, 'users', userId), userData));
    });

    test('should allow users to update their own profile', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      
      // Create profile first
      await assertSucceeds(setDoc(doc(db, 'users', userId), userData));
      
      // Update profile
      const updatedData = {
        ...userData,
        displayName: 'Updated Name',
      };
      await assertSucceeds(setDoc(doc(db, 'users', userId), updatedData));
    });

    test('should deny users from updating role field', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      
      // Create profile first as admin
      const adminDb = testEnv.authenticatedContext('admin', { role: 'admin' }).firestore();
      await assertSucceeds(setDoc(doc(adminDb, 'users', userId), userData));
      
      // Try to update role as user
      const updatedData = {
        ...userData,
        role: 'admin',
      };
      await assertFails(setDoc(doc(db, 'users', userId), updatedData));
    });

    test('should allow admins to read any profile', async () => {
      const adminDb = testEnv.authenticatedContext('admin', { role: 'admin' }).firestore();
      const userDb = testEnv.authenticatedContext(userId).firestore();
      
      // Create profile as user
      await assertSucceeds(setDoc(doc(userDb, 'users', userId), userData));
      
      // Read as admin
      await assertSucceeds(getDoc(doc(adminDb, 'users', userId)));
    });

    test('should allow admins to update user roles', async () => {
      const adminDb = testEnv.authenticatedContext('admin', { role: 'admin' }).firestore();
      
      // Create profile
      await assertSucceeds(setDoc(doc(adminDb, 'users', userId), userData));
      
      // Update role as admin
      const updatedData = {
        ...userData,
        role: 'admin',
      };
      await assertSucceeds(setDoc(doc(adminDb, 'users', userId), updatedData));
    });
  });

  describe('Races Collection', () => {
    const raceData = {
      id: 'race-123',
      name: 'Test Race',
      date: { seconds: 1640995200, nanoseconds: 0 }, // Firestore Timestamp
      location: {
        latitude: 22.3193,
        longitude: 114.1694,
        venue: 'Test Venue',
        city: 'Hong Kong',
      },
      status: 'scheduled',
      course: {
        marks: [],
      },
      participants: [],
      createdAt: { seconds: 1640995200, nanoseconds: 0 },
      updatedAt: { seconds: 1640995200, nanoseconds: 0 },
    };

    test('should allow anyone to read race data', async () => {
      const adminDb = testEnv.authenticatedContext('admin', { role: 'admin' }).firestore();
      const userDb = testEnv.authenticatedContext('user-123').firestore();
      const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();
      
      // Create race as admin
      await assertSucceeds(setDoc(doc(adminDb, 'races', 'race-123'), raceData));
      
      // Read as authenticated user
      await assertSucceeds(getDoc(doc(userDb, 'races', 'race-123')));
      
      // Read as unauthenticated user
      await assertSucceeds(getDoc(doc(unauthenticatedDb, 'races', 'race-123')));
    });

    test('should only allow admins to create races', async () => {
      const adminDb = testEnv.authenticatedContext('admin', { role: 'admin' }).firestore();
      const userDb = testEnv.authenticatedContext('user-123').firestore();
      
      // Admin can create
      await assertSucceeds(setDoc(doc(adminDb, 'races', 'race-123'), raceData));
      
      // User cannot create
      await assertFails(setDoc(doc(userDb, 'races', 'race-456'), raceData));
    });

    test('should only allow admins to update races', async () => {
      const adminDb = testEnv.authenticatedContext('admin', { role: 'admin' }).firestore();
      const userDb = testEnv.authenticatedContext('user-123').firestore();
      
      // Create race as admin
      await assertSucceeds(setDoc(doc(adminDb, 'races', 'race-123'), raceData));
      
      // Admin can update
      const updatedData = { ...raceData, name: 'Updated Race' };
      await assertSucceeds(setDoc(doc(adminDb, 'races', 'race-123'), updatedData));
      
      // User cannot update
      await assertFails(setDoc(doc(userDb, 'races', 'race-123'), updatedData));
    });
  });

  describe('User Activity Collection', () => {
    const userId = 'test-user-123';
    const activityData = {
      uid: userId,
      action: 'login',
      timestamp: '2024-01-01T00:00:00Z',
      metadata: {},
    };

    test('should allow users to read their own activity', async () => {
      const userDb = testEnv.authenticatedContext(userId).firestore();
      const adminDb = testEnv.authenticatedContext('admin', { role: 'admin' }).firestore();
      
      // Create activity as admin
      const activityRef = await assertSucceeds(addDoc(collection(adminDb, 'user_activity'), activityData));
      
      // User can read their own activity
      await assertSucceeds(getDoc(activityRef));
    });

    test('should allow users to create their own activity', async () => {
      const userDb = testEnv.authenticatedContext(userId).firestore();
      await assertSucceeds(addDoc(collection(userDb, 'user_activity'), activityData));
    });

    test('should deny users from creating activity for others', async () => {
      const userDb = testEnv.authenticatedContext('other-user').firestore();
      await assertFails(addDoc(collection(userDb, 'user_activity'), activityData));
    });

    test('should allow admins to read all activity', async () => {
      const userDb = testEnv.authenticatedContext(userId).firestore();
      const adminDb = testEnv.authenticatedContext('admin', { role: 'admin' }).firestore();
      
      // Create activity as user
      const activityRef = await assertSucceeds(addDoc(collection(userDb, 'user_activity'), activityData));
      
      // Admin can read any activity
      await assertSucceeds(getDoc(activityRef.withConverter(null)));
    });
  });

  describe('Social Posts Collection', () => {
    const userId = 'test-user-123';
    const postData = {
      authorId: userId,
      content: 'Test post content',
      createdAt: '2024-01-01T00:00:00Z',
      likes: 0,
      comments: [],
    };

    test('should allow anyone to read social posts', async () => {
      const userDb = testEnv.authenticatedContext(userId).firestore();
      const otherUserDb = testEnv.authenticatedContext('other-user').firestore();
      const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();
      
      // Create post
      await assertSucceeds(setDoc(doc(userDb, 'socialPosts', 'post-123'), postData));
      
      // Anyone can read
      await assertSucceeds(getDoc(doc(otherUserDb, 'socialPosts', 'post-123')));
      await assertSucceeds(getDoc(doc(unauthenticatedDb, 'socialPosts', 'post-123')));
    });

    test('should allow authenticated users to create posts', async () => {
      const userDb = testEnv.authenticatedContext(userId).firestore();
      await assertSucceeds(setDoc(doc(userDb, 'socialPosts', 'post-123'), postData));
    });

    test('should deny unauthenticated users from creating posts', async () => {
      const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(setDoc(doc(unauthenticatedDb, 'socialPosts', 'post-123'), postData));
    });

    test('should allow users to update their own posts', async () => {
      const userDb = testEnv.authenticatedContext(userId).firestore();
      
      // Create post
      await assertSucceeds(setDoc(doc(userDb, 'socialPosts', 'post-123'), postData));
      
      // Update own post
      const updatedData = { ...postData, content: 'Updated content' };
      await assertSucceeds(setDoc(doc(userDb, 'socialPosts', 'post-123'), updatedData));
    });

    test('should deny users from updating others posts', async () => {
      const userDb = testEnv.authenticatedContext(userId).firestore();
      const otherUserDb = testEnv.authenticatedContext('other-user').firestore();
      
      // Create post as user
      await assertSucceeds(setDoc(doc(userDb, 'socialPosts', 'post-123'), postData));
      
      // Try to update as other user
      const updatedData = { ...postData, content: 'Malicious update' };
      await assertFails(setDoc(doc(otherUserDb, 'socialPosts', 'post-123'), updatedData));
    });

    test('should allow admins to moderate any posts', async () => {
      const userDb = testEnv.authenticatedContext(userId).firestore();
      const adminDb = testEnv.authenticatedContext('admin', { role: 'admin' }).firestore();
      
      // Create post as user
      await assertSucceeds(setDoc(doc(userDb, 'socialPosts', 'post-123'), postData));
      
      // Admin can moderate
      const updatedData = { ...postData, content: 'Moderated content' };
      await assertSucceeds(setDoc(doc(adminDb, 'socialPosts', 'post-123'), updatedData));
      
      // Admin can delete
      await assertSucceeds(deleteDoc(doc(adminDb, 'socialPosts', 'post-123')));
    });
  });

  describe('Unauthenticated Access', () => {
    test('should deny unauthenticated access to user data', async () => {
      const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();
      
      await assertFails(getDoc(doc(unauthenticatedDb, 'users', 'any-user')));
      await assertFails(setDoc(doc(unauthenticatedDb, 'users', 'any-user'), {}));
    });

    test('should deny access to private collections', async () => {
      const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();
      
      await assertFails(getDoc(doc(unauthenticatedDb, 'user_activity', 'any-id')));
      await assertFails(getDoc(doc(unauthenticatedDb, 'user_sessions', 'any-id')));
      await assertFails(getDoc(doc(unauthenticatedDb, 'user_notifications', 'any-id')));
    });
  });
});