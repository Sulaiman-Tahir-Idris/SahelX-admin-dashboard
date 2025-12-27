/**
 * One-off script to backfill `totalOrders`, `lastOrder`, `isActive`, and missing `createdAt`
 * for users based on existing `deliveries` documents.
 *
 * Usage:
 * 1. Install dependencies: `npm install firebase-admin`
 * 2. Set `GOOGLE_APPLICATION_CREDENTIALS` env var to a service account JSON path
 * 3. Run: `node scripts/backfill_user_stats.js`
 *
 * Note: This script writes to your production Firestore if pointed there. Use with caution.
 */

const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function main() {
  console.log("Starting backfill: reading deliveries...");

  const deliveriesSnap = await db.collection("deliveries").get();
  const stats = new Map();

  deliveriesSnap.forEach((doc) => {
    const data = doc.data();
    const cid = data.customerId;
    if (!cid) return;

    const ts = data.createdAt;
    let ms;
    if (ts && typeof ts.toDate === "function") {
      ms = ts.toDate().getTime();
    } else if (ts && ts.seconds) {
      ms = ts.seconds * 1000;
    } else if (ts) {
      ms = new Date(ts).getTime();
    }

    const prev = stats.get(cid) || { count: 0 };
    prev.count = (prev.count || 0) + 1;
    if (ms) {
      if (!prev.earliestMs || ms < prev.earliestMs) prev.earliestMs = ms;
      if (!prev.latestMs || ms > prev.latestMs) prev.latestMs = ms;
    }
    stats.set(cid, prev);
  });

  console.log(`Found stats for ${stats.size} customers. Updating User docs...`);

  let processed = 0;
  for (const [customerId, entry] of stats) {
    const userRef = db.collection("User").doc(customerId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      console.warn(`User doc not found for customerId=${customerId}, skipping`);
      continue;
    }

    const updates = {
      totalOrders: entry.count,
      lastOrder: entry.latestMs
        ? admin.firestore.Timestamp.fromMillis(entry.latestMs)
        : null,
      isActive: (entry.count || 0) >= 2,
    };

    const userData = userSnap.data();
    if (!userData || !userData.createdAt) {
      if (entry.earliestMs)
        updates.createdAt = admin.firestore.Timestamp.fromMillis(
          entry.earliestMs
        );
    }

    await userRef.set(updates, { merge: true });
    processed++;
    if (processed % 50 === 0) console.log(`Updated ${processed} users...`);
  }

  console.log(`Backfill complete. Updated ${processed} users.`);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
