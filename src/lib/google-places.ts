const FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.location,places.photos,places.googleMapsUri,places.types";

export interface PlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  photos?: Array<{ name: string }>;
  googleMapsUri?: string;
  types?: string[];
}

function getApiKey(): string {
  const key =
    process.env.GOOGLE_MAPS_SERVER_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error(
      "No Google Maps API key found. Set GOOGLE_MAPS_SERVER_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.",
    );
  }
  return key;
}

export async function searchPlace(query: string): Promise<PlaceResult | null> {
  const res = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": getApiKey(),
        "X-Goog-FieldMask": FIELD_MASK,
        Referer: "http://localhost:3000",
      },
      body: JSON.stringify({ textQuery: query }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places API error ${res.status}: ${text}`);
  }

  const data: { places?: PlaceResult[] } = await res.json();
  return data.places?.[0] ?? null;
}
