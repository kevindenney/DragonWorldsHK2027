import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Import the main app
import app from '../../src/app';

// Initialize Firebase Admin (if not already initialized)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Create Express app for Cloud Functions
const functionsApp = express();

// Basic middleware for functions
functionsApp.use(helmet());
functionsApp.use(cors({ origin: true }));
functionsApp.use(express.json({ limit: '10mb' }));

// Use the main app as middleware
functionsApp.use('/api', app);

// Health check for functions
functionsApp.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'firebase-functions',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Export the Express app as a Firebase Cloud Function
export const api = functions.https.onRequest(functionsApp);

// Authentication triggers
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL, phoneNumber, emailVerified } = user;
  
  try {
    // Create user document in Firestore
    await admin.firestore().collection('users').doc(uid).set({
      uid,
      email: email || '',
      displayName: displayName || email?.split('@')[0] || 'User',
      photoURL: photoURL || null,
      phoneNumber: phoneNumber || null,
      emailVerified: emailVerified || false,
      role: 'user',
      status: 'active',
      providers: ['email'],
      profile: {
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
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        loginCount: 0
      },
      customClaims: {
        role: 'user',
        permissions: ['user:read:own', 'user:update:own']
      },
      isDeleted: false
    });

    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, {
      role: 'user',
      permissions: ['user:read:own', 'user:update:own']
    });

    console.log(`User document created for ${uid}`);
  } catch (error) {
    console.error('Error creating user document:', error);
  }
});

export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  const { uid } = user;
  
  try {
    // Mark user as deleted in Firestore (soft delete)
    await admin.firestore().collection('users').doc(uid).update({
      isDeleted: true,
      status: 'inactive',
      metadata: {
        ...admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    });

    // Clean up user sessions
    const sessionsQuery = admin.firestore()
      .collection('sessions')
      .where('userId', '==', uid);
    
    const sessionsSnapshot = await sessionsQuery.get();
    const batch = admin.firestore().batch();
    
    sessionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();

    console.log(`User cleanup completed for ${uid}`);
  } catch (error) {
    console.error('Error cleaning up user data:', error);
  }
});

// Firestore triggers
export const onUserProfileUpdate = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const { userId } = context.params;
    const before = change.before.data();
    const after = change.after.data();

    try {
      // Log profile update activity
      await admin.firestore().collection('activities').add({
        userId,
        action: 'profile_updated',
        description: 'User profile was updated',
        metadata: {
          changes: getChangedFields(before, after),
          updatedBy: after.metadata?.updatedBy || userId
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // If role changed, update custom claims
      if (before.role !== after.role) {
        const permissions = getRolePermissions(after.role);
        await admin.auth().setCustomUserClaims(userId, {
          role: after.role,
          permissions
        });

        console.log(`Updated custom claims for user ${userId}, new role: ${after.role}`);
      }

    } catch (error) {
      console.error('Error handling profile update:', error);
    }
  });

// Scheduled functions
export const cleanupExpiredSessions = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    try {
      const now = admin.firestore.Timestamp.now();
      const expiredSessionsQuery = admin.firestore()
        .collection('sessions')
        .where('expiresAt', '<', now);

      const snapshot = await expiredSessionsQuery.get();
      
      if (snapshot.empty) {
        console.log('No expired sessions to clean up');
        return;
      }

      const batch = admin.firestore().batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Cleaned up ${snapshot.size} expired sessions`);

    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  });

export const updateUserLastActive = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    try {
      // This would typically be triggered by client activity
      // For now, it's just a placeholder for the scheduled function structure
      console.log('User activity update job executed');
    } catch (error) {
      console.error('Error updating user activity:', error);
    }
  });

// Helper functions
function getChangedFields(before: any, after: any): string[] {
  const changes: string[] = [];
  const beforeKeys = Object.keys(before);
  const afterKeys = Object.keys(after);
  
  // Check for modified and added fields
  afterKeys.forEach(key => {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changes.push(key);
    }
  });
  
  // Check for removed fields
  beforeKeys.forEach(key => {
    if (!(key in after)) {
      changes.push(key);
    }
  });
  
  return changes;
}

function getRolePermissions(role: string): string[] {
  const permissions: { [key: string]: string[] } = {
    user: ['user:read:own', 'user:update:own'],
    admin: ['user:read:own', 'user:update:own', 'user:read:any', 'user:update:any', 'admin:read'],
    superadmin: ['*']
  };

  return permissions[role] || permissions.user;
}

// HTTP callable functions
export const assignUserRole = functions.https.onCall(async (data, context) => {
  // Verify that the user is authenticated and is an admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const callerRole = context.auth.token.role || 'user';
  if (!['admin', 'superadmin'].includes(callerRole)) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }

  const { userId, role } = data;

  if (!userId || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'userId and role are required');
  }

  // Only superadmin can assign admin roles
  if (['admin', 'superadmin'].includes(role) && callerRole !== 'superadmin') {
    throw new functions.https.HttpsError('permission-denied', 'Only superadmin can assign admin roles');
  }

  try {
    // Update user document
    await admin.firestore().collection('users').doc(userId).update({
      role,
      'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp()
    });

    // Update custom claims
    const permissions = getRolePermissions(role);
    await admin.auth().setCustomUserClaims(userId, {
      role,
      permissions
    });

    // Log the role assignment
    await admin.firestore().collection('activities').add({
      userId,
      action: 'role_assigned',
      description: `User role changed to ${role}`,
      metadata: {
        assignedBy: context.auth.uid,
        newRole: role
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: 'Role assigned successfully' };

  } catch (error) {
    console.error('Error assigning user role:', error);
    throw new functions.https.HttpsError('internal', 'Failed to assign role');
  }
});

export const sendWelcomeEmail = functions.https.onCall(async (data, context) => {
  // This is a placeholder for email sending functionality
  // In a real implementation, you would integrate with an email service
  
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, email, displayName } = data;

  try {
    // Log the welcome email request
    await admin.firestore().collection('activities').add({
      userId: userId || context.auth.uid,
      action: 'welcome_email_sent',
      description: 'Welcome email sent to user',
      metadata: {
        email,
        displayName,
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Welcome email queued for ${email}`);
    return { success: true, message: 'Welcome email sent' };

  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send welcome email');
  }
});

// Export all functions
export default {
  api,
  onUserCreate,
  onUserDelete,
  onUserProfileUpdate,
  cleanupExpiredSessions,
  updateUserLastActive,
  assignUserRole,
  sendWelcomeEmail
};