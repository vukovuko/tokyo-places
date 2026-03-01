import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { isNull, isNotNull } from "drizzle-orm";
import * as schema from "./schema";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool, { schema });

  // --- Summary by city: missing neighborhood ---
  const missingNeighborhood = await db.query.places.findMany({
    where: isNull(schema.places.neighborhood),
    columns: {
      id: true,
      title: true,
      address: true,
      city: true,
      ward: true,
      neighborhood: true,
    },
    orderBy: (p, { asc }) => [asc(p.city), asc(p.ward), asc(p.title)],
  });

  const neighborhoodByCity = new Map<string, typeof missingNeighborhood>();
  for (const p of missingNeighborhood) {
    const key = p.city || "(no city)";
    if (!neighborhoodByCity.has(key)) neighborhoodByCity.set(key, []);
    neighborhoodByCity.get(key)!.push(p);
  }

  console.log(
    `\n=== MISSING NEIGHBORHOOD: ${missingNeighborhood.length} total ===\n`,
  );
  console.log("By city:");
  const sortedNeighborhood = [...neighborhoodByCity.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  );
  for (const [city, places] of sortedNeighborhood) {
    console.log(`  ${places.length.toString().padStart(4)} | ${city}`);
  }

  // Show Tokyo places missing neighborhood (these are the ones worth checking)
  const tokyoMissingNeighborhood = neighborhoodByCity.get("Tokyo") || [];
  if (tokyoMissingNeighborhood.length > 0) {
    console.log(
      `\n--- Tokyo places missing neighborhood (${tokyoMissingNeighborhood.length}) ---\n`,
    );
    for (const p of tokyoMissingNeighborhood) {
      console.log(`  [${p.id}] ${p.title}`);
      console.log(
        `       Ward: ${p.ward || "—"} | Address: ${p.address || "—"}`,
      );
    }
  }

  // --- Summary by city: missing ward ---
  const missingWard = await db.query.places.findMany({
    where: isNull(schema.places.ward),
    columns: {
      id: true,
      title: true,
      address: true,
      city: true,
      ward: true,
      neighborhood: true,
    },
    orderBy: (p, { asc }) => [asc(p.city), asc(p.title)],
  });

  const wardByCity = new Map<string, typeof missingWard>();
  for (const p of missingWard) {
    const key = p.city || "(no city)";
    if (!wardByCity.has(key)) wardByCity.set(key, []);
    wardByCity.get(key)!.push(p);
  }

  console.log(`\n\n=== MISSING WARD: ${missingWard.length} total ===\n`);
  console.log("By city:");
  const sortedWard = [...wardByCity.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  );
  for (const [city, places] of sortedWard) {
    console.log(`  ${places.length.toString().padStart(4)} | ${city}`);
  }

  // Show Tokyo places missing ward (these are the real problems)
  const tokyoMissingWard = wardByCity.get("Tokyo") || [];
  if (tokyoMissingWard.length > 0) {
    console.log(
      `\n--- Tokyo places missing ward (${tokyoMissingWard.length}) ---\n`,
    );
    for (const p of tokyoMissingWard) {
      console.log(`  [${p.id}] ${p.title}`);
      console.log(
        `       Neighborhood: ${p.neighborhood || "—"} | Address: ${p.address || "—"}`,
      );
    }
  }

  await pool.end();
}

main().catch(console.error);
