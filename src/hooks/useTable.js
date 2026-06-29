import { useState, useEffect, useCallback, useMemo } from "react";
import { SEED } from "../data/seed";
import { sb, supabase } from "../lib/supabase";
// - DATA HOOK -
export function useTable(table,orderCol,orderAsc=false,options){
  const [data,setData]=useState(null),[loading,setLoading]=useState(true);
  const filters = options?.filters || null;
  const insertDefaults = options?.insertDefaults || null;
  const filterEntries = useMemo(
    ()=>Object.entries(filters || {}).filter(([,val])=>val!==null&&val!==undefined&&val!==""),
    [filters]
  );
  const load=useCallback(async()=>{
    setLoading(true);
    try{
      let query = supabase.from(table).select("*").order(orderCol,{ascending:orderAsc});
      filterEntries.forEach(([col,val])=>{ query = query.eq(col,val); });
      const{data:rows,error}=await query;
      if(!error)setData(rows);else setData(SEED[table]||[]);
    }
    catch{setData(SEED[table]||[]);}
    setLoading(false);
  },[table,orderCol,orderAsc,filterEntries]);
  useEffect(()=>{load();},[load]);
  async function insert(row){const nextRow={...(insertDefaults||{}),...row};try{const{data:r,error}=await sb.from(table).insert(nextRow);if(!error)await load();else{console.error(`Insert failed on ${table}:`,error);setData(p=>[{...nextRow,id:String(Date.now())},...(p||[])]);}return r;}catch(e){console.error(`Insert exception on ${table}:`,e);setData(p=>[{...nextRow,id:String(Date.now())},...(p||[])]);}}
  async function update(id,row){try{const{error}=await sb.from(table).eq("id",id).update(row);if(!error)await load();else{console.error(`Update failed on ${table}:`,error);setData(p=>p.map(r=>r.id===id?{...r,...row}:r));}}catch(e){console.error(`Update exception on ${table}:`,e);setData(p=>p.map(r=>r.id===id?{...r,...row}:r));}}
  async function remove(id){try{const{error}=await sb.from(table).eq("id",id).delete();if(!error)await load();else{console.error(`Delete failed on ${table}:`,error);setData(p=>p.filter(r=>r.id!==id));}}catch(e){console.error(`Delete exception on ${table}:`,e);setData(p=>p.filter(r=>r.id!==id));}}
  return{data:data||[],loading,reload:load,insert,update,remove};
}
