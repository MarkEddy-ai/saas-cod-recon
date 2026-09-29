import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function setTenantContext(storeId: string) {
  const { error } = await supabase.rpc("set_claim", {
    claim: "app.current_store_id",
    value: storeId,
  });
  if (error) {
    console.error("Erreur configuration tenant RLS:", error);
  }
}
