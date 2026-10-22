import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/brand/logo";
import { HeaderSearch } from "./header-search";
import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 md:px-6">
        <Logo className="hidden shrink-0 md:flex" />
        <div className="flex min-w-0 flex-1 justify-center md:hidden">
          <Suspense>
            <HeaderSearch variant="mobile" />
          </Suspense>
        </div>
        <div className="hidden min-w-0 flex-1 justify-center md:flex">
          <Suspense>
            <HeaderSearch variant="desktop" />
          </Suspense>
        </div>
        <nav aria-label="Account" className="hidden shrink-0 items-center gap-2 md:flex">
          <Link href="/host" className="hidden rounded-full px-4 py-2 text-sm font-medium hover:bg-muted lg:block">
            {user?.isHost ? "Switch to hosting" : "Become a host"}
          </Link>
          <UserMenu user={user} />
        </nav>
      </div>
    </header>
  );
}
