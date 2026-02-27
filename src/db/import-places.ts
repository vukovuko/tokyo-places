import fs from "node:fs";
import path from "node:path";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";
import Papa from "papaparse";
import * as schema from "./schema";
import { searchPlace } from "../lib/google-places";
import {
  categorizeBatch,
  type PlaceForCategorization,
  type NewCategory,
} from "../lib/categorize";

const DELAY_MS = 120;
const AI_BATCH_SIZE = 25;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool, { schema });

  // ── Phase 1: Google Places enrichment ──────────────────────────────

  console.log("=== Phase 1: Google Places Import ===\n");

  // Wipe existing data
  await db.delete(schema.placeCategories);
  await db.delete(schema.places);
  console.log("Cleared existing places.\n");

  // Read and parse CSV
  const csvPath = path.resolve(__dirname, "../../public/i_want_to_visit.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const { data: rows } = Papa.parse<string[]>(csvContent, {
    header: false,
    skipEmptyLines: true,
  });

  const dataRows = rows.filter(
    (row, i) => i > 0 && row[0] && row[0].trim() !== "",
  );
  console.log(`Found ${dataRows.length} places in CSV\n`);

  let imported = 0;
  let failed = 0;
  const failedRows: string[][] = [];
  // Track imported places for Phase 2
  const importedPlaces: PlaceForCategorization[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const title = row[0].trim();
    const note = (row[1] || "").trim();
    const url = (row[2] || "").trim();
    const comment = (row[4] || "").trim();

    if (!title) continue;

    try {
      const place = await searchPlace(title);

      if (!place || !place.location) {
        console.warn(`  No results for: "${title}"`);
        failed++;
        failedRows.push(row);
        await sleep(DELAY_MS);
        continue;
      }

      const [newPlace] = await db
        .insert(schema.places)
        .values({
          title,
          address: place.formattedAddress || null,
          latitude: place.location.latitude,
          longitude: place.location.longitude,
          googlePlaceId: place.id || null,
          googleMapsUrl: url || place.googleMapsUri || null,
          googlePhotoRef: place.photos?.[0]?.name || null,
          notes: note || comment || null,
          source: "csv_import",
          visited: false,
        })
        .returning({ id: schema.places.id });

      importedPlaces.push({
        dbId: newPlace.id,
        title,
        address: place.formattedAddress || null,
        types: place.types || [],
      });

      imported++;
    } catch (err) {
      console.error(`  Error for "${title}":`, err);
      failed++;
      failedRows.push(row);
    }

    if ((i + 1) % 50 === 0 || i === dataRows.length - 1) {
      console.log(
        `[${i + 1}/${dataRows.length}] Imported: ${imported} | Failed: ${failed}`,
      );
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nPhase 1 complete: ${imported} imported, ${failed} failed\n`);

  if (failedRows.length > 0) {
    const header = "Назив,Белешка,URL адреса,Ознаке,Коментар";
    const csvLines = failedRows.map((row) =>
      row.map((cell) => (cell.includes(",") ? `"${cell}"` : cell)).join(","),
    );
    const failedCsv = [header, ...csvLines].join("\n");
    const outPath = path.resolve(__dirname, "../../public/failed-imports.csv");
    fs.writeFileSync(outPath, failedCsv, "utf-8");
    console.log(`Failed places written to: ${outPath}\n`);
  }

  // ── Phase 2: AI categorization ─────────────────────────────────────

  console.log("=== Phase 2: AI Categorization ===\n");

  if (importedPlaces.length === 0) {
    console.log("No places to categorize.");
    await pool.end();
    return;
  }

  // Load existing categories
  const allCategories = await db.query.categories.findMany();
  let existingSlugs = allCategories.map((c) => c.slug);
  const slugToId = new Map(allCategories.map((c) => [c.slug, c.id]));

  let categorized = 0;
  let newCategoriesCreated = 0;
  let totalAssignments = 0;
  const totalBatches = Math.ceil(importedPlaces.length / AI_BATCH_SIZE);

  for (let b = 0; b < totalBatches; b++) {
    const batch = importedPlaces.slice(
      b * AI_BATCH_SIZE,
      (b + 1) * AI_BATCH_SIZE,
    );

    try {
      const results = await categorizeBatch(batch, existingSlugs);

      for (const result of results) {
        const place = batch[result.index - 1];
        if (!place) continue;

        // Create new categories if needed
        for (const newCat of result.newCategories) {
          if (!slugToId.has(newCat.slug)) {
            const [inserted] = await db
              .insert(schema.categories)
              .values({
                name: newCat.name,
                slug: newCat.slug,
                icon: newCat.icon,
                color: newCat.color,
              })
              .onConflictDoNothing({ target: schema.categories.slug })
              .returning();

            if (inserted) {
              slugToId.set(inserted.slug, inserted.id);
              existingSlugs.push(inserted.slug);
              newCategoriesCreated++;
              console.log(
                `  New category: ${inserted.name} (${inserted.slug})`,
              );
            }
          }
        }

        // Assign categories
        for (const slug of result.categories) {
          const catId = slugToId.get(slug);
          if (catId) {
            await db
              .insert(schema.placeCategories)
              .values({ placeId: place.dbId, categoryId: catId })
              .onConflictDoNothing();
            totalAssignments++;
          }
        }

        // Update city/ward
        if (result.city || result.ward) {
          await db
            .update(schema.places)
            .set({
              city: result.city,
              ward: result.ward,
            })
            .where(eq(schema.places.id, place.dbId));
        }

        categorized++;
      }
    } catch (err) {
      console.error(`  AI batch ${b + 1} failed:`, err);
    }

    console.log(
      `[Batch ${b + 1}/${totalBatches}] Categorized: ${categorized}/${importedPlaces.length}`,
    );
  }

  console.log("\n=== Import Complete ===");
  console.log(`Places imported:      ${imported}`);
  console.log(`Places failed:        ${failed}`);
  console.log(`Places categorized:   ${categorized}`);
  console.log(`New categories:       ${newCategoriesCreated}`);
  console.log(`Category assignments: ${totalAssignments}`);

  await pool.end();
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
