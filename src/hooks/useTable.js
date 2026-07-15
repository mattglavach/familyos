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
  const optionalLocalFallback = table === "ai_feedback" && process.env.NODE_ENV === "development" && process.env.REACT_APP_ENABLE_ADVISORY_API !== "true";
  const household = useHousehold();
  const {
    householdId = household.householdId,
    userId = household.user?.id,
    householdScoped = true,
  } = options || {};
  const [data,setData]=useState(null),[loading,setLoading]=useState(true);
  const load=useCallback(async(options={})=>{
    setLoading(true);
    if(optionalLocalFallback){setData([]);setLoading(false);return;}
    try{
      let query = supabase.from(table).select("*").order(orderCol,{ascending:orderAsc});
      if (householdScoped && householdId) query = query.eq("household_id", householdId);
      const{data:rows,error}=await query;
      if(!error)setData(rows);
      else{
        if(options.throwOnError) throw error;
        setData(SEED[table]||[]);
      }
    }
    catch(error){
      if(options.throwOnError) throw error;
      setData(SEED[table]||[]);
    }
    setLoading(false);
  },[table,orderCol,orderAsc,householdId,householdScoped,optionalLocalFallback]);
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
  async function insert(row){
    if(optionalLocalFallback)throw new Error("Optional advisory persistence is not enabled in local development.");
    const nextRow=withOwnership(row);
    const{data:r,error}=await supabase.from(table).insert(nextRow).select().single();
    if(error){
      console.error(`Insert failed on ${table}:`,error);
      throw error;
    }
    await load({throwOnError:true});
    notifyTableChanged(table);
    return r;
  }
  async function update(id,row){
    const nextRow=withOwnership(row);
    const{error}=await supabase.from(table).update(nextRow).eq("id",id);
    if(error){
      console.error(`Update failed on ${table}:`,error);
      throw error;
    }
    await load({throwOnError:true});
    notifyTableChanged(table);
  }
  async function remove(id){
    const{error}=await supabase.from(table).delete().eq("id",id);
    if(error){
      console.error(`Delete failed on ${table}:`,error);
      throw error;
    }
    await load({throwOnError:true});
    notifyTableChanged(table);
  }
  return{data:data||[],loading,reload:load,insert,update,remove};
}
