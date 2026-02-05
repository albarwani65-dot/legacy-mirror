import "server-only";
import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// You should populate these environment variables in your .env.local file
// or use the standard GOOGLE_APPLICATION_CREDENTIALS method.
// For this scaffolding, we'll try to use the default credential or mock if not present to avoid build crashes,
// but in production/dev execution, valid credentials are required.

const firebaseAdminConfig = {
    credential: process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
        : undefined, // undefined will attempt to use Google Application Default Credentials
};

// Singleton pattern to prevent "Firebase App already exists" error on hot-reload
export const adminApp =
    getApps().length > 0 ? getApp() : initializeApp(firebaseAdminConfig);

export const db = getFirestore(adminApp);
