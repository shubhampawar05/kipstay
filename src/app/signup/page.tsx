import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/validation";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const next = safeNextPath((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <div className="mx-auto my-10 max-w-[568px] overflow-hidden rounded-xl border border-grey-400 shadow-elev-2 sm:my-16">
      <p className="border-b border-grey-300 py-5 text-center text-base font-semibold">Log in or sign up</p>
      <div className="p-6">
      <h1 className="text-[22px] leading-[26px] font-semibold">Create your Kipstay account</h1>
      <p className="mt-1 mb-8 text-muted-foreground">One account for booking trips and hosting your own place.</p>
      <AuthForm mode="signup" next={next} />
      </div>
    </div>
  );
}
