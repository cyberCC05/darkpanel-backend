// ESM, Node 22
import admin from 'firebase-admin';

let app;
if (!global.__FIREBASE_APP__) {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(
    /\\n/g,
    '\n',
  );
  app = admin.initializeApp({
    credential: admin.credential.cert({
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: process.env.FIREBASE_DB_URL,
  });
  global.__FIREBASE_APP__ = app;
} else {
  app = global.__FIREBASE_APP__;
}

export const db = admin.database();
export default app;
