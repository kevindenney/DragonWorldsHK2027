import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  DocumentSnapshot,
  QuerySnapshot,
  DocumentReference,
  CollectionReference,
  QueryConstraint,
  Timestamp,
  onSnapshot,
  Unsubscribe,
  writeBatch,
  runTransaction,
  FirestoreError,
  serverTimestamp,
  FieldValue,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { firestore, isFirestoreReady } from '../../config/firebase';
import {
  CollectionName,
  FirestoreUser,
  UserSession,
  UserActivity,
  UserNotification,
  WeatherPreferences,
  toFirestoreTimestamp,
  fromFirestoreTimestamp,
  validateUser,
  validateUserPreferences,
  validateWeatherPreferences,
} from '../../types/database';
import { User, UserPreferences } from '../../types/auth';

/**
 * Generic Firestore service error handling
 */
export class FirestoreServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalError?: FirestoreError
  ) {
    super(message);
    this.name = 'FirestoreServiceError';
  }
}

/**
 * Query options for paginated results
 */
export interface QueryOptions {
  limit?: number;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  startAfter?: DocumentSnapshot;
  endBefore?: DocumentSnapshot;
  where?: {
    field: string;
    operator: '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains' | 'array-contains-any' | 'in' | 'not-in';
    value: any;
  }[];
}

/**
 * Paginated query result
 */
export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  lastDoc?: DocumentSnapshot;
  firstDoc?: DocumentSnapshot;
  total?: number;
}

/**
 * Generic Firestore CRUD operations service
 */
export class FirestoreService {
  /**
   * Get the Firestore instance, throwing if not available
   */
  private getFirestore() {
    if (!firestore) {
      throw new FirestoreServiceError(
        'service_unavailable',
        'Firestore is not initialized. Please check your Firebase configuration.'
      );
    }
    return firestore;
  }

