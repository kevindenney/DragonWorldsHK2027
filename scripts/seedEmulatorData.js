#!/usr/bin/env node

/**
 * Seed script for Firebase emulators
 * Run with: node scripts/seedEmulatorData.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with emulator settings
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';

// Initialize app
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'demo-dragonworldshk2027', // Use demo project for emulator
    storageBucket: 'demo-dragonworldshk2027.appspot.com'
  });
}

const auth = admin.auth();
const firestore = admin.firestore();

// Sample data
const sampleUsers = [
  {
    uid: 'test-user-1',
    email: 'sailor1@example.com',
    displayName: 'John Sailor',
    emailVerified: true,
    password: 'password123',
    customClaims: { role: 'user' }
  },
  {
    uid: 'test-user-2',
    email: 'sailor2@example.com',
    displayName: 'Jane Navigator',
    emailVerified: true,
    password: 'password123',
    customClaims: { role: 'user' }
  },
  {
    uid: 'test-admin',
    email: 'admin@dragonworldshk.com',
    displayName: 'Race Admin',
    emailVerified: true,
    password: 'admin123',
    customClaims: { role: 'admin' }
  }
];

const sampleRaces = [
  {
    id: 'race-1',
    name: 'Hong Kong to Macau Race 2027',
    date: admin.firestore.Timestamp.fromDate(new Date('2027-06-15T10:00:00Z')),
    location: {
      latitude: 22.2783,
      longitude: 114.1747,
      venue: 'Royal Hong Kong Yacht Club',
      city: 'Hong Kong'
    },
    status: 'scheduled',
    course: {
      marks: [
        { latitude: 22.2783, longitude: 114.1747, type: 'start', name: 'Start Line' },
        { latitude: 22.1500, longitude: 113.5500, type: 'mark', name: 'Mark 1' },
        { latitude: 22.1896, longitude: 113.5439, type: 'finish', name: 'Finish Line' }
      ],
      windDirection: 120,
      windSpeed: 15
    },
    participants: ['test-user-1', 'test-user-2'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'race-2',
    name: 'Dragon Boat Training Session',
    date: admin.firestore.Timestamp.fromDate(new Date('2027-07-01T09:00:00Z')),
    location: {
      latitude: 22.3193,
      longitude: 114.1694,
      venue: 'Causeway Bay Typhoon Shelter',
      city: 'Hong Kong'
    },
    status: 'scheduled',
    course: {
      marks: [
        { latitude: 22.3193, longitude: 114.1694, type: 'start', name: 'Training Start' },
        { latitude: 22.3150, longitude: 114.1650, type: 'finish', name: 'Training End' }
      ]
    },
    participants: ['test-user-1'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }
];

const sampleUserProfiles = [
  {
    uid: 'test-user-1',
    email: 'sailor1@example.com',
    displayName: 'John Sailor',
    photoURL: null,
    phoneNumber: null,
    emailVerified: true,
    role: 'user',
    status: 'active',
    providers: ['email'],
    linkedProviders: [],
    primaryProvider: 'email',
    profile: {
      bio: 'Experienced sailor with 10+ years of racing experience',
      location: 'Hong Kong',
      timezone: 'Asia/Hong_Kong',
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
        phoneVisible: false,
        allowProviderLinking: true,
        allowDataSync: true
      },
      theme: 'auto',
      oauth: {
        autoSyncProfile: true,
        allowMultipleAccounts: false
      }
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      loginCount: 5
    }
  },
  {
    uid: 'test-user-2',
    email: 'sailor2@example.com',
    displayName: 'Jane Navigator',
    photoURL: null,
    phoneNumber: null,
    emailVerified: true,
    role: 'user',
    status: 'active',
    providers: ['email'],
    linkedProviders: [],
    primaryProvider: 'email',
    profile: {
      bio: 'Navigation specialist and weather routing expert',
      location: 'Hong Kong',
      timezone: 'Asia/Hong_Kong',
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
        phoneVisible: false,
        allowProviderLinking: true,
        allowDataSync: true
      },
      theme: 'light',
      oauth: {
        autoSyncProfile: true,
        allowMultipleAccounts: false
      }
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      loginCount: 12
    }
  },
  {
    uid: 'test-admin',
    email: 'admin@dragonworldshk.com',
    displayName: 'Race Admin',
    photoURL: null,
    phoneNumber: null,
    emailVerified: true,
    role: 'admin',
    status: 'active',
    providers: ['email'],
    linkedProviders: [],
    primaryProvider: 'email',
    profile: {
      bio: 'Race administrator and event coordinator',
      location: 'Hong Kong',
      timezone: 'Asia/Hong_Kong',
      language: 'en'
    },
    preferences: {
      notifications: {
        email: true,
        push: true,
        sms: true
      },
      privacy: {
        profileVisible: true,
        emailVisible: true,
        phoneVisible: false,
        allowProviderLinking: true,
        allowDataSync: true
      },
      theme: 'dark',
      oauth: {
        autoSyncProfile: true,
        allowMultipleAccounts: false
      }
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      loginCount: 25
    }
  }
];

async function seedData() {
  console.log('🌱 Starting emulator data seeding...');
  
  try {
    // Create test users in Auth
    console.log('📝 Creating test users...');
    for (const userData of sampleUsers) {
      try {
        await auth.createUser({
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          emailVerified: userData.emailVerified,
          password: userData.password
        });
        
        // Set custom claims
        await auth.setCustomUserClaims(userData.uid, userData.customClaims);
        console.log(`✅ Created user: ${userData.email}`);
      } catch (error) {
        if (error.code === 'auth/uid-already-exists') {
          console.log(`⚠️  User already exists: ${userData.email}`);
        } else {
          console.error(`❌ Error creating user ${userData.email}:`, error.message);
        }
      }
    }

    // Create user profiles in Firestore
    console.log('👤 Creating user profiles...');
    for (const profile of sampleUserProfiles) {
      try {
        await firestore.collection('users').doc(profile.uid).set(profile);
        console.log(`✅ Created profile for: ${profile.email}`);
      } catch (error) {
        console.error(`❌ Error creating profile for ${profile.email}:`, error.message);
      }
    }

    // Create races
    console.log('🏁 Creating race data...');
    for (const race of sampleRaces) {
      try {
        await firestore.collection('races').doc(race.id).set(race);
        console.log(`✅ Created race: ${race.name}`);
      } catch (error) {
        console.error(`❌ Error creating race ${race.name}:`, error.message);
      }
    }

    // Create some sample activities
    console.log('📊 Creating activity data...');
    const activities = [
      {
        userId: 'test-user-1',
        action: 'login',
        description: 'User logged in',
        metadata: { device: 'mobile', platform: 'ios' },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        userId: 'test-user-2',
        action: 'race_registered',
        description: 'Registered for Hong Kong to Macau Race',
        metadata: { raceId: 'race-1' },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    for (const activity of activities) {
      try {
        await firestore.collection('activities').add(activity);
        console.log(`✅ Created activity: ${activity.action}`);
      } catch (error) {
        console.error(`❌ Error creating activity:`, error.message);
      }
    }

    console.log('🎉 Emulator data seeding completed successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('   User 1: sailor1@example.com / password123');
    console.log('   User 2: sailor2@example.com / password123');
    console.log('   Admin:  admin@dragonworldshk.com / admin123');
    console.log('\n🌐 Emulator UI: http://localhost:4000');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { seedData };