import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Feature Board — CreatorMint" };

export default function BuyerRoadmapPage() {
  redirect("/roadmap");
}
