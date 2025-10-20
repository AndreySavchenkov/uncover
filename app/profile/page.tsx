"use client";

import { useProfile } from "@/hooks/useProfile";

export default function ProfilePage() {
  const { profile, loading } = useProfile();

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>No profile found</div>;

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      <p>
        <strong>Username:</strong> {profile.username}
      </p>
      <p>
        <strong>Age:</strong> {profile.age}
      </p>
    </div>
  );
}
