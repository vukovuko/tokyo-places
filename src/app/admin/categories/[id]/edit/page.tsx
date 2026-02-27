import { notFound } from "next/navigation";
import { getCategoryById } from "@/db/queries/categories";
import { CategoryForm } from "@/components/admin/categories/category-form";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await getCategoryById(Number(id));

  if (!category) {
    notFound();
  }

  return (
    <CategoryForm
      title={category.name}
      cancelHref="/admin/categories"
      defaultValues={category}
    />
  );
}
