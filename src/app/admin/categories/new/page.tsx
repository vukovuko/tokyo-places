import { CategoryForm } from "@/components/admin/categories/category-form";

export default function NewCategoryPage() {
  return <CategoryForm title="New Category" cancelHref="/admin/categories" />;
}
