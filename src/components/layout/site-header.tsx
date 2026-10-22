import { getCurrentUser } from "@/lib/auth";
import { unreadConversationCount } from "@/lib/messages";
import { HeaderShell } from "./header-shell";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const unread = user ? await unreadConversationCount(user.id) : 0;
  return <HeaderShell user={user ? { name: user.name, email: user.email, isHost: user.isHost, unread } : null} />;
}
