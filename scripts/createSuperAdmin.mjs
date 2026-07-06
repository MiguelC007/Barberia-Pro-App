import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
const seedConfigPath = path.join(__dirname, "seed.local.json");

async function readJson(filePath, label) {
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (label === "seed.local.json") {
      throw new Error("Falta scripts/seed.local.json. Copia scripts/seed.local.example.json y completa superAdmin con tus datos reales.");
    }

    if (label === "serviceAccountKey.json") {
      throw new Error("Falta scripts/serviceAccountKey.json. Descargalo desde Firebase Console > Configuracion del proyecto > Cuentas de servicio.");
    }

    throw new Error(`No se pudo leer ${label}: ${error.message}`);
  }
}

function assertSuperAdminConfig(seed) {
  const user = seed?.superAdmin;

  if (!user || typeof user !== "object") {
    throw new Error("Falta la seccion superAdmin en scripts/seed.local.json.");
  }

  if (!user.email || typeof user.email !== "string") {
    throw new Error("Falta superAdmin.email en scripts/seed.local.json.");
  }

  if (!user.password || typeof user.password !== "string" || user.password.length < 6) {
    throw new Error("Falta superAdmin.password o tiene menos de 6 caracteres.");
  }

  if (!user.name || typeof user.name !== "string") {
    throw new Error("Falta superAdmin.name en scripts/seed.local.json.");
  }
}

async function getOrCreateSuperAdmin(auth, userConfig) {
  const email = userConfig.email.trim().toLowerCase();

  try {
    const existingUser = await auth.getUserByEmail(email);
    const updatedUser = await auth.updateUser(existingUser.uid, {
      email,
      password: userConfig.password,
      displayName: userConfig.name.trim(),
      disabled: false
    });

    return { user: updatedUser, reused: true };
  } catch (error) {
    if (error.code !== "auth/user-not-found") {
      throw error;
    }
  }

  const createdUser = await auth.createUser({
    email,
    password: userConfig.password,
    displayName: userConfig.name.trim(),
    disabled: false
  });

  return { user: createdUser, reused: false };
}

async function main() {
  const serviceAccount = await readJson(serviceAccountPath, "serviceAccountKey.json");
  const seed = await readJson(seedConfigPath, "seed.local.json");

  assertSuperAdminConfig(seed);

  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id
      });

  const auth = getAuth(app);
  const db = getFirestore(app, "default");
  const superAdmin = seed.superAdmin;
  const result = await getOrCreateSuperAdmin(auth, superAdmin);
  const uid = result.user.uid;
  const email = superAdmin.email.trim().toLowerCase();
  const createdAt = Date.now();

  const profile = {
    id: uid,
    name: superAdmin.name.trim(),
    email,
    phone: superAdmin.phone || "50400000000",
    role: "super_admin",
    barberId: null,
    createdAt,
    active: true
  };

  await db.collection("users").doc(uid).set(profile, { merge: true });

  console.log("Superadmin listo.");
  console.log(`Auth: ${result.reused ? "actualizado" : "creado"}`);
  console.log(`Email: ${email}`);
  console.log(`UID: ${uid}`);
  console.log(`Firestore: users/${uid}`);
  console.log("Ya puedes iniciar sesion en /login con ese correo y password.");
}

main().catch((error) => {
  console.error("No se pudo crear/actualizar el superadmin.");
  console.error("code:", error?.code);
  console.error("message:", error?.message);
  console.error(error);
  process.exit(1);
});
