import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

async function seedCategories() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool, { schema });

  const categoryData = [
    // Food
    {
      name: "Restaurants",
      slug: "restaurants",
      color: "#EF4444",
      icon: "utensils",
    },
    { name: "Cafes", slug: "cafes", color: "#F59E0B", icon: "coffee" },
    { name: "Fast Food", slug: "fast-food", color: "#F97316", icon: "pizza" },
    { name: "Sushi", slug: "sushi", color: "#F43F5E", icon: "fish" },
    { name: "Ramen", slug: "ramen", color: "#92400E", icon: "cooking-pot" },
    { name: "Seafood", slug: "seafood", color: "#06B6D4", icon: "waves" },
    { name: "Chicken", slug: "chicken", color: "#D946EF", icon: "flame" },
    { name: "Beef", slug: "beef", color: "#78716C", icon: "flame" },
    { name: "Burgers", slug: "burgers", color: "#EA580C", icon: "sandwich" },
    { name: "Yakiniku", slug: "yakiniku", color: "#B91C1C", icon: "flame" },
    { name: "Bakeries", slug: "bakeries", color: "#FBBF24", icon: "cake" },
    {
      name: "Desserts",
      slug: "desserts",
      color: "#F472B6",
      icon: "ice-cream-cone",
    },
    // Drinks
    { name: "Nightlife", slug: "nightlife", color: "#8B5CF6", icon: "wine" },
    { name: "Bars", slug: "bars", color: "#7C3AED", icon: "beer" },
    // Sightseeing
    {
      name: "Temples & Shrines",
      slug: "temples-shrines",
      color: "#10B981",
      icon: "landmark",
    },
    {
      name: "Parks & Nature",
      slug: "parks-nature",
      color: "#22C55E",
      icon: "trees",
    },
    {
      name: "Scenic Views",
      slug: "scenic-views",
      color: "#14B8A6",
      icon: "mountain",
    },
    { name: "Walking", slug: "walking", color: "#84CC16", icon: "map" },
    { name: "Museums", slug: "museums", color: "#3B82F6", icon: "library" },
    // Shopping
    {
      name: "Shopping",
      slug: "shopping",
      color: "#EC4899",
      icon: "shopping-bag",
    },
    {
      name: "Shopping Malls",
      slug: "shopping-malls",
      color: "#A855F7",
      icon: "store",
    },
    {
      name: "Antique Shops",
      slug: "antique-shops",
      color: "#64748B",
      icon: "gem",
    },
    // Activities
    {
      name: "Entertainment",
      slug: "entertainment",
      color: "#6366F1",
      icon: "theater",
    },
    { name: "Onsen", slug: "onsen", color: "#0EA5E9", icon: "waves" },
    { name: "Arcades", slug: "arcades", color: "#E879F9", icon: "zap" },
  ];

  let created = 0;
  for (const cat of categoryData) {
    const result = await db
      .insert(schema.categories)
      .values(cat)
      .onConflictDoNothing({ target: schema.categories.slug });
    if (result.rowCount && result.rowCount > 0) created++;
  }

  console.log(
    `Categories: ${created} created, ${categoryData.length - created} already existed`,
  );
  await pool.end();
}

seedCategories().catch((err) => {
  console.error("Category seed failed:", err);
  process.exit(1);
});
