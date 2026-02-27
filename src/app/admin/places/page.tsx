import { getPlaces, getDistinctCitiesAndWards } from "@/db/queries/places";
import { getAllCategories } from "@/db/queries/categories";
import { parseSearchParams } from "@/lib/search-params";
import { PageHeader } from "@/components/admin/page-header";
import { PlacesToolbar } from "@/components/admin/places/places-toolbar";
import { PlacesTable } from "@/components/admin/places/places-table";
import { Pagination } from "@/components/admin/pagination";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function PlacesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseSearchParams(await searchParams);
  const [{ data: placesData, total }, allCategories, { cities, wards }] =
    await Promise.all([
      getPlaces({
        search: params.search,
        categoryIds: params.categories,
        visited: params.visited,
        source: params.source,
        rating: params.rating,
        city: params.city,
        ward: params.ward,
        sort: params.sort,
        order: params.order,
        page: params.page,
        perPage: params.perPage,
      }),
      getAllCategories(),
      getDistinctCitiesAndWards(),
    ]);

  return (
    <>
      <PageHeader
        title="Places"
        actions={
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href="/admin/places/new">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Place</span>
              </Link>
            </Button>
          </div>
        }
      />
      <div className="space-y-4 p-4 md:p-6">
        <PlacesToolbar
          categories={allCategories}
          cities={cities}
          wards={wards}
        />
        <PlacesTable places={placesData} categories={allCategories} />
        <Pagination page={params.page} perPage={params.perPage} total={total} />
      </div>
    </>
  );
}
