const SEARCH_FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.location,places.photos,places.googleMapsUri,places.types,places.regularOpeningHours,places.businessStatus,places.rating,places.userRatingCount";

const DETAILS_FIELD_MASK =
  "regularOpeningHours,photos,businessStatus,rating,userRatingCount,reviews";

export interface PlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  photos?: Array<{ name: string }>;
  googleMapsUri?: string;
  types?: string[];
  regularOpeningHours?: {
    openNow?: boolean;
    periods?: Array<{
      open: { day: number; hour: number; minute: number };
      close?: { day: number; hour: number; minute: number };
    }>;
    weekdayDescriptions?: string[];
  };
  businessStatus?: "OPERATIONAL" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY";
  rating?: number;
  userRatingCount?: number;
  reviews?: Array<{
    name: string;
    relativePublishTimeDescription: string;
    rating: number;
    text?: { text: string; languageCode: string };
    originalText?: { text: string; languageCode: string };
    authorAttribution: {
      displayName: string;
      uri: string;
      photoUri: string;
    };
    publishTime: string;
  }>;
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
        "X-Goog-FieldMask": SEARCH_FIELD_MASK,
        Referer: "http://localhost:3000",
      },
      body: JSON.stringify({
        textQuery: query,
        locationRestriction: {
          rectangle: {
            low: { latitude: 24.0, longitude: 122.0 },
            high: { latitude: 46.0, longitude: 146.0 },
          },
        },
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places API error ${res.status}: ${text}`);
  }

  const data: { places?: PlaceResult[] } = await res.json();
  return data.places?.[0] ?? null;
}

export async function getPlaceDetails(
  googlePlaceId: string,
): Promise<PlaceResult | null> {
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${googlePlaceId}`,
    {
      headers: {
        "X-Goog-Api-Key": getApiKey(),
        "X-Goog-FieldMask": DETAILS_FIELD_MASK,
        Referer: "http://localhost:3000",
      },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(`Place Details API error ${res.status}: ${text}`);
    return null;
  }

  return res.json();
}
