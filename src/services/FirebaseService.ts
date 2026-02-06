/*
  FirebaseService (optional sync)
  - Uses dynamic modular imports so the Firebase SDK is optional at compile time.
  - You can pass a config into `init` or rely on the test default below (provided by the user).
*/
import { StorageService } from './StorageService';

let _db: any = null;

// Default (user-provided) config for convenience/testing. Replace with env vars in production.
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBjr53CIZN0xnM0FY_S7r_XOvSrOmS3BLI',
  authDomain: 'mindstack-ff8f5.firebaseapp.com',
  projectId: 'mindstack-ff8f5',
  storageBucket: 'mindstack-ff8f5.firebasestorage.app',
  messagingSenderId: '504894275497',
  appId: '1:504894275497:web:5b583bfe6d615e64164eb8',
  measurementId: 'G-T2QS8TQN0B',
};

export const FirebaseService = {
  // Initialize Firebase dynamically using modular API
  init: async (config?: Record<string, string>) => {
    const cfg = config && config.apiKey ? config : DEFAULT_FIREBASE_CONFIG;
    if (!cfg || !cfg.apiKey) return false;
    try {
      // modular imports
      // @ts-ignore
      const { initializeApp } = await import('firebase/app');
      // @ts-ignore
      const { getFirestore } = await import('firebase/firestore');
      const app = initializeApp({
        apiKey: cfg.apiKey,
        authDomain: cfg.authDomain,
        projectId: cfg.projectId,
        storageBucket: cfg.storageBucket,
        messagingSenderId: cfg.messagingSenderId,
        appId: cfg.appId,
      });
      _db = getFirestore(app);
      return true;
    } catch (err) {
      console.error('Firebase init error', err);
      return false;
    }
  },

  // Push local export to Firestore under `users/{uid}/exports/{autoId}`
  pushExport: async (uid: string) => {
    if (!_db) throw new Error('Firebase not initialized');
    try {
      // @ts-ignore
      const { collection, addDoc } = await import('firebase/firestore');
      const data = StorageService.exportData();
      const colRef = collection(_db, 'users', uid, 'exports');
      await addDoc(colRef, { data, created: Date.now() });
      return true;
    } catch (err) {
      console.error('Firebase push error', err);
      throw err;
    }
  },

  // Fetch the latest export entry for a user
  fetchLatestExport: async (uid: string) => {
    if (!_db) throw new Error('Firebase not initialized');
    try {
      // @ts-ignore
      const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore');
      const colRef = collection(_db, 'users', uid, 'exports');
      const q = query(colRef, orderBy('created', 'desc'), limit(1));
      const snaps = await getDocs(q);
      if (snaps.empty) return null;
      const first = snaps.docs[0];
      const d = first.data();
      return d?.data || null;
    } catch (err) {
      console.error('Firebase fetch error', err);
      throw err;
    }
  },
};
