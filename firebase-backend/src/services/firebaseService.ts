import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  addDoc,
  DocumentReference,
  QuerySnapshot,
  DocumentSnapshot,
  CollectionReference
} from 'firebase/firestore';
import { db } from '../firebase';

export class FirestoreService {
  static async create<T>(collectionName: string, data: T, docId?: string): Promise<DocumentReference> {
    const colRef = collection(db, collectionName);
    
    if (docId) {
      const docRef = doc(colRef, docId);
      await setDoc(docRef, data);
      return docRef;
    } else {
      return await addDoc(colRef, data);
    }
  }

  static async read<T>(collectionName: string, docId: string): Promise<T | null> {
    const docRef = doc(db, collectionName, docId);
    const docSnap: DocumentSnapshot = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  }

  static async update<T>(collectionName: string, docId: string, data: Partial<T>): Promise<void> {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, data);
  }

  static async delete(collectionName: string, docId: string): Promise<void> {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  }

  static async query<T>(
    collectionName: string,
    conditions: { field: string; operator: any; value: any }[] = [],
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'asc',
    limitCount?: number
  ): Promise<T[]> {
    const colRef: CollectionReference = collection(db, collectionName);
    let q = query(colRef);

    conditions.forEach(condition => {
      q = query(q, where(condition.field, condition.operator, condition.value));
    });

    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }

    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const querySnapshot: QuerySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }

  static async getCollection<T>(collectionName: string): Promise<T[]> {
    const colRef = collection(db, collectionName);
    const querySnapshot = await getDocs(colRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }
}