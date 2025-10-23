import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export const usePhotoUpload = (user: User) => {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photo || !user) return null;
    setLoading(true);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("photo_url")
      .eq("id", user.id)
      .single();

    if (profileData?.photo_url) {
      const oldFilePath = profileData.photo_url.split("/").pop();
      if (oldFilePath) {
        await supabase.storage.from("profile_photos").remove([oldFilePath]);
      }
    }

    const fileExt = photo.name.split(".").pop();
    const filePath = `${user.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("profile_photos")
      .upload(filePath, photo, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      setLoading(false);
      return null;
    }

    const { data: newData } = supabase.storage
      .from("profile_photos")
      .getPublicUrl(filePath);

    const url = newData.publicUrl;
    setLoading(false);
    return url;
  };

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(photo);
    setPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  return {
    setPhoto,
    photoPreview,
    uploadPhoto,
    loading,
  };
};
