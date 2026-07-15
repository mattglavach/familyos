import { supabase } from "../lib/supabase";
import { deterministicAdvisory, validateAdvisoryResponse } from "./advisoryContract";

export async function requestAdvisory({ householdId, question, mode = "assistant", modules = [], context, signal }) {
  const fallback = deterministicAdvisory(context, { fallback: true });
  try {
    const localOverride = typeof window !== "undefined" && window.localStorage?.getItem("familyos_advisory_api_local") === "enabled";
    if (process.env.NODE_ENV === "development" && typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname) && process.env.REACT_APP_ENABLE_ADVISORY_API !== "true" && !localOverride) {
      return { ...fallback, notice: "Local advisory API is not enabled. Showing current FamilyOS facts." };
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token || !householdId) return { ...fallback, notice: "AI is unavailable. Showing current FamilyOS facts." };
    const response = await fetch("/api/advisory", { method: "POST", signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ householdId, question, mode, modules }) });
    if (!response.ok) throw new Error("advisory unavailable");
    const data = await response.json(), checked = validateAdvisoryResponse(data);
    if (!checked.ok) return { ...checked.value, fallback: true, notice: "Some AI details were hidden because they did not pass FamilyOS validation." };
    return checked.value;
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    return { ...fallback, notice: "AI is unavailable. Showing current FamilyOS facts." };
  }
}
