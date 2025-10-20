"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    const {
      data: { user },
    } = await supabase.auth.signUp({
      email,
      password,
    });

    if (user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id, // важно, чтобы совпадало с auth.users.id
        username: "",
        bio: "",
        photo_url: null,
        fact1: "",
        fact2: "",
        fact3: "",
      });

      if (profileError) console.error("Error creating profile:", profileError);
    }

    if (error) {
      setError(error.message);
    } else {
      alert("Check your email for confirmation link!");
      // router.push("/profile/create");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-4">Create Account</h1>
      <form onSubmit={handleRegister} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Sign Up
        </button>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
}
