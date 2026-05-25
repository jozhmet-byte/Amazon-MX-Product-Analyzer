import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://dummy.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "dummy";

if (supabaseUrl === "https://dummy.supabase.co") {
  console.warn("Faltan variables de entorno de Supabase.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
