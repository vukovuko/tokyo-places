import { getCategoriesWithCounts } from "@/db/queries/categories";
import { PageHeader } from "@/components/admin/page-header";
import { CategoriesTable } from "@/components/admin/categories/categories-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts();

  return (
    <>
      <PageHeader
        title="Categories"
        actions={
          <Button asChild>
            <Link href="/admin/categories/new">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Category</span>
            </Link>
          </Button>
        }
      />
      <div className="p-4 md:p-6">
        <CategoriesTable categories={categories} />
      </div>
    </>
  );
}
