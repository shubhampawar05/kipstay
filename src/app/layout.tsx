import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { HistoryTracker } from "@/components/layout/history-tracker";
import { getCurrentUser } from "@/lib/auth";
import { unreadConversationCount } from "@/lib/messages";
import "./globals.css";

// Open-source geometric sans close to the reference's proprietary face.
const figtree = Figtree({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: { default: "Kipstay · Stays worth the trip", template: "%s · Kipstay" },
  description: "Find and book cabins, villas, lofts and beach houses around the world.",
};

export const viewport: Viewport = { themeColor: "#0f766e" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={`${figtree.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:p-2">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <MobileNav signedIn={!!user} unread={user ? await unreadConversationCount(user.id) : 0} />
        <HistoryTracker />
        <Toaster
          position="bottom-center"
          toastOptions={{ classNames: { toast: "!rounded-xl !border-grey-300 !bg-background !text-sm !font-medium !text-foreground !shadow-elev-3" } }}
        />
      </body>
    </html>
  );
}
