// Firebase configuration for iris-dashboard
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyD9rtbopk1Aed5VVuqIwrYLHBCQKEcuKAc",
  authDomain: "iris-dashboard-c7ddd.firebaseapp.com",
  projectId: "iris-dashboard-c7ddd",
  storageBucket: "iris-dashboard-c7ddd.firebasestorage.app",
  messagingSenderId: "506516015432",
  appId: "1:506516015432:web:9b6ae0daf5c58f40294b7d",
  measurementId: "G-FH4Q68CVXR"
};

// Initialize Firebase (prevent re-initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics (only in browser)
export const initAnalytics = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

export default app;
