"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";
import Image from "next/image";
import { GENDER_OPTIONS, LANGUAGE_OPTIONS } from "@/types";

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

type Profile = {
  username: string | null;
  photo_url: string | null;
  age?: number | null;
  gender?: string | null;
  languages?: string | null;
  looking_for?: string | null;
  about?: string | null;
  city_id?: string | null;
  instagram?: string | null;
  telegram?: string | null;
  whatsapp?: string | null;
  cities?: { id: string; name: string; country: string } | null;
};

export default function User() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const isOwner = !!user?.id && user.id === id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [quests, setQuests] = useState<QuestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actId, setActId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [knowledge, setKnowledge] = useState<number>(0);

  // маппинги для человекочитаемых меток
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

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);

      const [{ data: prof }, { data: qs, error: qErr }] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            `
          username, photo_url, age, gender, languages, looking_for, about, city_id,
          instagram, telegram, whatsapp,
          cities:city_id ( id, name, country )
        `
          )
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("quests")
          .select("id, created_at, tags, gift_url, gift_path, answers")
          .eq("user_id", id)
          .order("created_at", { ascending: false }),
      ]);

      if (!mounted) return;
      if (qErr) setError(qErr.message);
      setProfile((prof as any) ?? null);
      setQuests((qs as QuestRow[]) ?? []);
      setLoading(false);

      // ← знание пары считаем только когда знаем обоих юзеров
      if (user?.id && id) {
        const a = user.id < id ? user.id : (id as string);
        const b = user.id < id ? (id as string) : user.id;
        const { data: pair } = await supabase
          .from("pair_scores")
          .select("score")
          .eq("user_low", a)
          .eq("user_high", b)
          .maybeSingle();
        if (mounted) setKnowledge((pair?.score as number) ?? 0);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, user?.id]);

  const removeGift = async (q: QuestRow) => {
    if (!q.gift_url) return;
    setActId(q.id);
    setError(null);
    try {
      if (q.gift_path) {
        await supabase.storage.from("gifts").remove([q.gift_path]);
      }
      const { error: updErr } = await supabase
        .from("quests")
        .update({ gift_path: null, gift_url: null })
        .eq("id", q.id);
      if (updErr) throw updErr;

      setQuests((prev) =>
        prev.map((it) =>
          it.id === q.id ? { ...it, gift_path: null, gift_url: null } : it
        )
      );
    } catch (e: any) {
      setError(e.message || "Failed to remove gift");
    } finally {
      setActId(null);
    }
  };

  const deleteQuest = async (q: QuestRow) => {
    if (!confirm("Delete this quest? This cannot be undone.")) return;
    setActId(q.id);
    setError(null);
    try {
      // best-effort: удалить фото если есть
      if (q.gift_path) {
        try {
          await supabase.storage.from("gifts").remove([q.gift_path]);
        } catch {}
      }
      const { error: delErr } = await supabase
        .from("quests")
        .delete()
        .eq("id", q.id);
      if (delErr) throw delErr;

      setQuests((prev) => prev.filter((it) => it.id !== q.id));
    } catch (e: any) {
      setError(e.message || "Failed to delete quest");
    } finally {
      setActId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 mb-10 px-4 sm:px-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">
          {profile?.username ? `${profile.username}'s quests` : "User quests"}
        </h1>
        {user?.id && user.id !== id && (
          <div className="text-sm text-muted-foreground">
            Knowledge score: {knowledge}/100
          </div>
        )}
      </div>

      {/* Summary профиля (контакты ниже и под замком) */}
      {!loading && profile && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
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
                <FieldRow label="Username" value={profile.username ?? "—"} />
                <FieldRow label="Age" value={profile.age ?? "—"} />
                <FieldRow
                  label="Gender"
                  value={
                    GENDER_MAP.get(profile.gender ?? "") ??
                    profile.gender ??
                    "—"
                  }
                />
                <FieldRow
                  label="City"
                  value={
                    profile.cities
                      ? `${profile.cities.name}, ${profile.cities.country}`
                      : "—"
                  }
                />
                <FieldRow
                  label="Languages"
                  className="sm:col-span-2"
                  value={
                    (profile.languages ?? "")
                      .split(",")
                      .map((s) => s.trim().toLowerCase())
                      .filter(Boolean)
                      .map((c) => LANG_MAP.get(c) ?? c)
                      .join(", ") || "—"
                  }
                />
                <FieldRow
                  label="Looking for"
                  className="sm:col-span-2"
                  value={
                    (profile.looking_for ?? "")
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((g) => GENDER_MAP.get(g) ?? g)
                      .join(", ") || "—"
                  }
                />
                {profile.about && (
                  <div className="sm:col-span-2">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      About
                    </div>
                    <div className="rounded-md border bg-background p-3 whitespace-pre-wrap">
                      {profile.about}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts — видны только при 100/100 */}
      {user?.id && user.id !== id && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              {knowledge >= 100 ? (
                profile?.instagram || profile?.telegram || profile?.whatsapp ? (
                  <ul className="space-y-1 text-sm">
                    {profile?.instagram && (
                      <li>
                        Instagram:{" "}
                        <a
                          href={profile.instagram!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {profile.instagram}
                        </a>
                      </li>
                    )}
                    {profile?.telegram && (
                      <li>
                        Telegram:{" "}
                        <a
                          href={profile.telegram!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {profile.telegram}
                        </a>
                      </li>
                    )}
                    {profile?.whatsapp && (
                      <li>
                        WhatsApp:{" "}
                        <a
                          href={profile.whatsapp!}
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
                  <div className="text-muted-foreground text-sm">
                    No contacts
                  </div>
                )
              ) : (
                <div className="text-muted-foreground text-sm">
                  Locked. Reach 100 to unlock contacts.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {error && <div className="mb-4 text-sm text-red-500">{error}</div>}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 w-1/3 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-24 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : quests.length === 0 ? (
        <div className="text-muted-foreground">No quests yet</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {quests.map((q) => {
            const date = new Date(q.created_at);
            const answersCount = q.answers?.length ?? 0;
            const busy = actId === q.id;

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

                    {isOwner && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeGift(q);
                          }}
                          disabled={busy || !q.gift_url}
                        >
                          {busy && q.gift_url ? "Removing..." : "Remove gift"}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteQuest(q);
                          }}
                          disabled={busy}
                        >
                          {busy ? "Deleting..." : "Delete quest"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// вспомогательный ряд для полей
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
      <div className="text-sm font-medium text-muted-foreground mb-1">
        {label}
      </div>
      <div className="rounded-md border bg-background p-3">{value ?? "—"}</div>
    </div>
  );
}
