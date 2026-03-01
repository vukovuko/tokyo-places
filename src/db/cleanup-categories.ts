import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, sql } from "drizzle-orm";
import * as schema from "./schema";

/**
 * One-time cleanup: rename/fix bad AI-generated category names.
 * No API calls — just direct DB updates. Zero cost.
 */

// Renames: old name → new name
const RENAMES: Record<string, { name: string; slug: string }> = {
  "Seafood Burger": { name: "Seafood", slug: "seafood" },
};

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool, { schema });

  console.log("=== Category Cleanup ===\n");

  // --- Renames ---
  for (const [oldName, newVal] of Object.entries(RENAMES)) {
    const existing = await db.query.categories.findFirst({
      where: eq(schema.categories.name, oldName),
    });
    if (!existing) {
      console.log(`  SKIP: "${oldName}" not found`);
      continue;
    }

    // Check if target name already exists (would cause a conflict)
    const target = await db.query.categories.findFirst({
      where: eq(schema.categories.name, newVal.name),
    });

    if (target) {
      // Target exists — merge: move all place links from old to new, then delete old
      const moved = await db.execute(sql`
        INSERT INTO place_categories (place_id, category_id)
        SELECT place_id, ${target.id}
        FROM place_categories
        WHERE category_id = ${existing.id}
        ON CONFLICT DO NOTHING
      `);
      await db
        .delete(schema.categories)
        .where(eq(schema.categories.id, existing.id));
      console.log(
        `  MERGED: "${oldName}" (id=${existing.id}) → "${newVal.name}" (id=${target.id})`,
      );
    } else {
      // No conflict — just rename
      await db
        .update(schema.categories)
        .set({ name: newVal.name, slug: newVal.slug })
        .where(eq(schema.categories.id, existing.id));
      console.log(`  RENAMED: "${oldName}" → "${newVal.name}"`);
    }
  }

  // --- Report unused categories (0 places) ---
  const allCats = await db.query.categories.findMany();
  const counts = await db.execute(sql`
    SELECT category_id, COUNT(*) as cnt
    FROM place_categories
    GROUP BY category_id
  `);
  const countMap = new Map<number, number>();
  for (const row of counts.rows) {
    countMap.set(row.category_id as number, Number(row.cnt));
  }

  const unused = allCats.filter((c) => !countMap.has(c.id));
  if (unused.length > 0) {
    console.log(`\nUnused categories (0 places assigned):`);
    for (const c of unused) {
      console.log(`  - ${c.name} (${c.slug})`);
    }
  }

  // --- Show all categories with counts ---
  console.log(`\nAll categories with place counts:`);
  const sorted = allCats
    .map((c) => ({ ...c, count: countMap.get(c.id) || 0 }))
    .sort((a, b) => b.count - a.count);
  for (const c of sorted) {
    console.log(`  ${c.count.toString().padStart(4)} | ${c.name}`);
  }

  console.log(`\nDone!`);
  await pool.end();
}

main().catch(console.error);
