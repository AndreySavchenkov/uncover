"use client";

import Link from "next/link";
import { NavigationMenu, NavigationMenuLink } from "../ui/navigation-menu";
import { LogoutButton } from "../logout/logout";
import { useUser } from "@/hooks/useUser";

export const Header = () => {
  const { user } = useUser();
  console.log(user)
  return (
    <header className="flex items-center justify-center bg-green-600 h-14">
      <div className="container flex items-center justify-between">
        <Link href="/">Uncover</Link>

        {user && (
          <NavigationMenu>
            <NavigationMenuLink asChild>
              <Link href="/game">Game</Link>
            </NavigationMenuLink>

            <NavigationMenuLink asChild>
              <Link href="/matches">Matches</Link>
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
