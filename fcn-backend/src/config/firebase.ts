import admin from "firebase-admin";
import { env } from "./env";
import { logger } from "../utils/logger";

const hasFirebaseConfig = env.FIREBASE_PROJECT_ID && env.FIREBASE_PRIVATE_KEY && env.FIREBASE_CLIENT_EMAIL;

export const firebaseAdmin = (() => {
  if (!hasFirebaseConfig) {
    logger.warn("Firebase Admin SDK not initialized because credentials are incomplete");
    return null;
  }

  if (admin.apps.length > 0) {
    return admin;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      clientEmail: env.FIREBASE_CLIENT_EMAIL
    })
  });

  logger.info("Firebase Admin SDK initialized");
  return admin;
})();