  /**
   * Get a document by ID
   */
  async getDocument<T>(
    collectionName: string,
    docId: string,
    validator?: (data: unknown) => T
  ): Promise<T | null> {
    try {
      const docRef = doc(this.getFirestore(), collectionName, docId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = { id: docSnap.id, ...docSnap.data() };

      if (validator) {
        try {
          return validator(data);
        } catch (validationError) {
          throw new FirestoreServiceError(
            'validation_error',
            `Document validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`,
          );
        }
      }

      return data as T;
    } catch (error) {
      this.handleError(error, 'Failed to get document');
    }
  }

  /**
   * Get multiple documents with query options
   */
  async getDocuments<T>(
    collectionName: string,
    options?: QueryOptions,
    validator?: (data: unknown) => T
  ): Promise<PaginatedResult<T>> {
    try {
      const collectionRef = collection(this.getFirestore(), collectionName);
      const constraints: QueryConstraint[] = [];

      if (options?.where) {
        options.where.forEach(condition => {
          constraints.push(where(condition.field, condition.operator, condition.value));
        });
      }

      if (options?.orderBy) {
        constraints.push(orderBy(options.orderBy.field, options.orderBy.direction));
      }

      if (options?.startAfter) {
        constraints.push(startAfter(options.startAfter));
      }

      if (options?.endBefore) {
        constraints.push(endBefore(options.endBefore));
      }

      if (options?.limit) {
        constraints.push(limit(options.limit + 1)); // +1 to check if there are more documents
      }

      const q = query(collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);

      const docs = querySnapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        if (validator) {
          try {
            return validator(data);
          } catch (validationError) {
            return null;
          }
        }
        return data as T;
      }).filter((doc): doc is T => doc !== null);

      const hasMore = options?.limit ? docs.length > options.limit : false;
      if (hasMore) docs.pop(); // Remove the extra document

      return {
        data: docs,
        hasMore,
        lastDoc: querySnapshot.docs[Math.min(docs.length - 1, querySnapshot.docs.length - 1)],
        firstDoc: querySnapshot.docs[0],
      };
    } catch (error) {
      this.handleError(error, 'Failed to get documents');
    }
  }

  /**
   * Create a new document
   */
  async createDocument<T>(
    collectionName: string,
    data: Omit<T, 'id'>,
    docId?: string,
    validator?: (data: unknown) => T
  ): Promise<T> {
    try {
      const collectionRef = collection(this.getFirestore(), collectionName);
      
      // Add timestamps
      const documentData = {
        ...data,
        createdAt: toFirestoreTimestamp(),
        updatedAt: toFirestoreTimestamp(),
      };

      if (validator) {
        validator({ id: docId || 'temp', ...documentData });
      }

      let docRef: DocumentReference;
      
      if (docId) {
        docRef = doc(collectionRef, docId);
        await setDoc(docRef, documentData);
      } else {
        docRef = await addDoc(collectionRef, documentData);
      }

      const createdDoc = await getDoc(docRef);
      const result = { id: createdDoc.id, ...createdDoc.data() } as T;

      return result;
    } catch (error) {
      this.handleError(error, 'Failed to create document');
    }
  }

  /**
   * Update a document
   */
  async updateDocument<T>(
    collectionName: string,
    docId: string,
    updates: Partial<Omit<T, 'id' | 'createdAt'>>,
    validator?: (data: unknown) => T
  ): Promise<T> {
    try {
      const docRef = doc(this.getFirestore(), collectionName, docId);

      // Add update timestamp
      const updateData = {
        ...updates,
        updatedAt: toFirestoreTimestamp(),
      };

      if (validator) {
        // Get current document to validate the merged result
        const currentDoc = await getDoc(docRef);
        if (currentDoc.exists()) {
          const mergedData = { 
            id: docId, 
            ...currentDoc.data(), 
            ...updateData 
          };
          validator(mergedData);
        }
      }

      await updateDoc(docRef, updateData);

      // Return updated document
      const updatedDoc = await getDoc(docRef);
      return { id: updatedDoc.id, ...updatedDoc.data() } as T;
    } catch (error) {
      this.handleError(error, 'Failed to update document');
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(collectionName: string, docId: string): Promise<void> {
    try {
      const docRef = doc(this.getFirestore(), collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      this.handleError(error, 'Failed to delete document');
    }
  }

  /**
   * Listen to document changes
   */
  subscribeToDocument<T>(
    collectionName: string,
    docId: string,
    callback: (data: T | null) => void,
    validator?: (data: unknown) => T
  ): Unsubscribe {
    const docRef = doc(this.getFirestore(), collectionName, docId);
    
    return onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) {
        callback(null);
        return;
      }

      const data = { id: docSnap.id, ...docSnap.data() };
      
      if (validator) {
        try {
          callback(validator(data));
        } catch (validationError) {
          callback(null);
        }
      } else {
        callback(data as T);
      }
    }, (error) => {
      callback(null);
    });
  }

  /**
   * Listen to collection changes
   */
  subscribeToCollection<T>(
    collectionName: string,
    options: QueryOptions | undefined,
    callback: (data: T[]) => void,
    validator?: (data: unknown) => T
  ): Unsubscribe {
    const collectionRef = collection(this.getFirestore(), collectionName);
    const constraints: QueryConstraint[] = [];

    if (options?.where) {
      options.where.forEach(condition => {
        constraints.push(where(condition.field, condition.operator, condition.value));
      });
    }

    if (options?.orderBy) {
      constraints.push(orderBy(options.orderBy.field, options.orderBy.direction));
    }

    if (options?.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(collectionRef, ...constraints);

    return onSnapshot(q, (querySnapshot) => {
      const docs = querySnapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        if (validator) {
          try {
            return validator(data);
          } catch (validationError) {
            return null;
          }
        }
        return data as T;
      }).filter((doc): doc is T => doc !== null);

      callback(docs);
    }, (error) => {
      callback([]);
    });
  }

  /**
   * Batch write operations
   */
  async batchWrite(operations: Array<{
    type: 'create' | 'update' | 'delete';
    collectionName: string;
    docId?: string;
    data?: any;
  }>): Promise<void> {
    try {
      const batch = writeBatch(this.getFirestore());

      const db = this.getFirestore();
      operations.forEach(operation => {
        if (operation.type === 'create') {
          const docRef = operation.docId
            ? doc(db, operation.collectionName, operation.docId)
            : doc(collection(db, operation.collectionName));
          
          batch.set(docRef, {
            ...operation.data,
            createdAt: toFirestoreTimestamp(),
            updatedAt: toFirestoreTimestamp(),
          });
        } else if (operation.type === 'update' && operation.docId) {
          const docRef = doc(db, operation.collectionName, operation.docId);
          batch.update(docRef, {
            ...operation.data,
            updatedAt: toFirestoreTimestamp(),
          });
        } else if (operation.type === 'delete' && operation.docId) {
          const docRef = doc(db, operation.collectionName, operation.docId);
          batch.delete(docRef);
        }
      });

      await batch.commit();
    } catch (error) {
      this.handleError(error, 'Failed to execute batch operation');
    }
  }

  /**
   * Execute a transaction
   */
  async runTransaction<T>(
    updateFunction: (transaction: any) => Promise<T>
  ): Promise<T> {
    try {
      return await runTransaction(this.getFirestore(), updateFunction);
    } catch (error) {
      this.handleError(error, 'Transaction failed');
    }
  }

  /**
   * Get document count for a collection (approximation)
   */
  async getCollectionSize(
    collectionName: string,
    whereConditions?: QueryOptions['where']
  ): Promise<number> {
    try {
      const collectionRef = collection(this.getFirestore(), collectionName);
      const constraints: QueryConstraint[] = [];

      if (whereConditions) {
        whereConditions.forEach(condition => {
          constraints.push(where(condition.field, condition.operator, condition.value));
        });
      }

      const q = query(collectionRef, ...constraints);
      const snapshot = await getDocs(q);
      
      return snapshot.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check if document exists
   */
  async documentExists(collectionName: string, docId: string): Promise<boolean> {
    try {
      const docRef = doc(this.getFirestore(), collectionName, docId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      return false;
    }
  }

  /**
   * Generic error handler
   */
  private handleError(error: unknown, defaultMessage: string): never {
    if (error instanceof FirestoreServiceError) {
      throw error;
    }

    const firestoreError = error as FirestoreError;
    
    if (firestoreError?.code) {
      switch (firestoreError.code) {
        case 'permission-denied':
          throw new FirestoreServiceError(
            'permission_denied',
            'You do not have permission to perform this operation',
            firestoreError
          );
        case 'not-found':
          throw new FirestoreServiceError(
            'not_found',
            'The requested document was not found',
            firestoreError
          );
        case 'unavailable':
          throw new FirestoreServiceError(
            'service_unavailable',
            'The service is temporarily unavailable. Please try again later',
            firestoreError
          );
        case 'deadline-exceeded':
          throw new FirestoreServiceError(
            'timeout',
            'The operation timed out. Please try again',
            firestoreError
          );
        default:
          throw new FirestoreServiceError(
            firestoreError.code,
            firestoreError.message || defaultMessage,
            firestoreError
          );
      }
    }

    // Generic error handling
    const message = error instanceof Error ? error.message : defaultMessage;
    throw new FirestoreServiceError('unknown_error', message);
  }
}

// Export singleton instance
export const firestoreService = new FirestoreService();
export default firestoreService;