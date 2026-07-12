/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, collection, addDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { VisitorMessage } from './types';

// Safe check for the Firebase config file
let firebaseAppConfig: any = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export function initializeFirebase(customConfig?: any) {
  const config = customConfig || firebaseAppConfig;
  if (!config || !config.apiKey) {
    return null;
  }
  
  try {
    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    dbInstance = getFirestore(app);
    authInstance = getAuth(app);
    return { db: dbInstance, auth: authInstance };
  } catch (error) {
    console.error('Failed to initialize Firebase SDK:', error);
    return null;
  }
}

export function getDb(): Firestore | null {
  return dbInstance;
}

export function getAuthService(): Auth | null {
  return authInstance;
}

// Operational enumeration
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Error Interface required by guidelines
export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const auth = getAuthService();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Real-time listener for messages
export function subscribeToMessages(onUpdate: (messages: VisitorMessage[]) => void): () => void {
  const db = getDb();
  if (!db) {
    // Offline simulated stream fallback
    return () => {};
  }

  const q = query(
    collection(db, 'visitor_messages'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: VisitorMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          name: data.name || 'Anonymous',
          message: data.message || '',
          createdAt: data.createdAt || Date.now(),
        });
      });
      onUpdate(messages);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'visitor_messages');
    }
  );
}

// Write a message
export async function submitVisitorMessage(name: string, message: string): Promise<void> {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase database not configured.');
  }

  try {
    await addDoc(collection(db, 'visitor_messages'), {
      name: name.trim().slice(0, 50),
      message: message.trim().slice(0, 1000),
      createdAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'visitor_messages');
  }
}
