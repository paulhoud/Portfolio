"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type SidebarNavLinkProps = {
  href: string;
  label: string;
};

export function SidebarNavLink({ href, label }: SidebarNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "group flex w-fit items-center py-1 transition-colors duration-300",
        isActive ? "text-white" : "text-white/75 hover:text-white",
      )}
    >
      <span className="flex h-px w-2.5 shrink-0 items-center justify-start">
        {!isActive ? (
          <span
            aria-hidden="true"
            className="h-px w-0 bg-white opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-2 group-hover:opacity-100"
          />
        ) : null}
      </span>
      <span
        className={cn(
          "text-sm uppercase tracking-[0.02em] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isActive
            ? "font-bold"
            : "font-medium group-hover:translate-x-2.5",
        )}
      >
        {label}
      </span>
    </Link>
  );
}
