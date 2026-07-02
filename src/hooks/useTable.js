import { useState, useEffect, useCallback } from "react";
import { useHousehold } from "../context/HouseholdContext";
import { SEED } from "../data/seed";
import { supabase } from "../lib/supabase";
// - DATA HOOK -
const DATA_CHANGED_EVENT = "familyos:data-changed";

function notifyTableChanged(table) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { detail: { table } }));
  }
}

export function useTable(table,orderCol,orderAsc=false,options={}){
  const household = useHousehold();
  const {
    householdId = household.householdId,
    userId = household.user?.id,
    householdScoped = true,
  } = options || {};
  const [data,setData]=useState(null),[loading,setLoading]=useState(true);
  const load=useCallback(async()=>{
    setLoading(true);
    try{
      let query = supabase.from(table).select("*").order(orderCol,{ascending:orderAsc});
      if (householdScoped && householdId) query = query.eq("household_id", householdId);
      const{data:rows,error}=await query;
      if(!error)setData(rows);else setData(SEED[table]||[]);
    }
    catch{setData(SEED[table]||[]);}
    setLoading(false);
  },[table,orderCol,orderAsc,householdId,householdScoped]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{
    if (typeof window === "undefined") return undefined;
    function handleDataChanged(event) {
      if (event.detail?.table === table) load();
    }
    window.addEventListener(DATA_CHANGED_EVENT, handleDataChanged);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, handleDataChanged);
  },[load,table]);
  function withOwnership(row){
    const next = { ...row };
    if (householdScoped && householdId && next.household_id === undefined) next.household_id = householdId;
    if (userId && next.user_id === undefined) next.user_id = userId;
    return next;
  }
  async function insert(row){const nextRow=withOwnership(row);try{const{data:r,error}=await supabase.from(table).insert(nextRow).select().single();if(!error){await load();notifyTableChanged(table);}else{console.error(`Insert failed on ${table}:`,error);setData(p=>[{...nextRow,id:String(Date.now())},...(p||[])]);}return r;}catch(e){console.error(`Insert exception on ${table}:`,e);setData(p=>[{...nextRow,id:String(Date.now())},...(p||[])]);}}
  async function update(id,row){const nextRow=withOwnership(row);try{const{error}=await supabase.from(table).update(nextRow).eq("id",id);if(!error){await load();notifyTableChanged(table);}else{console.error(`Update failed on ${table}:`,error);setData(p=>p.map(r=>r.id===id?{...r,...nextRow}:r));}}catch(e){console.error(`Update exception on ${table}:`,e);setData(p=>p.map(r=>r.id===id?{...r,...nextRow}:r));}}
  async function remove(id){try{const{error}=await supabase.from(table).delete().eq("id",id);if(!error){await load();notifyTableChanged(table);}else{console.error(`Delete failed on ${table}:`,error);setData(p=>p.filter(r=>r.id!==id));}}catch(e){console.error(`Delete exception on ${table}:`,e);setData(p=>p.filter(r=>r.id!==id));}}
  return{data:data||[],loading,reload:load,insert,update,remove};
}
