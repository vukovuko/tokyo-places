import { notFound } from "next/navigation";
import { getPlaceById } from "@/db/queries/places";
import { getAllCategories } from "@/db/queries/categories";
import { PlaceForm } from "@/components/admin/places/place-form";

export default async function EditPlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [place, categories] = await Promise.all([
    getPlaceById(Number(id)),
    getAllCategories(),
  ]);

  if (!place) {
    notFound();
  }

  return (
    <PlaceForm
      title={place.title}
      cancelHref="/admin/places"
      categories={categories}
      defaultValues={{
        ...place,
        categoryIds: place.placeCategories.map((pc) => pc.categoryId),
      }}
    />
  );
}
