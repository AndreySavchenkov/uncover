"use client";

import Link from "next/link";
import { NavigationMenu, NavigationMenuLink } from "../ui/navigation-menu";
import { LogoutButton } from "../logout/logout";
import { useUser } from "@/hooks/useUser";
import { useProfile } from "@/hooks/useProfile";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

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

  useEffect(() => {
    // ждём завершения проверки именно для текущего user.id
    if (userLoading || profileLoading || !checked || checkedUserId !== user?.id)
      return;

    if (!user) return;

    const noRedirectRoutes = ["/profile/create", "/login", "/register"];
    // редиректим только если точно знаем, что профиля нет (profile === null)
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
    <header className="flex items-center justify-center bg-green-600 h-14">
      <div className="container flex items-center justify-between">
        <Link href="/">Uncover</Link>

        {user && (
          <NavigationMenu>
            <NavigationMenuLink asChild>
              <Link href="/create-quiz">Create Quiz</Link>
            </NavigationMenuLink>

            <NavigationMenuLink asChild>
              <Link href="/users">People</Link>
            </NavigationMenuLink>
          </NavigationMenu>
        )}

        {user ? (
          <div>
            <Link href="/profile">Profile</Link>
            <LogoutButton />
          </div>
        ) : (
          <div>
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
          </div>
        )}
      </div>
    </header>
  );
};
