import { doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import type { LoginCredentials, SessionUser, AppUser } from "../types";
import { demoUsers } from "../data/demoSeed";
import { firebaseAuth, firestoreDb, isFirebaseConfigured } from "../config/firebase";
import { createId } from "../utils/id";

const SESSION_KEY = "spencer_barber_shop_session_v1";

function findDemoUser(credentials: LoginCredentials) {
  const email = credentials.email.trim().toLowerCase();
  return demoUsers.find(
    (user) => user.email?.toLowerCase() === email && user.password === credentials.password
  );
}

export function isUsingDemoAuth(): boolean {
  return !isFirebaseConfigured;
}

export async function loginWithEmail(credentials: LoginCredentials): Promise<SessionUser> {
  const email = credentials.email.trim().toLowerCase();

  if (isFirebaseConfigured) {
    if (!firebaseAuth || !firestoreDb) {
      throw new Error("Firebase no esta disponible en esta sesion.");
    }

    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, credentials.password);
      const profileSnap = await getDoc(doc(firestoreDb, "users", credential.user.uid));
      if (!profileSnap.exists()) {
        throw new Error("El usuario existe en Firebase Auth, pero no tiene perfil con rol en Firestore.");
      }

      const profile = profileSnap.data() as Partial<AppUser>;
      if (!profile.role || !profile.name) {
        throw new Error("El perfil de usuario no tiene nombre o rol configurado.");
      }

      return {
        id: credential.user.uid,
        name: profile.name,
        email: credential.user.email || email,
        phone: profile.phone || credential.user.phoneNumber || "",
        role: profile.role,
        barberId: profile.barberId ?? null,
        createdAt: typeof profile.createdAt === "number" ? profile.createdAt : Date.now(),
        active: profile.active !== false,
        isDemo: false
      };
    } catch (error) {
      const fallback = findDemoUser(credentials);
      if (fallback) {
        const { password: _password, ...user } = fallback;
        return { ...user, isDemo: true };
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("No se pudo iniciar sesion.");
    }
  }

  const found = findDemoUser(credentials);

  if (!found) {
    throw new Error("Credenciales incorrectas. Revisá el correo y contraseña demo.");
  }

  const { password: _password, ...user } = found;
  return { ...user, isDemo: true };
}

export function createClientSession(name: string, phone?: string): SessionUser {
  return {
    id: createId("client"),
    name: name.trim() || "Cliente",
    phone: phone?.trim() || "",
    role: "client",
    createdAt: Date.now(),
    active: true,
    barberId: null,
    isDemo: true
  };
}

export function createGuestSession(): SessionUser {
  return {
    id: createId("guest"),
    name: "Invitado",
    phone: "",
    role: "guest",
    createdAt: Date.now(),
    active: true,
    barberId: null,
    isDemo: true
  };
}

export function saveSession(user: SessionUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function loadSession(): SessionUser | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  if (firebaseAuth) {
    signOut(firebaseAuth).catch(() => {
      // La sesion local ya fue limpiada; Firebase puede fallar offline sin bloquear la app.
    });
  }
}

export function toAppUser(user: SessionUser): AppUser {
  const { isDemo: _isDemo, ...appUser } = user;
  return appUser;
}
