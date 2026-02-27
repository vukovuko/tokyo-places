import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { and, isNotNull, isNull, eq } from "drizzle-orm";
import * as schema from "./schema";
import {
  categorizeBatch,
  type PlaceForCategorization,
} from "../lib/categorize";

const AI_BATCH_SIZE = 25;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool, { schema });

  const missingOnly = process.argv.includes("--missing-only");

  const conditions = [isNotNull(schema.places.address)];
  if (missingOnly) {
    conditions.push(isNull(schema.places.neighborhood));
  }

  const allPlaces = await db.query.places.findMany({
    where: and(...conditions),
    columns: { id: true, title: true, address: true },
  });

  console.log(
    `Found ${allPlaces.length} places to process${missingOnly ? " (missing neighborhood only)" : ""}\n`,
  );

  if (allPlaces.length === 0) {
    console.log("Nothing to do.");
    await pool.end();
    return;
  }

  const allCategories = await db.query.categories.findMany();
  const existingSlugs = allCategories.map((c) => c.slug);

  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const totalBatches = Math.ceil(allPlaces.length / AI_BATCH_SIZE);

  for (let b = 0; b < totalBatches; b++) {
    const batch = allPlaces.slice(b * AI_BATCH_SIZE, (b + 1) * AI_BATCH_SIZE);
    const batchInput: PlaceForCategorization[] = batch.map((p) => ({
      dbId: p.id,
      title: p.title,
      address: p.address,
      types: [],
    }));

    try {
      const results = await categorizeBatch(batchInput, existingSlugs);

      for (const result of results) {
        const place = batch[result.index - 1];
        if (!place) continue;

        const updateData: Record<string, unknown> = {};
        if (result.city) updateData.city = result.city;
        if (result.ward) updateData.ward = result.ward;
        if (result.neighborhood) updateData.neighborhood = result.neighborhood;

        if (Object.keys(updateData).length > 0) {
          updateData.updatedAt = new Date();
          await db
            .update(schema.places)
            .set(updateData)
            .where(eq(schema.places.id, place.id));
          updated++;
        } else {
          skipped++;
        }
      }
    } catch (err) {
      console.error(`  Batch ${b + 1} failed:`, err);
      failed += batch.length;
    }

    console.log(
      `[Batch ${b + 1}/${totalBatches}] Updated: ${updated} | Skipped: ${skipped} | Failed: ${failed}`,
    );

    if (b < totalBatches - 1) await sleep(500);
  }

  console.log(
    `\nBackfill complete: ${updated} updated, ${skipped} skipped, ${failed} failed`,
  );
  await pool.end();
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
