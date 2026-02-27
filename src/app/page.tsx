import { getAllPlacesForMap } from "@/db/queries/places";
import { getAllCategories } from "@/db/queries/categories";
import { Explorer } from "@/components/explorer/explorer";

export default async function HomePage() {
  const [places, categories] = await Promise.all([
    getAllPlacesForMap(),
    getAllCategories(),
  ]);

  return <Explorer places={places} categories={categories} />;
}
