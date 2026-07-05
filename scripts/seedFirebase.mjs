import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

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
      throw new Error("Falta scripts/seed.local.json. Copia scripts/seed.local.example.json y completa las credenciales privadas.");
    }
    if (label === "serviceAccountKey.json") {
      throw new Error("Falta scripts/serviceAccountKey.json. Descargalo desde Firebase Console > Project Settings > Service Accounts.");
    }
    throw new Error(`No se pudo leer ${label} en ${filePath}. ${error.message}`);
  }
}

function assertSeedRoot(seed) {
  if (!seed || typeof seed !== "object") {
    throw new Error("El archivo scripts/seed.local.json no tiene un objeto JSON valido.");
  }
  if (!seed.superAdmin || typeof seed.superAdmin !== "object") {
    throw new Error("Falta la seccion superAdmin en scripts/seed.local.json.");
  }
  if (!seed.owner || typeof seed.owner !== "object") {
    throw new Error("Falta la seccion owner en scripts/seed.local.json.");
  }
}

function assertUserConfig(user, label) {
  if (!user || typeof user !== "object") {
    throw new Error(`Falta la seccion ${label} en scripts/seed.local.json.`);
  }
  if (!user.email || typeof user.email !== "string") {
    throw new Error(`Falta ${label}.email en scripts/seed.local.json.`);
  }
  if (!user.password || typeof user.password !== "string") {
    throw new Error(`Falta ${label}.password en scripts/seed.local.json.`);
  }
  if (!user.name || typeof user.name !== "string") {
    throw new Error(`Falta ${label}.name en scripts/seed.local.json.`);
  }
}

async function getOrCreateUser(auth, userConfig) {
  try {
    const existingUser = await auth.getUserByEmail(userConfig.email);
    const updated = await auth.updateUser(existingUser.uid, {
      email: userConfig.email,
      password: userConfig.password,
      displayName: userConfig.name,
      disabled: false
    });
    return { user: updated, reused: true };
  } catch (error) {
    if (error.code !== "auth/user-not-found") {
      throw error;
    }
  }

  const created = await auth.createUser({
    email: userConfig.email,
    password: userConfig.password,
    displayName: userConfig.name,
    disabled: false
  });

  return { user: created, reused: false };
}

