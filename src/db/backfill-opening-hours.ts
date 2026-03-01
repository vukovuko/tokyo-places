import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { and, isNotNull, isNull, eq } from "drizzle-orm";
import * as schema from "./schema";
import { getPlaceDetails } from "../lib/google-places";

const DELAY_MS = 150;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool, { schema });

  // Only fetch details for places that don't already have reviews
  // (searchPlace already gets hours, photos, rating — reviews are the main thing it misses)
  const placesToUpdate = await db.query.places.findMany({
    where: and(
      isNotNull(schema.places.googlePlaceId),
      isNull(schema.places.googleReviews),
    ),
    columns: { id: true, title: true, googlePlaceId: true },
  });

  console.log(`Found ${placesToUpdate.length} places with Google Place IDs\n`);

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < placesToUpdate.length; i++) {
    const place = placesToUpdate[i];

    try {
      const details = await getPlaceDetails(place.googlePlaceId!);

      if (!details) {
        console.warn(`  No details for: ${place.title}`);
        failed++;
        await sleep(DELAY_MS);
        continue;
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      let hasUpdate = false;

      if (details.regularOpeningHours?.periods) {
        updateData.openingHours = {
          periods: details.regularOpeningHours.periods,
          weekdayDescriptions:
            details.regularOpeningHours.weekdayDescriptions ?? [],
        };
        hasUpdate = true;
      }

      if (details.businessStatus) {
        updateData.businessStatus = details.businessStatus;
        hasUpdate = true;
      }

      if (details.photos?.length) {
        updateData.googlePhotoRefs = details.photos.map((p) => p.name);
        updateData.googlePhotoRef = details.photos[0].name;
        hasUpdate = true;
      }

      if (details.rating != null) {
        updateData.googleRating = details.rating;
        hasUpdate = true;
      }

      if (details.userRatingCount != null) {
        updateData.googleReviewCount = details.userRatingCount;
        hasUpdate = true;
      }

      if (details.reviews?.length) {
        updateData.googleReviews = details.reviews.map((r) => ({
          authorName: r.authorAttribution.displayName,
          rating: r.rating,
          text: r.text?.text || r.originalText?.text || "",
          relativeTime: r.relativePublishTimeDescription,
          publishTime: r.publishTime,
        }));
        hasUpdate = true;
      }

      if (hasUpdate) {
        await db
          .update(schema.places)
          .set(updateData)
          .where(eq(schema.places.id, place.id));
        updated++;
        console.log(`  OK: ${place.title}`);
      } else {
        skipped++;
        console.log(`  SKIP (no data): ${place.title}`);
      }
    } catch (err) {
      console.error(`  ERROR: ${place.title}:`, err);
      failed++;
    }

    if ((i + 1) % 25 === 0 || i === placesToUpdate.length - 1) {
      console.log(
        `\n[${i + 1}/${placesToUpdate.length}] Updated: ${updated} | Failed: ${failed} | Skipped: ${skipped}\n`,
      );
    }

    await sleep(DELAY_MS);
  }

  console.log(
    `\nBackfill complete: ${updated} updated, ${failed} failed, ${skipped} skipped`,
  );
  await pool.end();
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
