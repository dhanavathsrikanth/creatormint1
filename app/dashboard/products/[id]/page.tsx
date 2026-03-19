import { redirect } from "next/navigation";

/** Canonical edit URL is /dashboard/products/[id]/edit */
export default async function ProductPageRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/products/${id}/edit`);
}
