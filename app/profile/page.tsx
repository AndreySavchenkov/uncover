"use client";

import { useProfile } from "@/hooks/useProfile";
import Link from "next/link";

export default function ProfilePage() {
  const { profile, loading } = useProfile();

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>No profile found</div>;

  const languages = profile.languages
    ? profile.languages
        .split(",")
        .map((s) => s.trim())
        .join(", ")
    : "—";
  const lookingFor = profile.looking_for
    ? profile.looking_for
        .split(",")
        .map((s) => s.trim())
        .join(", ")
    : "—";

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      <p>
        <strong>Username:</strong> {profile.username}
      </p>
      <p>
        <strong>Age:</strong> {profile.age}
      </p>
      <p>
        <strong>City:</strong> {profile.city ?? "—"}
      </p>
      <p>
        <strong>Gender:</strong> {profile.gender}
      </p>
      <p>
        <strong>Languages:</strong> {languages}
      </p>
      <p>
        <strong>Looking For:</strong> {lookingFor}
      </p>
      <p>
        <strong>About:</strong> {profile.about || "No information provided"}
      </p>
      {profile.photo_url && (
        <img
          src={profile.photo_url}
          alt="Profile Photo"
          className="mt-2 w-50 h-50 object-cover rounded"
        />
      )}
      <div className="mt-4">
        <Link href="/profile/edit" className="text-blue-500 hover:underline">
          Edit Profile
        </Link>
      </div>
    </div>
  );
}
