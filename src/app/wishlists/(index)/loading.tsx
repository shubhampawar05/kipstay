import { GridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <GridSkeleton />
    </div>
  );
}
