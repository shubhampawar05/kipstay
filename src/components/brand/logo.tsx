import Link from "next/link";
import { cn } from "@/lib/utils";

/** Kipstay mark: a tent-like roof over a crescent moon ("kip" = a short sleep). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path d="M6 22 L16 8 L26 22" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.5 15.5a4 4 0 1 0 2.8 6.3 3.2 3.2 0 1 1-2.8-6.3Z" fill="white" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 outline-none", className)} aria-label="Kipstay home">
      <LogoMark />
      <span className="hidden text-[22px] font-bold tracking-tight text-brand min-[1128px]:inline">kipstay</span>
    </Link>
  );
}
