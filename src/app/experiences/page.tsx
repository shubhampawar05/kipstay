import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/home/coming-soon";
import { productSearchSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Experiences (coming soon)" };

export default async function ExperiencesPage({ searchParams }: PageProps<"/experiences">) {
  const search = productSearchSchema.parse(await searchParams);
  return <ComingSoonPage product="experiences" search={search} />;
}
