"use client";

import Link from "next/link";

export const Footer = () => {
  return (
    <footer
      className="mt-10 px-4 pb-6 pt-4 flex justify-center"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 16px)" }}
    >
      <div
        className="w-full max-w-6xl rounded-xl border border-white/15 dark:border-white/10
                   bg-gradient-to-r from-white/70 to-white/55 dark:from-neutral-900/70 dark:to-neutral-900/55
                   backdrop-blur-xl px-4 py-3 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400"
      >
        <div className="flex items-center gap-2">
          <span>&copy; {new Date().getFullYear()} uncover</span>
          <span className="hidden sm:inline">All rights reserved.</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/users"
            className="hover:text-black dark:hover:text-white transition"
          >
            People
          </Link>
          <Link
            href="/create-quiz"
            className="hover:text-black dark:hover:text-white transition"
          >
            Create
          </Link>
          <Link
            href="/profile"
            className="hover:text-black dark:hover:text-white transition"
          >
            Profile
          </Link>
        </div>
      </div>
    </footer>
  );
};
