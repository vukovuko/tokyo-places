import { getAllCategories } from "@/db/queries/categories";
import { PlaceForm } from "@/components/admin/places/place-form";

export default async function NewPlacePage() {
  const categories = await getAllCategories();

  return (
    <PlaceForm
      title="New Place"
      cancelHref="/admin/places"
      categories={categories}
    />
  );
}
