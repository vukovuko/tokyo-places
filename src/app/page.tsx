import { Suspense } from "react";
import { getAllPlacesForMap } from "@/db/queries/places";
import { getCategoriesWithCounts } from "@/db/queries/categories";
import { auth } from "@/lib/auth";
import { Explorer } from "@/components/explorer/explorer";

export default async function HomePage() {
  const [places, categories, session] = await Promise.all([
    getAllPlacesForMap(),
    getCategoriesWithCounts(),
    auth(),
  ]);

  const isAdmin = session?.user?.role === "admin";

  return (
    <Suspense>
      <Explorer places={places} categories={categories} isAdmin={isAdmin} />
    </Suspense>
  );
}
