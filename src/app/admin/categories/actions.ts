"use server";

import { db } from "@/db";
import { categories, placeCategories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function createCategory(
  _prevState: { error: string | null },
  formData: FormData,
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const name = formData.get("name") as string;
  const color = formData.get("color") as string;
  const icon = formData.get("icon") as string;

  if (!name || !color || !icon) {
    return { error: "All fields are required" };
  }

  try {
    await db.insert(categories).values({
      name,
      slug: slugify(name),
      color,
      icon,
    });
  } catch {
    return { error: "A category with this name already exists" };
  }

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(
  id: number,
  _prevState: { error: string | null },
  formData: FormData,
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const name = formData.get("name") as string;
  const color = formData.get("color") as string;
  const icon = formData.get("icon") as string;

  if (!name || !color || !icon) {
    return { error: "All fields are required" };
  }

  try {
    await db
      .update(categories)
      .set({
        name,
        slug: slugify(name),
        color,
        icon,
      })
      .where(eq(categories.id, id));
  } catch {
    return { error: "A category with this name already exists" };
  }

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategory(id: number) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  // Delete junction entries first (cascade should handle this, but be explicit)
  await db.delete(placeCategories).where(eq(placeCategories.categoryId, id));
  await db.delete(categories).where(eq(categories.id, id));

  revalidatePath("/admin/categories");
}
