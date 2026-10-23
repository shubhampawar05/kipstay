import type { Metadata } from "next";
import { HomeFeed } from "@/components/home/home-feed";

export const metadata: Metadata = { title: "Homes" };

export default function HomesPage() {
  return <HomeFeed view="homes" />;
}
