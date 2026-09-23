import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

const DEFAULT_DEPARTMENTS = [
  { name: "Operations", color: "hsl(0 65% 52%)" },
  { name: "Marketing", color: "hsl(38 92% 50%)" },
  { name: "Office", color: "hsl(217 91% 60%)" },
  { name: "Technology", color: "hsl(160 84% 39%)" },
  { name: "Administration", color: "hsl(262 83% 58%)" },
];

async function seed() {
  const coll = db.collection('financeDepartments');
  const existing = await coll.get();
  if (!existing.empty) {
    console.log('Departments already exist, skipping seed.');
    return;
  }

  for (const dept of DEFAULT_DEPARTMENTS) {
    await coll.add({
      name: dept.name,
      color: dept.color,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Added ${dept.name}`);
  }
  console.log('Done.');
}

seed().catch(console.error);
