"use server";

import { db } from "@/db";
import { places, placeCategories } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createPlace(
  _prevState: { error: string | null },
  formData: FormData,
) {
  await requireAdmin();

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const address = (formData.get("address") as string) || null;
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const googleMapsUrl = (formData.get("googleMapsUrl") as string) || null;
  const googlePlaceId = (formData.get("googlePlaceId") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const visited = formData.get("visited") === "true";
  const ratingStr = formData.get("rating") as string;
  const rating = ratingStr ? Number(ratingStr) : null;
  const source = (formData.get("source") as string) || "manual";
  const city = (formData.get("city") as string) || null;
  const ward = (formData.get("ward") as string) || null;
  const categoryIds = formData.getAll("categoryIds").map(Number);

  if (!title) return { error: "Title is required" };
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return { error: "Valid latitude and longitude are required" };
  }

  const [newPlace] = await db
    .insert(places)
    .values({
      title,
      description,
      address,
      latitude,
      longitude,
      googleMapsUrl,
      googlePlaceId,
      notes,
      visited,
      rating,
      source,
      city,
      ward,
    })
    .returning();

  if (categoryIds.length > 0) {
    await db.insert(placeCategories).values(
      categoryIds.map((catId) => ({
        placeId: newPlace.id,
        categoryId: catId,
      })),
    );
  }

  revalidatePath("/admin/places");
  redirect("/admin/places");
}

export async function updatePlace(
  id: number,
  _prevState: { error: string | null },
  formData: FormData,
) {
  await requireAdmin();

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const address = (formData.get("address") as string) || null;
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const googleMapsUrl = (formData.get("googleMapsUrl") as string) || null;
  const googlePlaceId = (formData.get("googlePlaceId") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const visited = formData.get("visited") === "true";
  const ratingStr = formData.get("rating") as string;
  const rating = ratingStr ? Number(ratingStr) : null;
  const city = (formData.get("city") as string) || null;
  const ward = (formData.get("ward") as string) || null;
  const categoryIds = formData.getAll("categoryIds").map(Number);

  if (!title) return { error: "Title is required" };
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return { error: "Valid latitude and longitude are required" };
  }

  await db
    .update(places)
    .set({
      title,
      description,
      address,
      latitude,
      longitude,
      googleMapsUrl,
      googlePlaceId,
      notes,
      visited,
      rating,
      city,
      ward,
      updatedAt: new Date(),
    })
    .where(eq(places.id, id));

  // Update categories: delete all existing, insert new
  await db.delete(placeCategories).where(eq(placeCategories.placeId, id));
  if (categoryIds.length > 0) {
    await db.insert(placeCategories).values(
      categoryIds.map((catId) => ({
        placeId: id,
        categoryId: catId,
      })),
    );
  }

  revalidatePath("/admin/places");
  redirect("/admin/places");
}

export async function deletePlace(id: number) {
  await requireAdmin();
  await db.delete(placeCategories).where(eq(placeCategories.placeId, id));
  await db.delete(places).where(eq(places.id, id));
  revalidatePath("/admin/places");
}

export async function deletePlaces(ids: number[]) {
  await requireAdmin();
  await db.delete(placeCategories).where(inArray(placeCategories.placeId, ids));
  await db.delete(places).where(inArray(places.id, ids));
  revalidatePath("/admin/places");
}

export async function bulkSetCategories(
  placeIds: number[],
  categoryIds: number[],
) {
  await requireAdmin();

  // Add categories to selected places (don't remove existing ones)
  for (const placeId of placeIds) {
    for (const categoryId of categoryIds) {
      await db
        .insert(placeCategories)
        .values({ placeId, categoryId })
        .onConflictDoNothing();
    }
  }

  revalidatePath("/admin/places");
}

export async function bulkSetVisited(placeIds: number[], visited: boolean) {
  await requireAdmin();
  await db
    .update(places)
    .set({ visited, updatedAt: new Date() })
    .where(inArray(places.id, placeIds));
  revalidatePath("/admin/places");
}
