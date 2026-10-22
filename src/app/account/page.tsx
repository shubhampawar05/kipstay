import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, CircleHelp, Heart, Home, Luggage } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { PasswordForm, ProfileForm } from "./account-forms";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const profile = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { bio: true, createdAt: true } });
  const hasListings = (await prisma.listing.count({ where: { hostId: user.id, isPublished: true } })) > 0;
  const links = [
    { href: "/trips", label: "Trips", icon: Luggage },
    { href: "/wishlists", label: "Wishlists", icon: Heart },
    { href: "/host", label: user.isHost ? "Host dashboard" : "Become a host", icon: Home },
    { href: "/help", label: "Help Centre", icon: CircleHelp },
  ];

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-10 min-[1168px]:px-0">
      <h1 className="text-[32px] leading-9 font-semibold">Account</h1>
      <p className="mt-2 text-base">
        <span className="font-semibold">{user.name}</span>, {user.email} ·{" "}
        {hasListings ? (
          <Link href={`/users/${user.id}`} className="font-semibold underline">
            Go to public profile
          </Link>
        ) : (
          <span className="text-muted-foreground">
            Member since {profile.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}
          </span>
        )}
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-10">
          <section className="rounded-2xl border border-grey-400 p-6 shadow-elev-2" aria-labelledby="personal-heading">
            <h2 id="personal-heading" className="mb-6 text-[22px] leading-[26px] font-semibold">
              Personal info
            </h2>
            <ProfileForm name={user.name} bio={profile.bio ?? ""} />
          </section>
          <section className="rounded-2xl border border-grey-400 p-6 shadow-elev-2" aria-labelledby="security-heading">
            <h2 id="security-heading" className="text-[22px] leading-[26px] font-semibold">
              Login & security
            </h2>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">Changing your password signs you out on every other device.</p>
            <PasswordForm />
          </section>
        </div>
        <aside>
          <ul className="divide-y divide-grey-300 rounded-2xl border border-grey-400">
            {links.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className="flex items-center gap-4 px-5 py-4 text-base transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-grey-100 focus-ring">
                  <Icon className="size-5" aria-hidden /> <span className="flex-1">{label}</span> <ChevronRight className="size-4" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          <form action={logout} className="mt-6">
            <Button type="submit" variant="outline" size="xl" className="w-full rounded-lg border-foreground">
              Log out
            </Button>
          </form>
        </aside>
      </div>
    </div>
  );
}
