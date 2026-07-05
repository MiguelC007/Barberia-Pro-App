import type { AppUser } from "../types";
import { getAppState, mutateAppState } from "./localStore";

export function listUsers(): AppUser[] {
  return getAppState().users;
}

export function upsertUser(user: AppUser): void {
  mutateAppState((state) => {
    const exists = state.users.some((item) => item.id === user.id);
    return {
      ...state,
      users: exists ? state.users.map((item) => (item.id === user.id ? user : item)) : [...state.users, user]
    };
  });
}
