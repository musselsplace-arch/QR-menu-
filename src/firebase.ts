import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc as fSetDoc, 
  getDocs, 
  onSnapshot, 
  updateDoc as fUpdateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  writeBatch as fWriteBatch,
  addDoc as fAddDoc
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// CRITICAL: Must use firestoreDatabaseId to connect to the correct database instance
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to recursively remove undefined fields
export function removeUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item)) as any;
  }
  if (typeof obj === 'object') {
    const cleanObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          cleanObj[key] = removeUndefined(val);
        }
      }
    }
    return cleanObj;
  }
  return obj;
}

// Wrap setDoc to strip undefined properties
export function setDoc(reference: any, data: any, options?: any) {
  const cleanData = removeUndefined(data);
  return options ? fSetDoc(reference, cleanData, options) : fSetDoc(reference, cleanData);
}

// Wrap updateDoc to strip undefined properties
export function updateDoc(reference: any, data: any, ...moreArgs: any[]) {
  const cleanData = removeUndefined(data);
  return (fUpdateDoc as any)(reference, cleanData, ...moreArgs);
}

// Wrap addDoc to strip undefined properties
export function addDoc(reference: any, data: any) {
  const cleanData = removeUndefined(data);
  return fAddDoc(reference, cleanData);
}

// Wrap writeBatch to strip undefined properties
export function writeBatch(firestore: any) {
  const batch = fWriteBatch(firestore);
  return {
    set(documentRef: any, data: any, options?: any) {
      const cleanData = removeUndefined(data);
      if (options) {
        batch.set(documentRef, cleanData, options);
      } else {
        batch.set(documentRef, cleanData);
      }
      return this;
    },
    update(documentRef: any, data: any) {
      const cleanData = removeUndefined(data);
      batch.update(documentRef, cleanData);
      return this;
    },
    delete(documentRef: any) {
      batch.delete(documentRef);
      return this;
    },
    commit() {
      return batch.commit();
    }
  };
}

// Export other firestore utilities for direct clean access
export {
  collection,
  doc,
  getDocs,
  onSnapshot,
  deleteDoc,
  query,
  orderBy
};
