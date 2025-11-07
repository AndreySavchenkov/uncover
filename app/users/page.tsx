"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GENDER_OPTIONS } from "@/types";

type UserCard = {
  id: string;
  username: string | null;
  gender: string | null;
  photo_url: string | null;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const GENDER_MAP = useMemo(
    () => new Map(GENDER_OPTIONS.map((o) => [o.value, o.label])),
    []
  );

  const PAGE_SIZE = 24;

  const loadPage = async (p: number) => {
    p === 0 ? setLoading(true) : setLoadingMore(true);
    try {
      const from = p * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, gender, photo_url")
        .order("username", { ascending: true })
        .range(from, to);

      if (error) throw error;

      const chunk = (data as UserCard[]) ?? [];
      setHasMore(chunk.length === PAGE_SIZE);

      if (p === 0) {
        setUsers(chunk);
      } else {
        setUsers((prev) => {
          const map = new Map(prev.map((u) => [u.id, u]));
          chunk.forEach((u) => map.set(u.id, u));
          return Array.from(map.values());
        });
      }
      setPage(p);
    } catch {
      if (p === 0) setUsers([]);
      setHasMore(false);
    } finally {
      p === 0 ? setLoading(false) : setLoadingMore(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await loadPage(0);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto mt-10 mb-10 px-4 sm:px-6">
      <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <div className="relative aspect-square w-full rounded-t-md bg-muted animate-pulse" />
              <CardContent className="p-3">
                <div className="h-4 w-2/3 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))
        ) : users.length === 0 ? (
          Array.from({ length: 1 }).map((_, i) => (
            <div key={i} className="col-span-full text-muted-foreground">
              No users found
            </div>
          ))
        ) : (
          <>
            {users.map((u) => (
              <Link
                key={u.id}
                href={`/users/${u.id}`}
                className="block group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring rounded-md"
                aria-label={`Open ${u.username ?? "user"} profile`}
              >
                <Card className="overflow-hidden transition-transform group-hover:-translate-y-0.5">
                  <div className="relative aspect-square w-full bg-muted">
                    {u.photo_url ? (
                      <Image
                        src={u.photo_url}
                        alt={`${u.username ?? "User"} photo`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        No photo
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <div className="text-sm font-medium truncate">
                      {u.username ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {GENDER_MAP.get(u.gender ?? "") ?? u.gender ?? "—"}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}

            {hasMore && (
              <div className="col-span-full flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => loadPage(page + 1)}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
