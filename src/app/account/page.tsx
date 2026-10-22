import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const links = [
    { href: "/trips", label: "Trips" },
    { href: "/wishlists", label: "Wishlists" },
    { href: "/host", label: user.isHost ? "Host dashboard" : "Become a host" },
    { href: "/help", label: "Help & safety" },
  ];
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
      <div className="mt-6 flex items-center gap-4 rounded-2xl border p-4">
        <span className="grid size-14 place-items-center rounded-full bg-foreground text-xl font-semibold text-background" aria-hidden>
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <ul className="mt-6 divide-y rounded-2xl border">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="flex items-center justify-between px-4 py-4 hover:bg-muted">
              {l.label} <ChevronRight className="size-4" />
            </Link>
          </li>
        ))}
      </ul>
      <form action={logout} className="mt-6">
        <Button type="submit" variant="outline" className="w-full">
          Log out
        </Button>
      </form>
    </div>
  );
}
