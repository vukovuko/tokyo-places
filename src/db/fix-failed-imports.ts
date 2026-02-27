import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

const PLACES = [
  {
    title: "Akimoto",
    description: "Restaurant in the Asakusa area of Tokyo",
    latitude: 35.7148,
    longitude: 139.7967,
    city: "Tokyo",
    ward: "Taito",
    googleMapsUrl:
      "https://www.google.com/maps/place/Akimoto/data=!4m2!3m1!1s0x601845c178fce0b3:0x6190464c9adddc50",
    categories: ["Restaurants"],
  },
  {
    title: "Loudia",
    description: "Restaurant in the Asakusa area of Tokyo",
    latitude: 35.7145,
    longitude: 139.796,
    city: "Tokyo",
    ward: "Taito",
    googleMapsUrl:
      "https://www.google.com/maps/place/Loudia/data=!4m2!3m1!1s0x601845a8ca0623e1:0xd9c98b195970197b",
    categories: ["Restaurants"],
  },
  {
    title: "Zeniba Seiniku",
    description:
      "Yakiniku restaurant specializing in A5 wagyu beef cooked on lava hot plates from Mt. Fuji",
    latitude: 35.626,
    longitude: 139.7234,
    city: "Tokyo",
    ward: "Shinagawa",
    googleMapsUrl:
      "https://www.google.com/maps/place/ZenibaSeiniku/data=!4m2!3m1!1s0x60188a7c6d820d89:0xcc156bbd1770f966",
    categories: ["Yakiniku", "Beef"],
  },
  {
    title: "Chokyoji",
    description: "Buddhist temple in Nishiasakusa, Taito",
    latitude: 35.7118,
    longitude: 139.7912,
    city: "Tokyo",
    ward: "Taito",
    googleMapsUrl:
      "https://www.google.com/maps/place/Chokyoji/data=!4m2!3m1!1s0x6002f043de841f53:0x7f6dcbe2cb9403f5",
    categories: ["Temples & Shrines"],
  },
  {
    title: "Joto's Old Townhouses",
    description:
      "Historic preservation district of Edo-period merchant townhouses along the old Izumo Highway, east of Tsuyama Castle",
    latitude: 35.063,
    longitude: 134.0164,
    city: "Tsuyama",
    ward: null,
    googleMapsUrl:
      "https://www.google.com/maps/place/Joto%E2%80%99s+old+townhouses/data=!4m2!3m1!1s0x35543135bb5d0b55:0xfa211e4aa9f8429b",
    categories: ["Landmark", "Scenic Views", "Walking"],
  },
  {
    title: "Suppon",
    description:
      "Tsukemen (dipping ramen) specialty restaurant near Koiwa Station",
    latitude: 35.7328,
    longitude: 139.8801,
    city: "Tokyo",
    ward: "Edogawa",
    googleMapsUrl:
      "https://www.google.com/maps/place/Suppon/data=!4m2!3m1!1s0x601885d885a0b68d:0xe8e807dc02ad3fae",
    categories: ["Ramen"],
  },
  {
    title: "Tomizawa",
    description: "Baking and confectionery ingredient retail store in Sapporo",
    latitude: 43.0687,
    longitude: 141.3508,
    city: "Sapporo",
    ward: null,
    googleMapsUrl:
      "https://www.google.com/maps/place/Tomizawa/data=!4m2!3m1!1s0x5f88da84b3b6ecef:0x8a0c30e8d27c2a20",
    categories: ["Shopping"],
  },
  {
    title: "CotoCoto",
    description:
      "Casual Western-style restaurant (yoshoku) and izakaya near Chitosefunabashi Station, known for hamburger steak",
    latitude: 35.6503,
    longitude: 139.6277,
    city: "Tokyo",
    ward: "Setagaya",
    googleMapsUrl:
      "https://www.google.com/maps/place/CotoCoto/data=!4m2!3m1!1s0x354f8519e182f0b5:0xcafe5caad3034b39",
    categories: ["Restaurants"],
  },
  {
    title: "Seiseian",
    description:
      "Urasenke-school tea ceremony classroom in central Kyoto, offering tea ceremony experiences",
    latitude: 35.0054,
    longitude: 135.7577,
    city: "Kyoto",
    ward: "Nakagyo",
    googleMapsUrl:
      "https://www.google.com/maps/place/Seiseian/data=!4m2!3m1!1s0x3544af7af9597c0d:0xbb9b4dd29a6bc01b",
    categories: ["Tea Shop"],
  },
  {
    title: "Byakushin",
    description:
      "Soba (buckwheat noodle) restaurant in Hanahata, Adachi, also serves pasta and omurice",
    latitude: 35.8011,
    longitude: 139.8195,
    city: "Tokyo",
    ward: "Adachi",
    googleMapsUrl:
      "https://www.google.com/maps/place/Byakushin/data=!4m2!3m1!1s0x601891339ac875a9:0x90b3963131e814b",
    categories: ["Soba", "Restaurants"],
  },
  {
    title: "Komatsuya Shokudo",
    description:
      "Traditional Japanese set-meal restaurant in Choshi, known for seasonal seafood dishes",
    latitude: 35.7347,
    longitude: 140.8268,
    city: "Choshi",
    ward: null,
    googleMapsUrl:
      "https://www.google.com/maps/place/%E5%B0%8F%E6%9D%BE%E5%B1%8B%E9%A3%9F%E5%A0%82/data=!4m2!3m1!1s0x601d765303b54f89:0x64fb8406c11de793",
    categories: ["Seafood", "Restaurants"],
  },
  {
    title: "FamilyMart (Sumida)",
    description: "Convenience store in Sumida ward, Tokyo",
    latitude: 35.71,
    longitude: 139.814,
    city: "Tokyo",
    ward: "Sumida",
    googleMapsUrl:
      "https://www.google.com/maps/place/FamilyMart/data=!4m2!3m1!1s0x60188cdb5f110d8f:0x4941bdb90c46b6b7",
    categories: ["Convenience Store"],
  },
  {
    title: "Soho Park",
    description:
      "Public park on the former estate of journalist Tokutomi Soho, featuring bamboo groves and a pond",
    latitude: 35.604,
    longitude: 139.718,
    city: "Tokyo",
    ward: "Ota",
    googleMapsUrl:
      "https://www.google.com/maps/place/Soh%C5%8D+Park/data=!4m2!3m1!1s0x60186027eb14f9f7:0x903eaa4525cd1636",
    categories: ["Parks & Nature", "Garden"],
  },
  {
    title: "Yoshizawa",
    description:
      "Michelin-starred Japanese restaurant (kaiseki/sukiyaki), established 1924",
    latitude: 35.672,
    longitude: 139.765,
    city: "Tokyo",
    ward: "Chuo",
    googleMapsUrl:
      "https://www.google.com/maps/place/Yoshizawa/data=!4m2!3m1!1s0x60188bdf29aec43d:0x8c7da0a1e8179f03",
    categories: ["Restaurants", "Beef"],
  },
  {
    title: "FamilyMart (Shibuya)",
    description: "Convenience store in Tokyo",
    latitude: 35.66,
    longitude: 139.7,
    city: "Tokyo",
    ward: "Shibuya",
    googleMapsUrl:
      "https://www.google.com/maps/place/FamilyMart/data=!4m2!3m1!1s0x60188c8bb31bffff:0x2371f03faface3b0",
    categories: ["Convenience Store"],
  },
  {
    title: "Courage",
    description:
      "Modern French restaurant in Azabu-Juban that transforms into a wine bar after 9 PM, Michelin-listed",
    latitude: 35.654,
    longitude: 139.737,
    city: "Tokyo",
    ward: "Minato",
    googleMapsUrl:
      "https://www.google.com/maps/place/Courage/data=!4m2!3m1!1s0x60188ec0a6117f9d:0xf7f70c091e84fa2",
    categories: ["Restaurants", "Bars"],
  },
  {
    title: "Kirara",
    description: "Izakaya (Japanese-style pub) near Shizuoka Station",
    latitude: 34.972,
    longitude: 138.389,
    city: "Shizuoka",
    ward: "Suruga",
    googleMapsUrl:
      "https://www.google.com/maps/place/Kirara/data=!4m2!3m1!1s0x6000aeccca16f215:0x9a521b8a6acae5d4",
    categories: ["Restaurants", "Bars"],
  },
  {
    title: "Manjuu",
    description:
      "Traditional Japanese manju (steamed sweet bun) shop in Yamanashi Prefecture",
    latitude: 35.37,
    longitude: 138.44,
    city: "Minobu",
    ward: null,
    googleMapsUrl:
      "https://www.google.com/maps/place/%E3%83%9E%E3%83%B3%E3%82%B8%E3%83%A5%E3%82%A6/data=!4m2!3m1!1s0x6006250068089723:0x4991a6880957179e",
    categories: ["Desserts"],
  },
  {
    title: "Aoyama",
    description:
      "Upscale neighborhood in Minato known for fashion, dining, Nezu Museum, and the Prada building",
    latitude: 35.665,
    longitude: 139.714,
    city: "Tokyo",
    ward: "Minato",
    googleMapsUrl:
      "https://www.google.com/maps/place/%D0%90%D0%BE%D1%98%D0%B0%D0%BC%D0%B0/data=!4m2!3m1!1s0x60188b62ca6eed21:0x880e44263ab0931a",
    categories: ["Landmark", "Shopping", "Walking"],
  },
  {
    title: "Meio-in",
    description: "Buddhist temple (Shingon sect) in Tokyo",
    latitude: 35.652,
    longitude: 139.739,
    city: "Tokyo",
    ward: "Minato",
    googleMapsUrl:
      "https://www.google.com/maps/place/Mei%C5%8D-in/data=!4m2!3m1!1s0x60188baefbab887d:0x357e463349dfa88d",
    categories: ["Temples & Shrines"],
  },
  {
    title: "Mita Canal Branch Intake",
    description:
      "Historical Edo-era agricultural water canal intake point, part of the Tamagawa Aqueduct system",
    latitude: 35.668,
    longitude: 139.668,
    city: "Tokyo",
    ward: "Setagaya",
    googleMapsUrl:
      "https://www.google.com/maps/place/Mita+Canal+Branch+Intake/data=!4m2!3m1!1s0x6018f31650700529:0x95082d8970ee036",
    categories: ["Landmark", "Walking"],
  },
  {
    title: "Huckleberry",
    description: "Cafe in Tsurui Village, Hokkaido",
    latitude: 43.23,
    longitude: 144.32,
    city: "Tsurui",
    ward: null,
    googleMapsUrl:
      "https://www.google.com/maps/place/Huckleberry/data=!4m2!3m1!1s0x5f8f4482acdc0765:0x40d14ad2abf308b5",
    categories: ["Cafes"],
  },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool, { schema });

  console.log("=== Fix Failed Imports: inserting 22 places ===\n");

  // Build category name -> id map
  const allCategories = await db.select().from(schema.categories);
  const catMap = new Map<string, number>();
  for (const c of allCategories) {
    catMap.set(c.name, c.id);
  }

  let inserted = 0;
  let skipped = 0;

  for (const place of PLACES) {
    // Check if already exists by googleMapsUrl
    const existing = await db.query.places.findFirst({
      where: eq(schema.places.googleMapsUrl, place.googleMapsUrl),
    });
    if (existing) {
      console.log(`  SKIP (exists): ${place.title}`);
      skipped++;
      continue;
    }

    const [newPlace] = await db
      .insert(schema.places)
      .values({
        title: place.title,
        description: place.description,
        latitude: place.latitude,
        longitude: place.longitude,
        city: place.city,
        ward: place.ward,
        googleMapsUrl: place.googleMapsUrl,
        source: "csv_import",
        visited: false,
      })
      .returning();

    // Link categories
    for (const catName of place.categories) {
      const catId = catMap.get(catName);
      if (catId) {
        await db
          .insert(schema.placeCategories)
          .values({ placeId: newPlace.id, categoryId: catId })
          .onConflictDoNothing();
      } else {
        console.log(
          `  WARNING: category "${catName}" not found for ${place.title}`,
        );
      }
    }

    console.log(`  OK: ${place.title} (${place.categories.join(", ")})`);
    inserted++;
  }

  console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}`);
  await pool.end();
}

main().catch(console.error);