function assertDocId(value, label) {
  if (!value || typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Falta un doc ID valido para ${label}.`);
  }
}

async function writeDoc(label, ref, data) {
  try {
    console.log("Escribiendo:", label, ref.path);
    await ref.set(data, { merge: true });
    console.log("OK:", label);
  } catch (error) {
    console.error("FALLO:", label, ref.path);
    console.error("code:", error?.code);
    console.error("message:", error?.message);
    console.error("details:", error?.details);
    console.error("stack:", error?.stack);
    throw error;
  }
}

async function main() {
  const serviceAccount = await readJson(serviceAccountPath, "serviceAccountKey.json");
  const seed = await readJson(seedConfigPath, "seed.local.json");

  assertSeedRoot(seed);
  assertUserConfig(seed.superAdmin, "superAdmin");
  assertUserConfig(seed.owner, "owner");

  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id
      });

  const auth = getAuth(app);
  const db = getFirestore(app, "default");
  console.log("Firestore databaseId: default");
  const createdAt = Date.now();

  try {
    console.log("Probando escritura simple en Firestore...");
    await db.collection("_seed_test").doc("ping").set({
      ok: true,
      projectId: serviceAccount.project_id,
      createdAt: Date.now(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    console.log("Firestore escritura simple OK");
  } catch (error) {
    console.error("Firestore test failed");
    console.error("code:", error?.code);
    console.error("message:", error?.message);
    console.error("details:", error?.details);
    console.error("stack:", error?.stack);
    throw error;
  }

  const superAdminResult = await getOrCreateUser(auth, seed.superAdmin);
  const ownerResult = await getOrCreateUser(auth, seed.owner);
  const miguelUid = superAdminResult?.user?.uid;
  const spencerUid = ownerResult?.user?.uid;

  assertDocId(miguelUid, "miguelUid");
  assertDocId(spencerUid, "spencerUid");
  assertDocId("barber_spencer", "barber_spencer");
  assertDocId("service_classic", "service_classic");
  assertDocId("service_fade", "service_fade");
  assertDocId("service_beard", "service_beard");
  assertDocId("service_taper", "service_taper");

  const miguelUserData = {
    id: miguelUid,
    name: seed.superAdmin.name,
    email: seed.superAdmin.email,
    phone: seed.superAdmin.phone || "50400000000",
    role: "super_admin",
    barberId: null,
    createdAt,
    active: true
  };

  const spencerUserData = {
    id: spencerUid,
    name: seed.owner.name,
    email: seed.owner.email,
    phone: seed.owner.phone || "50400000000",
    role: "owner",
    barberId: "barber_spencer",
    createdAt,
    active: true
  };

  const spencerBarberData = {
    id: "barber_spencer",
    userId: spencerUid,
    name: seed.owner.name,
    phone: seed.owner.phone || "50400000000",
    photo: "",
    status: "available",
    currentQueueId: null,
    currentClientName: null,
    serviceStartedAt: null,
    doneToday: 0,
    specialties: ["Fade", "Corte clásico", "Corte + Barba", "Taper"],
    active: true
  };

  const businessSettings = {
    appName: "Spencer Barber Shop",
    appSlug: "spencer-barber-shop",
    logo: "/logo.svg",
    logoText: "SB",
    themeColor: "#f59e0b",
    address: "Choloma, Cortés, Honduras",
    whatsapp: "50400000000",
    hours: "Lun-Sáb 9:00 AM - 8:00 PM",
    publicMessage: "Agendá tu cita, escaneá el QR al llegar y entrá a la fila de Spencer Barber Shop.",
    isMarketplace: false,
    ownerCanEditPayments: true,
    allowGuestClients: true
  };

  const paymentSettings = {
    bankName: "Banco Demo",
    accountHolder: "Spencer Barber Shop",
    accountNumberMasked: "****0000",
    whatsapp: "50400000000",
    qrNote: "Pago manual por transferencia. Enviar comprobante por WhatsApp.",
    editableOnlyByOwner: true
  };

  const classicService = {
    id: "service_classic",
    name: "Corte clásico",
    description: "Corte limpio y profesional.",
    price: 120,
    duration: 25,
    icon: "✂️",
    active: true
  };

  const fadeService = {
    id: "service_fade",
    name: "Fade / Degradado",
    description: "Degradado moderno con acabado limpio.",
    price: 150,
    duration: 35,
    icon: "💈",
    active: true
  };

  const beardService = {
    id: "service_beard",
    name: "Corte + Barba",
    description: "Corte completo con perfilado de barba.",
    price: 200,
    duration: 45,
    icon: "🧔",
    active: true
  };

  const taperService = {
    id: "service_taper",
    name: "Taper Fade",
    description: "Corte moderno con acabado natural y limpio.",
    price: 150,
    duration: 35,
    icon: "🔥",
    active: true
  };

  const analyticsDaily = {
    date: "initial",
    totalClients: 0,
    totalAppointments: 0,
    totalPayments: 0,
    createdAt
  };

  await writeDoc("users Miguel", db.collection("users").doc(miguelUid), miguelUserData);
  await writeDoc("users Spencer", db.collection("users").doc(spencerUid), spencerUserData);
  await writeDoc("barber Spencer", db.collection("barbers").doc("barber_spencer"), spencerBarberData);
  await writeDoc("settings business", db.collection("settings").doc("business"), businessSettings);
  await writeDoc("settings payment", db.collection("settings").doc("payment"), paymentSettings);
  await writeDoc("service classic", db.collection("services").doc("service_classic"), classicService);
  await writeDoc("service fade", db.collection("services").doc("service_fade"), fadeService);
  await writeDoc("service beard", db.collection("services").doc("service_beard"), beardService);
  await writeDoc("service taper", db.collection("services").doc("service_taper"), taperService);
  await writeDoc("analytics daily", db.collection("analytics").doc("daily"), analyticsDaily);

  console.log("Seed Firebase completado.");
  console.log(`Super Admin Miguel: ${superAdminResult.reused ? "reutilizado" : "creado"} -> ${superAdminResult.user.uid}`);
  console.log(`Owner Spencer: ${ownerResult.reused ? "reutilizado" : "creado"} -> ${ownerResult.user.uid}`);
  console.log("Documentos de Firestore creados o actualizados con merge=true.");
}

main().catch((error) => {
  console.error("Fallo seed Firebase:");
  if (error?.code === 5) {
    console.error("Firestore respondio NOT_FOUND. Normalmente significa que la base de Firestore aun no esta creada en este proyecto o que la service account pertenece a otro proyecto Firebase.");
    console.error("Revisa en Firebase Console:");
    console.error("1. Build > Firestore Database > Create database");
    console.error("2. Que scripts/serviceAccountKey.json sea del proyecto spencer-barber-shop");
    console.error("3. Que VITE_FIREBASE_PROJECT_ID y el project_id de la service account correspondan al mismo proyecto");
  }
  console.error(error);
  process.exit(1);
});
