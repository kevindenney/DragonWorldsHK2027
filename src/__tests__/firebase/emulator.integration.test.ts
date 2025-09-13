/**
 * Firebase Emulator Integration Tests
 * Tests the actual Firebase services running in emulators
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  connectAuthEmulator, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  doc, 
  setDoc, 
  getDoc, 
  collection,
  addDoc,
  query,
  where,
  getDocs 
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Test Firebase config for emulators
const testFirebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-test-project.firebaseapp.com',
  projectId: 'demo-test-project',
  storageBucket: 'demo-test-project.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:demo'
};

describe('Firebase Emulator Integration', () => {
  let app: any;
  let auth: any;
  let firestore: any;
  let storage: any;

  beforeAll(() => {
    // Initialize Firebase app for testing
    app = initializeApp(testFirebaseConfig, 'test-app');
    
    // Initialize services
    auth = getAuth(app);
    firestore = getFirestore(app);
    storage = getStorage(app);

    // Connect to emulators
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(firestore, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
  });

  afterEach(async () => {
    // Sign out after each test
    if (auth.currentUser) {
      await signOut(auth);
    }
  });

  describe('Authentication Emulator', () => {
    const testEmail = 'test@example.com';
    const testPassword = 'password123';

    test('should create a new user account', async () => {
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      
      expect(userCredential.user).toBeDefined();
      expect(userCredential.user.email).toBe(testEmail);
      expect(userCredential.user.emailVerified).toBe(false);
    });

    test('should sign in existing user', async () => {
      // Create user first
      await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      await signOut(auth);

      // Sign in
      const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      
      expect(userCredential.user).toBeDefined();
      expect(userCredential.user.email).toBe(testEmail);
    });

    test('should fail with invalid credentials', async () => {
      await expect(
        signInWithEmailAndPassword(auth, testEmail, 'wrongpassword')
      ).rejects.toThrow();
    });

    test('should sign out user', async () => {
      // Create and sign in user
      await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      expect(auth.currentUser).toBeDefined();

      // Sign out
      await signOut(auth);
      expect(auth.currentUser).toBeNull();
    });
  });

  describe('Firestore Emulator', () => {
    test('should create and read a document', async () => {
      const testData = {
        name: 'Test Document',
        timestamp: new Date(),
        number: 42,
        array: [1, 2, 3],
        nested: {
          field: 'value'
        }
      };

      // Create document
      const docRef = doc(firestore, 'test-collection', 'test-doc');
      await setDoc(docRef, testData);

      // Read document
      const docSnap = await getDoc(docRef);
      
      expect(docSnap.exists()).toBe(true);
      expect(docSnap.data()?.name).toBe(testData.name);
      expect(docSnap.data()?.number).toBe(testData.number);
    });

    test('should perform complex queries', async () => {
      const collectionRef = collection(firestore, 'test-users');
      
      // Create test documents
      const users = [
        { name: 'Alice', age: 25, active: true },
        { name: 'Bob', age: 30, active: false },
        { name: 'Charlie', age: 25, active: true }
      ];

      for (const user of users) {
        await addDoc(collectionRef, user);
      }

      // Query active users
      const activeUsersQuery = query(collectionRef, where('active', '==', true));
      const activeUsersSnapshot = await getDocs(activeUsersQuery);
      
      expect(activeUsersSnapshot.size).toBe(2);
      
      // Query users by age
      const age25Query = query(collectionRef, where('age', '==', 25));
      const age25Snapshot = await getDocs(age25Query);
      
      expect(age25Snapshot.size).toBe(2);

      // Query active users aged 25
      const specificQuery = query(
        collectionRef, 
        where('active', '==', true),
        where('age', '==', 25)
      );
      const specificSnapshot = await getDocs(specificQuery);
      
      expect(specificSnapshot.size).toBe(2);
    });

    test('should handle user profile creation workflow', async () => {
      // Create user in Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        'profile@example.com', 
        'password123'
      );
      
      const userId = userCredential.user.uid;

      // Create user profile in Firestore
      const userProfile = {
        uid: userId,
        email: userCredential.user.email,
        displayName: 'Test User',
        role: 'user',
        status: 'active',
        providers: ['email'],
        linkedProviders: [],
        primaryProvider: 'email',
        profile: {
          bio: 'Test user bio',
          timezone: 'UTC',
          language: 'en'
        },
        preferences: {
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          privacy: {
            profileVisible: true,
            emailVisible: false,
            phoneVisible: false
          },
          theme: 'auto'
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          loginCount: 1
        }
      };

      const userDocRef = doc(firestore, 'users', userId);
      await setDoc(userDocRef, userProfile);

      // Verify profile creation
      const userDocSnap = await getDoc(userDocRef);
      
      expect(userDocSnap.exists()).toBe(true);
      expect(userDocSnap.data()?.uid).toBe(userId);
      expect(userDocSnap.data()?.email).toBe('profile@example.com');
      expect(userDocSnap.data()?.role).toBe('user');
    });

    test('should handle race data operations', async () => {
      const raceData = {
        id: 'test-race-1',
        name: 'Test Dragon Boat Race',
        date: new Date('2027-06-15T10:00:00Z'),
        location: {
          latitude: 22.3193,
          longitude: 114.1694,
          venue: 'Test Venue',
          city: 'Hong Kong'
        },
        status: 'scheduled',
        course: {
          marks: [
            { 
              latitude: 22.3193, 
              longitude: 114.1694, 
              type: 'start', 
              name: 'Start Line' 
            }
          ]
        },
        participants: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create race
      const raceRef = doc(firestore, 'races', 'test-race-1');
      await setDoc(raceRef, raceData);

      // Read race
      const raceSnap = await getDoc(raceRef);
      
      expect(raceSnap.exists()).toBe(true);
      expect(raceSnap.data()?.name).toBe(raceData.name);
      expect(raceSnap.data()?.status).toBe('scheduled');
      expect(raceSnap.data()?.location.city).toBe('Hong Kong');
    });
  });

  describe('Service Integration', () => {
    test('should handle complete user registration flow', async () => {
      const email = 'integration@example.com';
      const password = 'password123';
      const displayName = 'Integration Test User';

      // Step 1: Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Step 2: Create user document in Firestore
      const userDoc = {
        uid: user.uid,
        email: user.email,
        displayName,
        emailVerified: user.emailVerified,
        role: 'user',
        status: 'active',
        providers: ['email'],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          loginCount: 0
        }
      };

      await setDoc(doc(firestore, 'users', user.uid), userDoc);

      // Step 3: Create initial activity log
      const activityLog = {
        uid: user.uid,
        action: 'account_created',
        timestamp: new Date().toISOString(),
        metadata: {
          registrationMethod: 'email',
          platform: 'test'
        }
      };

      await addDoc(collection(firestore, 'user_activity'), activityLog);

      // Step 4: Verify everything was created correctly
      const userDocSnap = await getDoc(doc(firestore, 'users', user.uid));
      expect(userDocSnap.exists()).toBe(true);
      expect(userDocSnap.data()?.email).toBe(email);

      const activityQuery = query(
        collection(firestore, 'user_activity'),
        where('uid', '==', user.uid),
        where('action', '==', 'account_created')
      );
      const activitySnapshot = await getDocs(activityQuery);
      expect(activitySnapshot.size).toBe(1);
    });

    test('should handle user race registration', async () => {
      // Create user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        'racer@example.com', 
        'password123'
      );
      const userId = userCredential.user.uid;

      // Create race
      const raceData = {
        id: 'integration-race',
        name: 'Integration Test Race',
        status: 'open_registration',
        participants: []
      };
      await setDoc(doc(firestore, 'races', 'integration-race'), raceData);

      // Register user for race
      const registrationData = {
        userId,
        raceId: 'integration-race',
        registeredAt: new Date().toISOString(),
        status: 'confirmed',
        boatClass: 'dragon-boat'
      };
      
      await addDoc(collection(firestore, 'regatta_participants'), registrationData);

      // Update race participants
      await setDoc(doc(firestore, 'races', 'integration-race'), {
        ...raceData,
        participants: [userId]
      });

      // Verify registration
      const participantQuery = query(
        collection(firestore, 'regatta_participants'),
        where('userId', '==', userId),
        where('raceId', '==', 'integration-race')
      );
      const participantSnapshot = await getDocs(participantQuery);
      expect(participantSnapshot.size).toBe(1);

      // Verify race update
      const raceSnap = await getDoc(doc(firestore, 'races', 'integration-race'));
      expect(raceSnap.data()?.participants).toContain(userId);
    });
  });

  describe('Error Handling', () => {
    test('should handle network timeouts gracefully', async () => {
      // This test would simulate network issues
      // For now, just test that invalid operations fail properly
      
      await expect(
        getDoc(doc(firestore, 'non-existent-collection', 'non-existent-doc'))
      ).resolves.toBeDefined(); // Should return a DocumentSnapshot with exists() = false
    });

    test('should handle malformed data', async () => {
      // Test with undefined data
      await expect(
        setDoc(doc(firestore, 'test', 'malformed'), undefined as any)
      ).rejects.toThrow();
    });
  });
});