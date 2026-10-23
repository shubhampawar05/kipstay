import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/home/coming-soon";
import { productSearchSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Services (coming soon)" };

export default async function ServicesPage({ searchParams }: PageProps<"/services">) {
  const search = productSearchSchema.parse(await searchParams);
  return <ComingSoonPage product="services" search={search} />;
}
