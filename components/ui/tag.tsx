"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tagVariants = cva(
  "inline-flex items-center gap-2 rounded-full border font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      size: {
        md: "h-9 px-3 text-sm",
        lg: "h-11 px-4 text-base",
      },
      scheme: {
        default:
          "bg-secondary text-secondary-foreground border-border hover:bg-muted",

        boundaries:
          "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800 dark:hover:bg-amber-900/60",
        comfort:
          "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800 dark:hover:bg-emerald-900/60",
        communication:
          "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800 dark:hover:bg-blue-900/60",
        couples_meet:
          "bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-200 dark:bg-violet-950/40 dark:text-violet-200 dark:border-violet-800 dark:hover:bg-violet-900/60",
        drinks:
          "bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200 dark:bg-pink-950/40 dark:text-pink-200 dark:border-pink-800 dark:hover:bg-pink-900/60",
        food: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 dark:bg-orange-950/40 dark:text-orange-200 dark:border-orange-800 dark:hover:bg-orange-900/60",
        leisure:
          "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-800 dark:hover:bg-purple-900/60",
        places:
          "bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-200 dark:border-cyan-800 dark:hover:bg-cyan-900/60",
        planning:
          "bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-800 dark:hover:bg-indigo-900/60",
        romance:
          "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 hover:bg-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-200 dark:border-fuchsia-800 dark:hover:bg-fuchsia-900/60",
        safety:
          "bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800 dark:hover:bg-rose-900/60",
        values:
          "bg-lime-100 text-lime-800 border-lime-200 hover:bg-lime-200 dark:bg-lime-950/40 dark:text-lime-200 dark:border-lime-800 dark:hover:bg-lime-900/60",
      },
    },
    defaultVariants: {
      size: "lg",
      scheme: "default",
    },
  }
);

export type TagProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof tagVariants>;

export function Tag({ className, size, scheme, ...props }: TagProps) {
  return (
    <button
      type="button"
      className={cn(tagVariants({ size, scheme }), className)}
      {...props}
    />
  );
}
