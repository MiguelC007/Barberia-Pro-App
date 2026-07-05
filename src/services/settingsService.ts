import type { BusinessSettings } from "../types";
import { mutateAppState, resetAppState, exportAppState } from "./localStore";

export function updateBusinessSettings(settings: BusinessSettings): void {
  mutateAppState((state) => ({
    ...state,
    business: settings
  }));
}

export function resetDemoData(): void {
  resetAppState();
}

export function exportDataJson(): string {
  return exportAppState();
}
