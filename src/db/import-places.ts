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
const FAILED_CSV_PATH = path.resolve(
  __dirname,
  "../../public/failed-imports.csv",
);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function appendToFailedCsv(places: { title: string; reason: string }[]) {
  if (places.length === 0) return;

  const exists = fs.existsSync(FAILED_CSV_PATH);
  const lines = places.map(
    (p) => `"${(p.title || "").replace(/"/g, '""')}",${p.reason},"","",""`,
  );

  if (!exists) {
    const header = "Title,Reason,URL,Tags,Comment";
    fs.writeFileSync(FAILED_CSV_PATH, [header, ...lines].join("\n"), "utf-8");
  } else {
    fs.appendFileSync(FAILED_CSV_PATH, "\n" + lines.join("\n"), "utf-8");
  }
}

async function main() {
  const isFresh = process.argv.includes("--fresh");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool, { schema });

  // ── Phase 1: Google Places enrichment ──────────────────────────────

  console.log("=== Phase 1: Google Places Import ===\n");

  if (isFresh) {
    console.log("--fresh flag: wiping existing data...");
    await db.delete(schema.placeCategories);
    await db.delete(schema.places);
    await db.delete(schema.categories);
    console.log("Cleared existing places and categories.\n");
  }

  // Build a set of existing place titles for duplicate detection
  const existingPlaces = await db.query.places.findMany({
    columns: { id: true, title: true, googlePlaceId: true },
  });
  const existingTitles = new Set(
    existingPlaces.map((p) => p.title.toLowerCase()),
  );
  const existingGoogleIds = new Set(
    existingPlaces.filter((p) => p.googlePlaceId).map((p) => p.googlePlaceId!),
  );
  console.log(`${existingPlaces.length} places already in database\n`);

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
  let skipped = 0;
  let failed = 0;
  const failedRows: string[][] = [];
  const skippedRows: { title: string; reason: string }[] = [];
  // Track imported places for Phase 2
  const importedPlaces: PlaceForCategorization[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const title = row[0].trim();
    const note = (row[1] || "").trim();
    const url = (row[2] || "").trim();
    const comment = (row[4] || "").trim();

    if (!title) continue;

    // Skip duplicates (by title match)
    if (existingTitles.has(title.toLowerCase())) {
      skipped++;
      skippedRows.push({ title, reason: "duplicate-title" });
      if ((i + 1) % 100 === 0 || i === dataRows.length - 1) {
        console.log(
          `[${i + 1}/${dataRows.length}] Imported: ${imported} | Skipped: ${skipped} | Failed: ${failed}`,
        );
      }
      continue;
    }

    try {
      const place = await searchPlace(title);

      if (!place || !place.location) {
        console.warn(`  No results for: "${title}"`);
        failed++;
        failedRows.push(row);
        await sleep(DELAY_MS);
        continue;
      }

      // Also skip if Google Place ID already exists
      if (place.id && existingGoogleIds.has(place.id)) {
        skipped++;
        skippedRows.push({ title, reason: "duplicate-google-id" });
        existingTitles.add(title.toLowerCase());
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
          googlePhotoRefs: place.photos?.map((p) => p.name) || null,
          openingHours: place.regularOpeningHours?.periods
            ? {
                periods: place.regularOpeningHours.periods,
                weekdayDescriptions:
                  place.regularOpeningHours.weekdayDescriptions ?? [],
              }
            : null,
          businessStatus: place.businessStatus || null,
          googleRating: place.rating ?? null,
          googleReviewCount: place.userRatingCount ?? null,
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

      // Track the new place so we don't re-import if CSV has duplicates
      existingTitles.add(title.toLowerCase());
      if (place.id) existingGoogleIds.add(place.id);

      imported++;
    } catch (err) {
      console.error(`  Error for "${title}":`, err);
      failed++;
      failedRows.push(row);
    }

    if ((i + 1) % 50 === 0 || i === dataRows.length - 1) {
      console.log(
        `[${i + 1}/${dataRows.length}] Imported: ${imported} | Skipped: ${skipped} | Failed: ${failed}`,
      );
    }

    await sleep(DELAY_MS);
  }

  console.log(
    `\nPhase 1 complete: ${imported} new, ${skipped} skipped (existing), ${failed} failed\n`,
  );

  if (failedRows.length > 0) {
    // Write failed-imports.csv (overwrite — this is the start of a fresh import)
    const header = "Title,Reason,URL,Tags,Comment";
    const csvLines = failedRows.map((row) => {
      const title = (row[0] || "").replace(/"/g, '""');
      const url = (row[2] || "").replace(/"/g, '""');
      const tags = (row[3] || "").replace(/"/g, '""');
      const comment = (row[4] || "").replace(/"/g, '""');
      return `"${title}",google-not-found,"${url}","${tags}","${comment}"`;
    });
    const failedCsv = [header, ...csvLines].join("\n");
    fs.writeFileSync(FAILED_CSV_PATH, failedCsv, "utf-8");
    console.log(
      `${failedRows.length} failed places written to: ${FAILED_CSV_PATH}\n`,
    );
  }

  if (skippedRows.length > 0) {
    appendToFailedCsv(skippedRows);
    console.log(
      `${skippedRows.length} skipped places appended to: ${FAILED_CSV_PATH}\n`,
    );
  }

  // ── Phase 2: AI categorization (only for NEW places) ────────────────

  console.log("=== Phase 2: AI Categorization ===\n");

  if (importedPlaces.length === 0) {
    console.log("No new places to categorize.");
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
  let removedNonJapan = 0;
  const nonJapanPlaces: string[] = [];
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

        // Skip non-Japan places — delete from DB (cascade deletes category links)
        if (!result.japan) {
          await db
            .delete(schema.places)
            .where(eq(schema.places.id, place.dbId));
          removedNonJapan++;
          nonJapanPlaces.push(place.title);
          console.log(`  REMOVED (non-Japan): ${place.title}`);
          continue;
        }

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

        // Update city/ward/neighborhood
        if (result.city || result.ward || result.neighborhood) {
          await db
            .update(schema.places)
            .set({
              city: result.city,
              ward: result.ward,
              neighborhood: result.neighborhood,
            })
            .where(eq(schema.places.id, place.dbId));
        }

        categorized++;
      }
    } catch (err) {
      console.error(`  AI batch ${b + 1} failed:`, err);
      failed += batch.length;
      appendToFailedCsv(
        batch.map((p) => ({ title: p.title, reason: "ai-batch-failed" })),
      );
    }

    console.log(
      `[Batch ${b + 1}/${totalBatches}] Categorized: ${categorized}/${importedPlaces.length}`,
    );
  }

  console.log("\n=== Import Complete ===");
  console.log(`Places imported:      ${imported}`);
  console.log(`Places skipped:       ${skipped}`);
  console.log(`Places failed:        ${failed}`);
  console.log(`Places categorized:   ${categorized}`);
  console.log(`Non-Japan removed:    ${removedNonJapan}`);
  console.log(`New categories:       ${newCategoriesCreated}`);
  console.log(`Category assignments: ${totalAssignments}`);

  if (nonJapanPlaces.length > 0) {
    appendToFailedCsv(
      nonJapanPlaces.map((title) => ({ title, reason: "non-japan" })),
    );
    console.log(
      `\n${nonJapanPlaces.length} non-Japan places appended to: ${FAILED_CSV_PATH}`,
    );
    console.log(`Removed non-Japan places:\n  ${nonJapanPlaces.join("\n  ")}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
