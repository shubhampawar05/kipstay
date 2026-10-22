import { getCurrentUser } from "@/lib/auth";
import { HeaderShell } from "./header-shell";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return <HeaderShell user={user ? { name: user.name, email: user.email, isHost: user.isHost } : null} />;
}
