"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
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

  const GENDER_MAP = useMemo(
    () => new Map(GENDER_OPTIONS.map((o) => [o.value, o.label])),
    []
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, gender, photo_url")
        .order("username", { ascending: true })
        .limit(50);

      if (!mounted) return;
      if (error) {
        setUsers([]);
      } else {
        setUsers((data as UserCard[]) ?? []);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto mt-10 mb-10 px-4 sm:px-6">
      <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <div className="relative aspect-square w-full rounded-t-md bg-muted animate-pulse" />
                <CardContent className="p-3">
                  <div className="h-4 w-2/3 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))
          : users.length === 0
          ? Array.from({ length: 1 }).map((_, i) => (
              <div key={i} className="col-span-full text-muted-foreground">
                No users found
              </div>
            ))
          : users.map((u) => (
              <Card key={u.id} className="overflow-hidden">
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
            ))}
      </div>
    </div>
  );
}