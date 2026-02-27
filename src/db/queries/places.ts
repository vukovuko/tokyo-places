import { db } from "@/db";
import { places, placeCategories, categories } from "@/db/schema";
import {
  and,
  eq,
  ilike,
  inArray,
  isNotNull,
  asc,
  desc,
  count,
  sql,
} from "drizzle-orm";

export type PlaceWithCategories = Awaited<
  ReturnType<typeof getPlaces>
>["data"][number];

interface GetPlacesOptions {
  search?: string;
  categoryIds?: string[];
  visited?: string;
  source?: string;
  city?: string;
  ward?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export async function getPlaces(options: GetPlacesOptions = {}) {
  const {
    search,
    categoryIds = [],
    visited,
    source,
    city,
    ward,
    sort = "createdAt",
    order = "desc",
    page = 1,
    perPage = 20,
  } = options;

  // Build WHERE conditions
  const conditions = [];

  if (search) {
    conditions.push(
      sql`(${ilike(places.title, `%${search}%`)} OR ${ilike(places.address, `%${search}%`)})`,
    );
  }

  if (visited === "true") {
    conditions.push(eq(places.visited, true));
  } else if (visited === "false") {
    conditions.push(eq(places.visited, false));
  }

  if (source) {
    conditions.push(eq(places.source, source));
  }

  if (city) {
    conditions.push(eq(places.city, city));
  }

  if (ward) {
    conditions.push(eq(places.ward, ward));
  }

  if (categoryIds.length > 0) {
    const numericIds = categoryIds.map(Number);
    const placesWithCategories = db
      .selectDistinct({ placeId: placeCategories.placeId })
      .from(placeCategories)
      .where(inArray(placeCategories.categoryId, numericIds));
    conditions.push(inArray(places.id, placesWithCategories));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Count
  const [{ total }] = await db
    .select({ total: count() })
    .from(places)
    .where(where);

  // Sortable columns mapping
  const sortColumnsMap = {
    title: places.title,
    address: places.address,
    visited: places.visited,
    rating: places.rating,
    source: places.source,
    createdAt: places.createdAt,
  } as unknown as Record<string, typeof places.createdAt>;

  const sortColumn = sortColumnsMap[sort] || places.createdAt;
  const orderFn = order === "asc" ? asc : desc;

  const data = await db.query.places.findMany({
    where,
    with: {
      placeCategories: {
        with: { category: true },
      },
    },
    orderBy: orderFn(sortColumn),
    limit: perPage,
    offset: (page - 1) * perPage,
  });

  return { data, total };
}

export async function getPlaceById(id: number) {
  return db.query.places.findFirst({
    where: eq(places.id, id),
    with: {
      placeCategories: {
        with: { category: true },
      },
    },
  });
}

export async function getDistinctCitiesAndWards() {
  const cities = await db
    .selectDistinct({ city: places.city })
    .from(places)
    .where(isNotNull(places.city))
    .orderBy(asc(places.city));

  const wards = await db
    .selectDistinct({ ward: places.ward })
    .from(places)
    .where(isNotNull(places.ward))
    .orderBy(asc(places.ward));

  return {
    cities: cities.map((r) => r.city!),
    wards: wards.map((r) => r.ward!),
  };
}

export async function getAllPlacesForMap() {
  return db.query.places.findMany({
    columns: {
      id: true,
      title: true,
      description: true,
      address: true,
      latitude: true,
      longitude: true,
      visited: true,
      rating: true,
      notes: true,
      googleMapsUrl: true,
      googlePhotoRef: true,
      city: true,
      ward: true,
    },
    with: {
      placeCategories: {
        with: { category: true },
      },
    },
  });
}
