import { db } from "@/db";
import { categories, placeCategories } from "@/db/schema";
import { eq, count, asc } from "drizzle-orm";

export type CategoryWithCount = Awaited<
  ReturnType<typeof getCategoriesWithCounts>
>[number];

export async function getAllCategories() {
  return db.query.categories.findMany({
    orderBy: asc(categories.name),
  });
}

export async function getCategoriesWithCounts() {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      color: categories.color,
      icon: categories.icon,
      createdAt: categories.createdAt,
      placeCount: count(placeCategories.placeId),
    })
    .from(categories)
    .leftJoin(placeCategories, eq(categories.id, placeCategories.categoryId))
    .groupBy(categories.id)
    .orderBy(asc(categories.name));
}

export async function getCategoryById(id: number) {
  return db.query.categories.findFirst({
    where: eq(categories.id, id),
  });
}
