"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";

export default function CreateProfilePage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [username, setUsername] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [gender, setGender] = useState(""); // Пол
  const [city, setCity] = useState(""); // Город
  const [languages, setLanguages] = useState(""); // Языки
  const [lookingFor, setLookingFor] = useState(""); // Кого ищет
  const [about, setAbout] = useState("");
  const [loading, setLoading] = useState(false);

  // Редирект на логин, если не авторизован
  useEffect(() => {
    if (!user && !userLoading) router.push("/login");
  }, [user, userLoading]);

  // Предварительный просмотр фото
  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(photo);
    setPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    let photoUrl: string | null = null;

    // Получаем текущий профиль пользователя
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("photo_url")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      setLoading(false);
      return;
    }

    // Удаляем старое фото, если оно существует
    if (profileData?.photo_url) {
      const oldFilePath = profileData.photo_url.split("/").slice(-1)[0]; // Извлекаем имя файла из URL
      const { error: deleteError } = await supabase.storage
        .from("profile_photos")
        .remove([oldFilePath]);

      if (deleteError) {
        console.error("Error deleting old photo:", deleteError);
        setLoading(false);
        return;
      }
    }

    // Загружаем новое фото
    if (photo) {
      const fileExt = photo.name.split(".").pop();
      const filePath = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("profile_photos")
        .upload(filePath, photo, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        setLoading(false);
        return;
      }

      const { data } = supabase.storage
        .from("profile_photos")
        .getPublicUrl(filePath);

      photoUrl = data.publicUrl;
    }

    // Обновляем профиль пользователя
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      username,
      age: age || null,
      photo_url: photoUrl,
      gender,
      city,
      languages,
      looking_for: lookingFor,
      about,
    });

    if (error) {
      console.error("Upsert error:", error);
    } else {
      console.log("Profile updated successfully");
    }

    setLoading(false);
    setUsername("");
    setAge("");
    setPhoto(null);
    setPhotoPreview(null);
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Create your profile</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(Number(e.target.value))}
          className="border p-2 rounded"
        />
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="couple">Couple</option>
        </select>
        <input
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Languages (comma-separated)"
          value={languages}
          onChange={(e) => setLanguages(e.target.value)}
          className="border p-2 rounded"
        />
        <select
          value={lookingFor}
          onChange={(e) => setLookingFor(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Looking for</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="couple">Couple</option>
        </select>
        <textarea
          placeholder="Tell us about yourself"
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          className="border p-2 rounded w-full"
        ></textarea>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
        />
        {photoPreview && (
          <img
            src={photoPreview}
            alt="Preview"
            className="mt-2 w-32 h-32 object-cover rounded"
          />
        )}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white p-2 rounded"
        >
          {loading ? "Saving..." : "Save & Continue"}
        </button>
      </form>
    </div>
  );
}
