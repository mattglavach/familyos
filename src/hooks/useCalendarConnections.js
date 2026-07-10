import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { formatCalendarError } from "../lib/userFacingErrors";

function initialState() {
  return {
    loading: false,
    error: "",
    status: "disconnected",
    connected: false,
    connection: null,
    connections: [],
    events: [],
    note: "",
    lastFetchedAt: null,
  };
}

async function getSessionToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("Missing sign-in session.");
  return token;
}

async function callCalendarApi(action, { householdId, method = "GET", body = {} } = {}) {
  if (!householdId) throw new Error("Missing active household.");
  const token = await getSessionToken();
  const params = new URLSearchParams({ action, household_id: householdId });
  const options = {
    method,
    headers: { Authorization: `Bearer ${token}` },
  };
  if (method !== "GET") {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify({ ...body, household_id: householdId, action });
  }
  const response = await fetch(`/api/calendar?${params.toString()}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Calendar API request failed.");
    error.status = response.status;
    throw error;
  }
  return data;
}

export function useCalendarConnections(householdId) {
  const [state, setState] = useState(initialState);

  const refresh = useCallback(async () => {
    if (!householdId) {
      setState(previous => ({ ...previous, loading: false, error: "Calendar is waiting for your active household. Open Settings to choose or refresh your household." }));
      return;
    }
    setState(previous => ({ ...previous, loading: true, error: "" }));
    try {
      const data = await callCalendarApi("status", { householdId });
      setState(previous => ({ ...previous, ...data, loading: false, error: "" }));
    } catch (error) {
      setState(previous => ({ ...previous, loading: false, error: formatCalendarError(error) }));
    }
  }, [householdId]);

  const connect = useCallback(async () => {
    setState(previous => ({ ...previous, loading: true, error: "" }));
    try {
      const data = await callCalendarApi("connect", { householdId, method: "POST" });
      setState(previous => ({
        ...previous,
        loading: false,
        error: "",
        connection: data.connection || previous.connection,
        status: data.connection?.connection_status || "pending",
        lastFetchedAt: null,
      }));
      return data;
    } catch (error) {
      setState(previous => ({ ...previous, loading: false, error: formatCalendarError(error) }));
      return null;
    }
  }, [householdId]);

  const disconnect = useCallback(async (connectionId) => {
    setState(previous => ({ ...previous, loading: true, error: "" }));
    try {
      await callCalendarApi("disconnect", {
        householdId,
        method: "POST",
        body: { connection_id: connectionId },
      });
      setState(previous => ({ ...previous, events: [], lastFetchedAt: null }));
      await refresh();
    } catch (error) {
      setState(previous => ({ ...previous, loading: false, error: formatCalendarError(error) }));
    }
  }, [householdId, refresh]);

  const fetchEvents = useCallback(async () => {
    setState(previous => ({ ...previous, loading: true, error: "" }));
    try {
      const data = await callCalendarApi("events", { householdId });
      if (data.error) {
        setState(previous => ({
          ...previous,
          ...data,
          events: data.events || [],
          loading: false,
          error: formatCalendarError(data.error),
          lastFetchedAt: new Date().toISOString(),
        }));
        return data.events || [];
      }
      setState(previous => ({
        ...previous,
        ...data,
        events: data.events || [],
        lastFetchedAt: new Date().toISOString(),
        loading: false,
        error: "",
      }));
      return data.events || [];
    } catch (error) {
      setState(previous => ({ ...previous, loading: false, error: formatCalendarError(error) }));
      return [];
    }
  }, [householdId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!householdId || typeof window === "undefined") return undefined;
    const refreshVisibleCalendar = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refreshVisibleCalendar);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refreshVisibleCalendar);
    };
  }, [householdId, refresh]);

  useEffect(() => {
    if (!state.connected || state.events.length || state.loading || state.lastFetchedAt) return;
    fetchEvents();
  }, [fetchEvents, state.connected, state.events.length, state.lastFetchedAt, state.loading]);

  return {
    ...state,
    refresh,
    connect,
    disconnect,
    fetchEvents,
  };
}
