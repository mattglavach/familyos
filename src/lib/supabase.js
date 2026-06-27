import { createClient } from "@supabase/supabase-js";
import { APP_CONFIG } from "../config";

export const supabase = createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

function normalizeResult({ data, error }) {
  return { data, error };
}

export const sb = {
  from: (table) => ({
    _table: table,
    _order: null,
    _eq: null,
    order(col, { ascending = true } = {}) {
      this._order = { col, ascending };
      return this;
    },
    eq(col, val) {
      this._eq = { col, val };
      return this;
    },
    async select(cols = "*") {
      let query = supabase.from(this._table).select(cols);
      if (this._order) query = query.order(this._order.col, { ascending: this._order.ascending });
      if (this._eq) query = query.eq(this._eq.col, this._eq.val);
      return normalizeResult(await query);
    },
    async insert(row) {
      const { data, error } = await supabase.from(this._table).insert(row).select().single();
      return { data, error };
    },
    async update(row) {
      if (!this._eq) throw new Error("eq required");
      const { data, error } = await supabase
        .from(this._table)
        .update(row)
        .eq(this._eq.col, this._eq.val)
        .select()
        .single();
      return { data, error };
    },
    async delete() {
      if (!this._eq) throw new Error("eq required");
      const { error } = await supabase.from(this._table).delete().eq(this._eq.col, this._eq.val);
      return { error };
    },
  }),
};
