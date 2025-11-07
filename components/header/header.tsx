"use client";

import Link from "next/link";
import { LogoutButton } from "../logout/logout";
import { useUser } from "@/hooks/useUser";
import { useProfile } from "@/hooks/useProfile";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";

const NAV_ITEMS: { href: string; label: string; authOnly?: boolean }[] = [
  { href: "/create-quiz", label: "Create Quiz", authOnly: true },
  { href: "/users", label: "People", authOnly: true },
  { href: "/profile", label: "Profile", authOnly: true },
];

export const Header = () => {
  const { user, loading: userLoading } = useUser();
  const {
    profile,
    loading: profileLoading,
    checked,
    checkedUserId,
  } = useProfile();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (userLoading || profileLoading || !checked || checkedUserId !== user?.id)
      return;
    if (!user) return;
    const noRedirectRoutes = ["/profile/create", "/login", "/register"];
    if (profile === null && !noRedirectRoutes.includes(pathname)) {
      router.push("/profile/create");
    }
  }, [
    user,
    profile,
    userLoading,
    profileLoading,
    checked,
    checkedUserId,
    pathname,
    router,
  ]);

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 flex justify-center px-4",
        "backdrop-blur-xl transition-shadow",
        scrolled ? "shadow-[0_2px_6px_-1px_rgba(0,0,0,0.15)]" : ""
      )}
      style={{
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      <div
        className={clsx(
          "relative w-full max-w-6xl",
          "rounded-xl border border-white/15 dark:border-white/10",
          "bg-gradient-to-r from-white/70 to-white/55 dark:from-neutral-900/70 dark:to-neutral-900/55",
          "supports-[backdrop-filter]:bg-white/40 supports-[backdrop-filter]:dark:bg-neutral-900/40",
          "px-4 py-2",
          "flex items-center justify-between",
          "min-h-[56px]"
        )}
        style={{
          paddingTop: "calc(env(safe-area-inset-top,0px) + 8px)",
          paddingBottom: "8px",
        }}
      >
        <Link
          href="/"
          className="text-sm font-semibold tracking-wide select-none"
        >
          uncover
        </Link>

        {user && (
          <nav className="hidden md:flex gap-2">
            {NAV_ITEMS.map((i) => {
              if (i.authOnly && !user) return null;
              const active = pathname === i.href;
              return (
                <Link
                  key={i.href}
                  href={i.href}
                  className={clsx(
                    "relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "text-black dark:text-white"
                      : "text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white"
                  )}
                >
                  {i.label}
                  {active && (
                    <span className="absolute inset-0 -z-10 rounded-lg bg-white/60 dark:bg-neutral-800/60 border border-white/40 dark:border-white/10 shadow-sm" />
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-sm text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
