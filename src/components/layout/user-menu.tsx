"use client";

import Link from "next/link";
import { CircleHelp, Heart, Home, Luggage, Menu, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/app/actions/auth";

export type MenuUser = { name: string; email: string; isHost: boolean } | null;

// Reference icon buttons: 40px grey circles, transform press feedback (250ms standard easing).
const circle =
  "grid size-10 place-items-center rounded-full bg-grey-200 text-foreground transition-[background-color,transform] duration-250 ease-standard hover:bg-grey-300 active:scale-[0.92] focus-ring";
const item = "rounded-none px-4 py-2.5 text-sm leading-[18px] focus:bg-grey-100";

export function UserMenu({ user }: { user: MenuUser }) {
  return (
    <div className="flex items-center gap-2">
      <Link href={user ? "/account" : "/login"} className={circle} aria-label={user ? `Profile: ${user.name}` : "Log in"}>
        {user ? (
          <span className="grid size-8 place-items-center rounded-full bg-foreground text-sm font-semibold text-background">
            {user.name.charAt(0).toUpperCase()}
          </span>
        ) : (
          <UserRound className="size-5" />
        )}
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger className={circle} aria-label={user ? `Account menu for ${user.name}` : "Main menu"}>
          <Menu className="size-4" strokeWidth={2.5} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={10}
          className="w-64 rounded-2xl py-2 shadow-elev-3 ring-0 data-open:animate-[kip-panel-in_200ms_var(--ease-standard)]"
        >
          {user ? (
            <>
              <DropdownMenuItem className={item} render={<Link href="/wishlists" />}>
                <Heart /> Wishlists
              </DropdownMenuItem>
              <DropdownMenuItem className={item} render={<Link href="/trips" />}>
                <Luggage /> Trips
              </DropdownMenuItem>
              <DropdownMenuItem className={item} render={<Link href="/account" />}>
                <UserRound /> Profile & account
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem className={item} render={<Link href="/host" />}>
                <Home /> {user.isHost ? "Host dashboard" : "Become a host"}
              </DropdownMenuItem>
              <DropdownMenuItem className={item} render={<Link href="/host/listings/new" />}>
                Create a new listing
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem className={item} render={<Link href="/help" />}>
                <CircleHelp /> Help Centre
              </DropdownMenuItem>
              <DropdownMenuItem
                className={item}
                onClick={() => {
                  void logout();
                }}
              >
                Log out
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem className={item} render={<Link href="/help" />}>
                <CircleHelp /> Help Centre
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem className="items-start rounded-none px-4 py-3 focus:bg-grey-100" render={<Link href="/host" />}>
                <span>
                  <span className="block text-sm font-medium">Become a host</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">It&apos;s easy to start hosting and earn extra income.</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem className={item} render={<Link href="/login" />}>
                Log in or sign up
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
