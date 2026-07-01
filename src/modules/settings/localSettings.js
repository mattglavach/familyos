import { COLORS } from "../../theme";

export const SETTINGS_STORAGE_KEY = "familyos_settings_v1";

export const DEFAULT_SETTINGS = {
  householdName: "Glavach Household",
  defaultFamilyMember: "Family",
  taskDefaultCategory: "Home",
  taskDefaultPriority: "med",
};

export const LOCAL_DATA_KEYS = [
  "gc_token",
  "gc_user_name",
  "gc_last_synced_at",
  SETTINGS_STORAGE_KEY,
  "familyos_family_members_v1",
  "familyos_task_metadata_v1",
];

export const TASK_CATEGORY_OPTIONS = ["Home", "Pool", "Yard", "College", "Finance", "Personal", "Work"];
export const TASK_PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: COLORS.slate },
  { value: "med", label: "Medium", color: COLORS.amber },
  { value: "high", label: "High", color: COLORS.red },
];

export function normalizeSettings(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    householdName: typeof source.householdName === "string" && source.householdName.trim() ? source.householdName.trim() : DEFAULT_SETTINGS.householdName,
    defaultFamilyMember: typeof source.defaultFamilyMember === "string" && source.defaultFamilyMember.trim() ? source.defaultFamilyMember.trim() : DEFAULT_SETTINGS.defaultFamilyMember,
    taskDefaultCategory: TASK_CATEGORY_OPTIONS.includes(source.taskDefaultCategory) ? source.taskDefaultCategory : DEFAULT_SETTINGS.taskDefaultCategory,
    taskDefaultPriority: TASK_PRIORITY_OPTIONS.some(option => option.value === source.taskDefaultPriority) ? source.taskDefaultPriority : DEFAULT_SETTINGS.taskDefaultPriority,
  };
}

export function readLocalSettings() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return DEFAULT_SETTINGS;
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    return normalizeSettings(raw ? JSON.parse(raw) : DEFAULT_SETTINGS);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeLocalSettings(settings) {
  const normalized = normalizeSettings(settings);
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function localDataSnapshot() {
  if (typeof window === "undefined" || !window.localStorage) return [];
  return LOCAL_DATA_KEYS.map(key => {
    const value = window.localStorage.getItem(key);
    return {
      key,
      present: value !== null,
      bytes: value ? new Blob([value]).size : 0,
    };
  });
}
