import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const defaultProjectId = process.env.FIREBASE_PROJECT_ID || "project-647428543613";

const formatPrivateKey = (value) =>
  value
    ?.replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n")
    .trim();

const parseServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    if (parsed.private_key) {
      parsed.private_key = formatPrivateKey(parsed.private_key);
    }
    return parsed;
  }

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    };
  }

  return null;
};

const getFirebaseApp = () => {
  if (getApps().length) {
    return getApps()[0];
  }

  const serviceAccount = parseServiceAccount();
  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId || defaultProjectId,
    });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({ projectId: defaultProjectId });
  }

  throw new Error(
    "Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
  );
};

export const verifyFirebaseIdToken = async (idToken) => {
  const app = getFirebaseApp();
  return getAuth(app).verifyIdToken(idToken);
};
