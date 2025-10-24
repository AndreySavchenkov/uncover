import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "./useUser";

export function useProfile() {
  const { user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState<{
    email?: string;
    username?: string;
    age?: number;
    photo_url?: string | null;
    gender?: string;
    city?: string;
    languages?: string;
    looking_for?: string;
    about?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "username, age, photo_url, gender, city, languages, looking_for, about, email"
        )
        .eq("id", user.id)
        .single();

      if (data) setProfile(data);
      if (error) console.error(error);
      setLoading(false);
    };

    loadProfile();
  }, [user]);

  return { profile, loading: loading || userLoading };
}
