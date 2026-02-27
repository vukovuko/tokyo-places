export interface ParsedSearchParams {
  page: number;
  perPage: number;
  sort: string;
  order: "asc" | "desc";
  search: string;
  categories: string[];
  visited: string | undefined;
  source: string | undefined;
  rating: number | undefined;
  city: string | undefined;
  ward: string | undefined;
}

export function parseSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): ParsedSearchParams {
  return {
    page: Number(searchParams.page) || 1,
    perPage: Number(searchParams.perPage) || 20,
    sort: (searchParams.sort as string) || "createdAt",
    order: (searchParams.order as "asc" | "desc") || "desc",
    search: (searchParams.search as string) || "",
    categories: parseArray(searchParams.category),
    visited: searchParams.visited as string | undefined,
    source: searchParams.source as string | undefined,
    rating: searchParams.rating ? Number(searchParams.rating) : undefined,
    city: searchParams.city as string | undefined,
    ward: searchParams.ward as string | undefined,
  };
}

function parseArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function buildSearchParams(
  params: Partial<ParsedSearchParams>,
  current: URLSearchParams,
): URLSearchParams {
  const newParams = new URLSearchParams(current);

  if (params.page !== undefined) {
    if (params.page <= 1) newParams.delete("page");
    else newParams.set("page", String(params.page));
  }
  if (params.sort !== undefined) {
    newParams.set("sort", params.sort);
  }
  if (params.order !== undefined) {
    newParams.set("order", params.order);
  }
  if (params.search !== undefined) {
    if (params.search === "") newParams.delete("search");
    else newParams.set("search", params.search);
  }
  if (params.categories !== undefined) {
    newParams.delete("category");
    for (const cat of params.categories) {
      newParams.append("category", cat);
    }
  }
  if (params.visited !== undefined) {
    if (params.visited === "all" || params.visited === undefined)
      newParams.delete("visited");
    else newParams.set("visited", params.visited);
  }
  if (params.source !== undefined) {
    if (params.source === "") newParams.delete("source");
    else newParams.set("source", params.source);
  }
  if (params.rating !== undefined) {
    if (params.rating === 0) newParams.delete("rating");
    else newParams.set("rating", String(params.rating));
  }
  if (params.city !== undefined) {
    if (params.city === "") newParams.delete("city");
    else newParams.set("city", params.city);
  }
  if (params.ward !== undefined) {
    if (params.ward === "") newParams.delete("ward");
    else newParams.set("ward", params.ward);
  }

  return newParams;
}
