"use client";

import Link from "next/link";
import { Menu, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/app/actions/auth";

type User = { name: string; email: string; isHost: boolean } | null;

export function UserMenu({ user }: { user: User }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full border px-2 py-1.5 shadow-xs transition-shadow hover:shadow-md"
        aria-label={user ? `Account menu for ${user.name}` : "Main menu"}
      >
        <Menu className="ml-1 size-4" />
        {user ? (
          <span className="grid size-8 place-items-center rounded-full bg-foreground text-sm font-semibold text-background" aria-hidden>
            {user.name.charAt(0).toUpperCase()}
          </span>
        ) : (
          <UserRound className="size-7 rounded-full bg-muted-foreground p-1 text-background" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {user ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="truncate">{user.name}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuItem render={<Link href="/trips" />}>Trips</DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/wishlists" />}>Wishlists</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/host" />}>{user.isHost ? "Host dashboard" : "Become a host"}</DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/host/listings/new" />}>Create a new listing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                void logout();
              }}
            >
              Log out
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem render={<Link href="/signup" />} className="font-semibold">
              Sign up
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/login" />}>Log in</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/host" />}>Become a host</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
