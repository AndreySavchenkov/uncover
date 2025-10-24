import { supabase } from "@/lib/supabaseClient";

export async function checkEmailExists(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking email:", error);
    return false;
  }

  return !!data;
}
