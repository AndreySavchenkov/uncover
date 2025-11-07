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
  instagram?: string | null;
  telegram?: string | null;
  whatsapp?: string | null;
  cities?: { id: string; name: string; country: string } | null;
};

type ProfileMapped = {
  email?: string;
  username?: string;
  age?: number;
  photo_url?: string | null;
  gender?: string;
  city?: string;
  languages?: string | null;
  looking_for?: string | null;
  about?: string | null;
  city_id?: string | null;
  instagram?: string | null;
  telegram?: string | null;
  whatsapp?: string | null;
};

// tri-state: undefined = ещё проверяем; null = профиля нет; obj = профиль есть
type ProfileState = ProfileMapped | null | undefined;

export function useProfile() {
  const { user, loading: userLoading } = useUser();

  const [profile, setProfile] = useState<ProfileState>(undefined);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);

  useEffect(() => {
    // старт новой проверки для текущего user
    setProfile(undefined);
    setChecked(false);
    setCheckedUserId(null);

    if (!user) {
      // неавторизован — считаем проверенным
      setProfile(null);
      setLoading(false);
      setChecked(true);
      setCheckedUserId(null);
      return;
    }

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          email, username, age, photo_url, gender, languages, looking_for, about, city_id,
          instagram, telegram, whatsapp,
          cities:city_id ( id, name, country )
        `
        )
        .eq("id", user.id)
        .maybeSingle<ProfileRow>();

      if (error) {
        console.error(error);
        setProfile(null);
      } else if (data) {
        setProfile({
          email: data.email ?? undefined,
          username: data.username ?? undefined,
          age: data.age ?? undefined,
          photo_url: data.photo_url ?? null,
          gender: data.gender ?? undefined,
          city: data.cities
            ? `${data.cities.name}, ${data.cities.country}`
            : undefined,
          languages: data.languages ?? null,
          looking_for: data.looking_for ?? null,
          about: data.about ?? null,
          city_id: data.city_id ?? null,
          instagram: data.instagram ?? null,
          telegram: data.telegram ?? null,
          whatsapp: data.whatsapp ?? null,
        });
      } else {
        setProfile(null);
      }

      setLoading(false);
      setChecked(true);
      setCheckedUserId(user.id);
    };

    load();
  }, [user?.id]); // важна привязка к текущему user.id

  // checked истинно только если проверяли именно текущего пользователя
  const ready = checked && checkedUserId === (user?.id ?? null);

  return {
    profile,
    loading: loading || userLoading,
    checked: ready,
    checkedUserId,
  };
}
