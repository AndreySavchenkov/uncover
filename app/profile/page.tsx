"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import { LANGUAGE_OPTIONS, GENDER_OPTIONS } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type QuestRow = {
  id: string;
  created_at: string;
  tags: string[];
  gift_url: string | null;
  gift_path: string | null;
  answers: Array<{
    question_id: string;
    tag: string;
    question: string;
    value: string;
    text: string;
  }>;
};

export default function ProfilePage() {
  const { profile, loading } = useProfile();
  const { user } = useUser();

  const [quests, setQuests] = useState<QuestRow[]>([]);
  const [qLoading, setQLoading] = useState(true);
  const [qError, setQError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.id) {
        setQuests([]);
        setQLoading(false);
        return;
      }
      setQLoading(true);
      setQError(null);
      const { data, error } = await supabase
        .from("quests")
        .select("id, created_at, tags, gift_url, gift_path, answers")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!mounted) return;
      if (error) setQError(error.message);
      setQuests((data as QuestRow[]) ?? []);
      setQLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

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

  // Квесты текущего пользователя

  const removeGift = async (q: QuestRow) => {
    if (!q.gift_url) return;
    setBusyId(q.id);
    setQError(null);
    try {
      if (q.gift_path) {
        await supabase.storage.from("gifts").remove([q.gift_path]);
      }
      const { error } = await supabase
        .from("quests")
        .update({ gift_path: null, gift_url: null })
        .eq("id", q.id);
      if (error) throw error;
      setQuests((prev) =>
        prev.map((it) =>
          it.id === q.id ? { ...it, gift_path: null, gift_url: null } : it
        )
      );
    } catch (e: any) {
      setQError(e.message || "Failed to remove gift");
    } finally {
      setBusyId(null);
    }
  };

  const deleteQuest = async (q: QuestRow) => {
    if (!confirm("Delete this quest? This cannot be undone.")) return;
    setBusyId(q.id);
    setQError(null);
    try {
      // 1) Сначала удаляем запись квеста (если нет прав — оборвёмся, фото не трогаем)
      const { error: delErr } = await supabase
        .from("quests")
        .delete()
        .eq("id", q.id);
      if (delErr) throw delErr;

      // 2) Затем best-effort удаляем файл из Storage
      if (q.gift_path) {
        try {
          await supabase.storage.from("gifts").remove([q.gift_path]);
        } catch {}
      }

      // 3) Убираем из локального списка
      setQuests((prev) => prev.filter((it) => it.id !== q.id));
    } catch (e: any) {
      setQError(e.message || "Failed to delete quest");
    } finally {
      setBusyId(null);
    }
  };

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

              {/* Contacts */}
              <div className="sm:col-span-2">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Contacts
                </div>
                <div className="rounded-md border bg-background p-3">
                  {profile.instagram || profile.telegram || profile.whatsapp ? (
                    <ul className="space-y-1 text-sm">
                      {profile.instagram && (
                        <li>
                          Instagram:{" "}
                          <a
                            href={profile.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {profile.instagram}
                          </a>
                        </li>
                      )}
                      {profile.telegram && (
                        <li>
                          Telegram:{" "}
                          <a
                            href={profile.telegram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {profile.telegram}
                          </a>
                        </li>
                      )}
                      {profile.whatsapp && (
                        <li>
                          WhatsApp:{" "}
                          <a
                            href={profile.whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {profile.whatsapp}
                          </a>
                        </li>
                      )}
                    </ul>
                  ) : (
                    <div className="text-muted-foreground">—</div>
                  )}
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

      {/* Your quests */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Your quests</CardTitle>
          </CardHeader>
          <CardContent>
            {qError && (
              <div className="mb-3 text-sm text-red-500">{qError}</div>
            )}
            {qLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="h-40 w-full bg-muted rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : quests.length === 0 ? (
              <div className="text-muted-foreground">No quests yet</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {quests.map((q) => {
                  const date = new Date(q.created_at);
                  const answersCount = q.answers?.length ?? 0;
                  const busy = busyId === q.id;
                  return (
                    <Link
                      key={q.id}
                      href={`/quest/${q.id}`}
                      className="block group no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring rounded-md"
                      aria-label="Open quest"
                    >
                      <Card className="overflow-hidden transition-transform group-hover:-translate-y-0.5 cursor-pointer">
                        <CardHeader>
                          <CardTitle className="text-base">
                            {date.toLocaleDateString()} • {answersCount} answers
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {q.gift_url ? (
                            <img
                              src={q.gift_url}
                              alt="gift"
                              className="w-full h-40 rounded border object-cover"
                            />
                          ) : (
                            <div className="w-full h-40 rounded border bg-muted flex items-center justify-center text-muted-foreground text-sm">
                              No gift photo
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {q.tags?.map((t) => (
                              <span
                                key={t}
                                className="px-2 py-0.5 text-xs rounded-full border bg-muted"
                                title={t}
                              >
                                {t}
                              </span>
                            ))}
                          </div>

                          {/* Одна кнопка удаления: удаляет gift из Storage и запись квеста (вместе с ответами) */}
                          <div className="flex gap-2">
                            <Button
                              variant="destructive"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteQuest(q);
                              }}
                              disabled={busy}
                            >
                              {busy ? "Deleting..." : "Delete"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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
