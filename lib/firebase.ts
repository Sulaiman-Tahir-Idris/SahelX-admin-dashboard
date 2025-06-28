// app/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAbvJX4T18HBcxr1BpD-WFhYDUyMthaFR0',
  authDomain: 'http://sahelx-backend.firebaseapp.com',
  projectId: 'sahelx-backend',
  storageBucket: 'http://sahelx-backend.firebasestorage.app',
  messagingSenderId: '838199821074',
  appId: '1:838199821074:web:7eb6bcd1b973d616a129cb',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;
