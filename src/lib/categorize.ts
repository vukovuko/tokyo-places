import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface PlaceForCategorization {
  dbId: number;
  title: string;
  address: string | null;
  types: string[];
}

export interface NewCategory {
  slug: string;
  name: string;
  icon: string;
  color: string;
}

export interface CategorizationResult {
  index: number;
  categories: string[];
  city: string | null;
  ward: string | null;
  newCategories: NewCategory[];
}

const SYSTEM_PROMPT = `You categorize places for a Japan travel app. Be SPECIFIC — don't just say "restaurants". Use the right Japanese category: yakitori, shabu-shabu, tonkatsu, udon, tempura, izakaya, curry, soba, okonomiyaki, takoyaki, etc.

Be creative with non-food categories too: bookstore, otaku, manga, anime, park, station, train-station, viewpoint, shrine, temple, market, street-food, convenience-store, department-store, shopping-street, tourist-street, mall, thrift-shop, vintage, record-shop, gallery, aquarium, zoo, beach, garden, castle, tower, observation-deck, hotel, ryokan, etc.

EVERY place MUST get at least 1 category. If you're unsure, pick the closest match so the user can figure it out.

Rules:
- Assign 1-5 category slugs per place — ALWAYS at least 1
- If an existing category fits, USE IT — do not create duplicates or synonyms
- NEVER create a category that means the same thing as an existing one. No synonyms, no rewordings, no close variants. Examples of what NOT to do: "tourist-street" AND "street-tourists", "shopping-district" AND "shopping-street", "japanese-curry" AND "curry", "coffee-shop" AND "cafes". If something is close enough, use the existing one
- Freely CREATE new categories when needed — slug (lowercase-hyphenated), name, icon, color
- When you create a new category, reuse it for similar places in the same batch and in subsequent batches via the EXISTING list
- Icon must be one of: utensils, coffee, wine, beer, pizza, cake, ice-cream-cone, cup-soda, sandwich, cooking-pot, landmark, church, castle, building, trees, mountain, waves, shopping-bag, store, gem, theater, ticket, map, compass, flame, star, sparkles, heart, fish, bird, hotel, train-front, camera, globe, zap, music
- Color must be a hex color like #EF4444
- Extract city (e.g. "Tokyo", "Kyoto", "Osaka", "Yokohama") from the address
- Extract ward/district if present (e.g. "Shibuya", "Shinjuku", "Taito", "Chuo", "Minato")
- For wards: strip "City" or "区" suffix — just the name (e.g. "Shibuya City" → "Shibuya")
- If you cannot determine city/ward, use null
- Respond with JSON array ONLY — no markdown fences, no explanation`;

export async function categorizeBatch(
  places: PlaceForCategorization[],
  existingSlugs: string[],
): Promise<CategorizationResult[]> {
  const placeLines = places
    .map(
      (p, i) =>
        `${i + 1}. "${p.title}" | ${p.address || "no address"} | types: ${p.types.join(", ") || "none"}`,
    )
    .join("\n");

  const userPrompt = `EXISTING categories (use these slugs when they fit):
${existingSlugs.join(", ")}

Places:
${placeLines}

Respond with JSON array ONLY:
[{"i":1,"categories":["slug"],"city":"Tokyo","ward":"Shibuya","newCategories":[]}]`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Parse JSON — handle potential markdown fences
  const jsonStr = text
    .replace(/```json?\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  const parsed = JSON.parse(jsonStr) as Array<{
    i: number;
    categories: string[];
    city?: string | null;
    ward?: string | null;
    newCategories?: NewCategory[];
  }>;

  return parsed.map((item) => ({
    index: item.i,
    categories: item.categories,
    city: item.city ?? null,
    ward: item.ward ?? null,
    newCategories: item.newCategories ?? [],
  }));
}
