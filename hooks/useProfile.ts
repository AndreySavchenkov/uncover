import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "./useUser";

type ProfileRow = {
  email?: string;
  username?: string;
  age?: number;
  photo_url?: string | null;
  gender?: string;
  languages?: string | null;
  looking_for?: string | null;
  about?: string | null;
  city_id?: string | null;
  cities?: { id: string; name: string; country: string } | null;
};

export function useProfile() {
  const { user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState<{
    email?: string;
    username?: string;
    age?: number;
    photo_url?: string | null;
    gender?: string;
    city?: string; // "City, Country" для UI
    languages?: string | null;
    looking_for?: string | null;
    about?: string | null;
    city_id?: string | null;
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
        .select(`
          email, username, age, photo_url, gender, languages, looking_for, about, city_id,
          cities:city_id ( id, name, country )
        `)
        .eq("id", user.id)
        .maybeSingle<ProfileRow>();

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      if (data) {
        setProfile({
          email: data.email ?? undefined,
          username: data.username ?? undefined,
          age: data.age ?? undefined,
          photo_url: data.photo_url ?? null,
          gender: data.gender ?? undefined,
          city: data.cities ? `${data.cities.name}, ${data.cities.country}` : undefined,
          languages: data.languages ?? null,
          looking_for: data.looking_for ?? null,
          about: data.about ?? null,
          city_id: data.city_id ?? null,
        });
      }

      setLoading(false);
    };

    loadProfile();
  }, [user]);

  return { profile, loading: loading || userLoading };
}
