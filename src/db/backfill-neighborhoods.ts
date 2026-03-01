import fs from "node:fs";
import path from "node:path";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { and, isNotNull, isNull, eq } from "drizzle-orm";
import * as schema from "./schema";
import {
  categorizeBatch,
  type PlaceForCategorization,
} from "../lib/categorize";

const AI_BATCH_SIZE = 25;
const FAILED_CSV_PATH = path.resolve(
  __dirname,
  "../../public/failed-imports.csv",
);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function appendToFailedCsv(
  places: { title: string; address: string | null }[],
  reason: string,
) {
  if (places.length === 0) return;

  const exists = fs.existsSync(FAILED_CSV_PATH);
  const lines = places.map(
    (p) => `"${(p.title || "").replace(/"/g, '""')}",${reason},"","",""`,
  );

  if (!exists) {
    const header = "Title,Reason,URL,Tags,Comment";
    fs.writeFileSync(FAILED_CSV_PATH, [header, ...lines].join("\n"), "utf-8");
  } else {
    fs.appendFileSync(FAILED_CSV_PATH, "\n" + lines.join("\n"), "utf-8");
  }
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool, { schema });

  // Only process places that have an address AND are missing city (the essential field).
  // Ward and neighborhood are nice-to-have — many places legitimately don't have them.
  const allPlaces = await db.query.places.findMany({
    where: and(isNotNull(schema.places.address), isNull(schema.places.city)),
    columns: {
      id: true,
      title: true,
      address: true,
      city: true,
      ward: true,
      neighborhood: true,
    },
  });

  console.log(`Found ${allPlaces.length} places with missing city\n`);

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
  const skippedPlaces: { title: string; address: string | null }[] = [];
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

        // Only fill in fields that are currently NULL — never overwrite existing data
        const updateData: Record<string, unknown> = {};
        if (!place.city && result.city) updateData.city = result.city;
        if (!place.ward && result.ward) updateData.ward = result.ward;
        if (!place.neighborhood && result.neighborhood)
          updateData.neighborhood = result.neighborhood;

        if (Object.keys(updateData).length > 0) {
          updateData.updatedAt = new Date();
          await db
            .update(schema.places)
            .set(updateData)
            .where(eq(schema.places.id, place.id));
          updated++;
        }

        // Only consider it a failure if city is STILL null — ward/neighborhood being null is fine
        if (!place.city && !result.city) {
          skipped++;
          skippedPlaces.push({ title: place.title, address: place.address });
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

  // Append skipped places to failed-imports.csv
  if (skippedPlaces.length > 0) {
    appendToFailedCsv(skippedPlaces, "skipped-neighborhood");
    console.log(
      `\n${skippedPlaces.length} skipped places appended to: ${FAILED_CSV_PATH}`,
    );
  }

  await pool.end();
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
