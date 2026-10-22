import Link from "next/link";
import { MapPinOff } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <EmptyState
      icon={MapPinOff}
      title="We can't find that page"
      action={
        <Link href="/" className={buttonVariants()}>
          Back to home
        </Link>
      }
    >
      The stay or page you&apos;re looking for may have been removed or unpublished.
    </EmptyState>
  );
}
