"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PairRow = {
  user_low: string;
  user_high: string;
  score: number;
  other: {
    id: string;
    username: string | null;
    photo_url: string | null;
    gender: string | null;
  } | null;
};

export default function Home() {
  const { user } = useUser();
  const [pairs, setPairs] = useState<PairRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.id) return;
      setLoading(true);
      // берём пары и подтягиваем профиль второго участника
      const { data, error } = await supabase
        .from("pair_scores")
        .select("user_low, user_high, score")
        .or(`user_low.eq.${user.id},user_high.eq.${user.id}`)
        .order("score", { ascending: false })
        .limit(12);

      if (error || !mounted) {
        setPairs([]);
        setLoading(false);
        return;
      }

      const rows = (data || []) as Array<{
        user_low: string;
        user_high: string;
        score: number;
      }>;

      const otherIds = rows.map((r) =>
        r.user_low === user.id ? r.user_high : r.user_low
      );
      const uniq = Array.from(new Set(otherIds));
      let profiles: Record<
        string,
        {
          id: string;
          username: string | null;
          photo_url: string | null;
          gender: string | null;
        }
      > = {};
      if (uniq.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, username, photo_url, gender")
          .in("id", uniq);
        (profs || []).forEach((p: any) => {
          profiles[p.id] = {
            id: p.id,
            username: p.username,
            photo_url: p.photo_url,
            gender: p.gender,
          };
        });
      }

      setPairs(
        rows.map((r) => {
          const otherId = r.user_low === user.id ? r.user_high : r.user_low;
          return { ...r, other: profiles[otherId] || null };
        })
      );
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  if (!user)
    return (
      <div className="max-w-4xl mx-auto mt-14 mb-16 px-4 sm:px-6">
        <div className="space-y-10">
          <section className="text-center space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight">
              Grow pairs. Unlock deeper connection.
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">
              Answer curated quizzes, accept matches, build up to 100 points
              together to reveal full profiles and socials.
            </p>
            <div className="flex justify-center gap-3">
              <Button asChild>
                <Link href="/register">Get started</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </section>
          <section className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">1. Create your quiz</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Pick tags, answer prompts, add a photo. This becomes your
                challenge for others.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">2. Accept responses</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                When you like someone’s answers and photo, accept to add +25 to
                the pair.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">3. Reach 100</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                At 100 both sides unlock socials and full profile details.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Privacy first</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Nothing is shared until you confirm. You control each +25 step.
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto mt-10 mb-16 px-4 sm:px-6">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Your pairs</h1>
          <p className="text-sm text-muted-foreground">
            Accept responses to grow a pair. Reach 100 to unlock socials.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/create-quiz">Create quiz</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/users">Explore people</Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-4">
                <div className="h-14 w-14 rounded-xl bg-muted animate-pulse" />
                <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                <div className="h-2 w-full bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : pairs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No pairs yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>Create your first quiz and start accepting responses.</p>
            <Button asChild size="sm">
              <Link href="/create-quiz">Create quiz</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pairs.map((p) => {
            const o = p.other;
            return (
              <Link
                key={`${p.user_low}-${p.user_high}`}
                href={o ? `/users/${o.id}` : "#"}
                className="block group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring rounded-lg"
              >
                <Card className="overflow-hidden transition-colors hover:bg-accent/5">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-14 rounded-xl bg-muted overflow-hidden">
                        {o?.photo_url ? (
                          <img
                            src={o.photo_url}
                            alt="avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                            No photo
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {o?.username ?? "User"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Score {p.score}/100
                        </div>
                      </div>
                    </div>
                    <ProgressBar value={p.score} />
                    <div className="text-xs text-muted-foreground">
                      {p.score >= 100
                        ? "Unlocked — socials visible"
                        : `Need ${100 - p.score} more to unlock`}
                    </div>
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

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 transition-all"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}
