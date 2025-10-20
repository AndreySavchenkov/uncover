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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user && !userLoading) router.push("/login");
  }, [user, userLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    // создаём или обновляем профиль
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      username,
      age: age || null,
    });

    setLoading(false);
    if (!error) router.push("/quest"); // редирект на основной экран
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
