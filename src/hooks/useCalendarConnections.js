import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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
  };
}

async function getSessionToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("Missing Supabase session.");
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
  if (!response.ok) throw new Error(data.error || "Calendar API request failed.");
  return data;
}

export function useCalendarConnections(householdId) {
  const [state, setState] = useState(initialState);

  const refresh = useCallback(async () => {
    if (!householdId) {
      setState(previous => ({ ...previous, loading: false, error: "Missing active household." }));
      return;
    }
    setState(previous => ({ ...previous, loading: true, error: "" }));
    try {
      const data = await callCalendarApi("status", { householdId });
      setState(previous => ({ ...previous, ...data, loading: false, error: "" }));
    } catch (error) {
      setState(previous => ({ ...previous, loading: false, error: error.message }));
    }
  }, [householdId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
      }));
      return data;
    } catch (error) {
      setState(previous => ({ ...previous, loading: false, error: error.message }));
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
      await refresh();
    } catch (error) {
      setState(previous => ({ ...previous, loading: false, error: error.message }));
    }
  }, [householdId, refresh]);

  const fetchEvents = useCallback(async () => {
    setState(previous => ({ ...previous, loading: true, error: "" }));
    try {
      const data = await callCalendarApi("events", { householdId });
      setState(previous => ({
        ...previous,
        ...data,
        events: data.events || [],
        loading: false,
        error: "",
      }));
      return data.events || [];
    } catch (error) {
      setState(previous => ({ ...previous, loading: false, error: error.message }));
      return [];
    }
  }, [householdId]);

  return {
    ...state,
    refresh,
    connect,
    disconnect,
    fetchEvents,
  };
}
