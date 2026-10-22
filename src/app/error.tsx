"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState icon={TriangleAlert} title="Something went wrong" action={<Button onClick={reset}>Try again</Button>}>
      We couldn&apos;t load this page. If it keeps happening, check that the database is running.
      {error.digest && <span className="mt-2 block font-mono text-xs">Error ID: {error.digest}</span>}
    </EmptyState>
  );
}
