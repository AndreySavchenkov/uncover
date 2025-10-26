"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";
import { LANGUAGE_OPTIONS, GENDER_OPTIONS } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { profile, loading } = useProfile();

  // Код -> лейбл (флаг + нативное название)
  const LANG_MAP = useMemo(
    () =>
      new Map(LANGUAGE_OPTIONS.map((o) => [o.value.toLowerCase(), o.label])),
    []
  );
  const GENDER_MAP = useMemo(
    () =>
      new Map<string, string>(
        GENDER_OPTIONS.map((o) => [String(o.value), o.label])
      ),
    []
  );

  if (loading)
    return (
      <div className="max-w-3xl mx-auto mt-10 mb-10 px-4 sm:px-6">
        <Card>
          <CardHeader>
            <div className="h-6 w-40 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-1">
                <div className="aspect-square w-full rounded-xl bg-muted animate-pulse" />
              </div>
              <div className="md:col-span-2 grid gap-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-5 w-full bg-muted rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );

  if (!profile)
    return (
      <div className="max-w-3xl mx-auto mt-10 mb-10 px-4 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No profile found.</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/profile/create">Create profile</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );

  const languageCodes = profile.languages
    ? profile.languages
        .split(",")
        .map((s: string) => s.trim().toLowerCase())
        .filter(Boolean)
    : [];
  const languages =
    languageCodes.length > 0
      ? languageCodes.map((c: string) => LANG_MAP.get(c) ?? c).join(", ")
      : "—";

  const lookingForCodes = profile.looking_for
    ? profile.looking_for
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    : [];
  const lookingFor =
    lookingForCodes.length > 0
      ? lookingForCodes.map((g: string) => GENDER_MAP.get(g) ?? g).join(", ")
      : "—";

  return (
    <div className="max-w-3xl mx-auto mt-10 mb-10 px-4 sm:px-6">
      <Card className="w-full sm:max-w-[unset]">
        <CardHeader>
          <CardTitle>Your profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Фото */}
            <div className="md:col-span-1">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
                {profile.photo_url ? (
                  <Image
                    src={profile.photo_url}
                    alt="Profile photo"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 320px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    No photo
                  </div>
                )}
              </div>
            </div>

            {/* Данные */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <FieldRow label="Username" value={profile.username} />
              <FieldRow label="Age" value={profile.age} />
              <FieldRow label="City" value={profile.city ?? "—"} />
              <FieldRow
                label="Gender"
                value={GENDER_MAP.get(profile.gender ?? "") ?? profile.gender}
              />
              <FieldRow
                label="Languages"
                value={languages}
                className="sm:col-span-2"
              />
              <FieldRow
                label="Looking for"
                value={lookingFor}
                className="sm:col-span-2"
              />
              <div className="sm:col-span-2">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  About
                </div>
                <div className="rounded-md border bg-background p-3 whitespace-pre-wrap">
                  {profile.about || "No information provided"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button asChild>
            <Link href="/profile/edit">Edit profile</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function FieldRow({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="text-base">{value}</div>
    </div>
  );
}
