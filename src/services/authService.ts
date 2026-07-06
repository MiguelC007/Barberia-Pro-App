import { doc, getDoc } from "firebase/firestore";
import { getIdTokenResult, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import type { LoginCredentials, SessionUser, AppUser, UserRole } from "../types";
import { demoUsers } from "../data/demoSeed";
import { firebaseAuth, firestoreDb, isFirebaseConfigured } from "../config/firebase";
import { createId } from "../utils/id";

const SESSION_KEY = "spencer_barber_shop_session_v1";
const VALID_ROLES: UserRole[] = ["super_admin", "owner", "barber", "client", "guest"];

function findLocalUser(credentials: LoginCredentials) {
  const email = credentials.email.trim().toLowerCase();
  return demoUsers.find((user) => user.email?.toLowerCase() === email && user.password === credentials.password);
}

function isValidRole(value: unknown): value is UserRole {
  return typeof value === "string" && VALID_ROLES.includes(value as UserRole);
}

async function sessionFromClaims(user: User, fallbackEmail: string): Promise<SessionUser | null> {
  const token = await getIdTokenResult(user, true);
  const role = token.claims.role;

  if (!isValidRole(role)) {
    return null;
  }

  return {
    id: user.uid,
    name: typeof token.claims.name === "string" ? token.claims.name : user.displayName || "Miguel Carranza",
    email: user.email || fallbackEmail,
    phone: typeof token.claims.phone === "string" ? token.claims.phone : user.phoneNumber || "",
    role,
    barberId: typeof token.claims.barberId === "string" ? token.claims.barberId : null,
    createdAt: Date.now(),
    active: true,
    isDemo: false
  };
}

export function isUsingDemoAuth(): boolean {
  return !isFirebaseConfigured;
}

export async function loginWithEmail(credentials: LoginCredentials): Promise<SessionUser> {
  const email = credentials.email.trim().toLowerCase();

  if (isFirebaseConfigured) {
    if (!firebaseAuth || !firestoreDb) {
      throw new Error("Firebase no está disponible en esta sesión.");
    }

    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, credentials.password);

      try {
        const profileSnap = await getDoc(doc(firestoreDb, "users", credential.user.uid));
        if (profileSnap.exists()) {
          const profile = profileSnap.data() as Partial<AppUser>;
          if (!profile.role || !profile.name) {
            throw new Error("El perfil del usuario no tiene nombre o rol configurado.");
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
        }
      } catch (profileError) {
        console.warn("No se pudo leer el perfil en Firestore. Intentando claims de Firebase Auth.", profileError);
      }

      const claimSession = await sessionFromClaims(credential.user, email);
      if (claimSession) {
        return claimSession;
      }

      throw new Error("Tu usuario existe, pero falta asignarle rol super_admin, owner o barber.");
    } catch (error) {
      const fallback = findLocalUser(credentials);
      if (fallback) {
        const { password: _password, ...user } = fallback;
        return { ...user, isDemo: true };
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("No se pudo iniciar sesión.");
    }
  }

  const found = findLocalUser(credentials);

  if (!found) {
    throw new Error("Credenciales incorrectas. Revisa el correo y la contraseña.");
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
      // La sesión local ya fue limpiada; Firebase puede fallar offline sin bloquear la app.
    });
  }
}

export function toAppUser(user: SessionUser): AppUser {
  const { isDemo: _isDemo, ...appUser } = user;
  return appUser;
}
