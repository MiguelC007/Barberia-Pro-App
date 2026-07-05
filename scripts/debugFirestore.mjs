import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

async function readServiceAccount() {
  const raw = await readFile(serviceAccountPath, "utf8");
  return JSON.parse(raw);
}

async function main() {
  const serviceAccount = await readServiceAccount();

  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id
      });

  const db = getFirestore(app, "default");
  console.log("Firestore databaseId: default");
  const ref = db.collection("_seed_test").doc("ping");

  console.log("project_id:", serviceAccount.project_id);
  console.log("client_email:", serviceAccount.client_email);
  console.log("probando lectura _seed_test/ping ...");

  try {
    const snap = await ref.get();
    console.log("lectura OK");
    console.log("doc existe:", snap.exists);
    console.log("data:", snap.exists ? snap.data() : null);
  } catch (error) {
    console.error("lectura FALLÓ");
    console.error("code:", error?.code);
    console.error("message:", error?.message);
    console.error("details:", error?.details);
    console.error("stack:", error?.stack);
  }

  console.log("probando escritura _seed_test/ping ...");

  try {
    await ref.set(
      {
        ok: true,
        projectId: serviceAccount.project_id,
        createdAt: Date.now()
      },
      { merge: true }
    );
    console.log("escritura OK");
  } catch (error) {
    console.error("escritura FALLÓ");
    console.error("code:", error?.code);
    console.error("message:", error?.message);
    console.error("details:", error?.details);
    console.error("stack:", error?.stack);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("debugFirestore terminó con error fatal");
  console.error(error);
  process.exit(1);
});
