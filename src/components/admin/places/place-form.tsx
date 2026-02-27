"use client";

import {
  useActionState,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import Link from "next/link";
import { createPlace, updatePlace } from "@/app/admin/places/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox";
import { PageHeader } from "@/components/admin/page-header";
import { PlaceImage } from "@/components/place-image";
import { SOURCE_OPTIONS } from "@/lib/constants";
import { getContrastColor } from "@/lib/utils";
import { Star, MapPin, ExternalLink } from "lucide-react";

interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
}

interface PlaceFormProps {
  title: string;
  cancelHref: string;
  categories: Category[];
  defaultValues?: {
    id: number;
    title: string;
    description: string | null;
    address: string | null;
    latitude: number;
    longitude: number;
    googleMapsUrl: string | null;
    googlePlaceId: string | null;
    notes: string | null;
    visited: boolean;
    rating: number | null;
    source: string | null;
    city: string | null;
    ward: string | null;
    googlePhotoRef: string | null;
    categoryIds: number[];
  };
}

export function PlaceForm({
  title,
  cancelHref,
  categories,
  defaultValues,
}: PlaceFormProps) {
  const isEdit = !!defaultValues;
  const formRef = useRef<HTMLFormElement>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [visited, setVisited] = useState(defaultValues?.visited ?? false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    defaultValues?.categoryIds ?? [],
  );
  const [selectedRating, setSelectedRating] = useState(
    defaultValues?.rating ? String(defaultValues.rating) : "",
  );
  const [selectedSource, setSelectedSource] = useState(
    defaultValues?.source || "manual",
  );

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const gmapsUrl = defaultValues
    ? defaultValues.googleMapsUrl ||
      (defaultValues.googlePlaceId
        ? `https://www.google.com/maps/place/?q=place_id:${defaultValues.googlePlaceId}`
        : `https://www.google.com/maps/search/?api=1&query=${defaultValues.latitude},${defaultValues.longitude}`)
    : null;
  const embedQuery = defaultValues
    ? defaultValues.googlePlaceId
      ? `place_id:${defaultValues.googlePlaceId}`
      : `${defaultValues.latitude},${defaultValues.longitude}`
    : null;

  const action = defaultValues
    ? updatePlace.bind(null, defaultValues.id)
    : createPlace;

  const [state, formAction, isPending] = useActionState(action, {
    error: null as string | null,
  });

  // Store initial values for dirty comparison
  const initialValues = useRef({
    title: defaultValues?.title ?? "",
    description: defaultValues?.description ?? "",
    address: defaultValues?.address ?? "",
    latitude:
      defaultValues?.latitude != null ? String(defaultValues.latitude) : "",
    longitude:
      defaultValues?.longitude != null ? String(defaultValues.longitude) : "",
    googleMapsUrl: defaultValues?.googleMapsUrl ?? "",
    googlePlaceId: defaultValues?.googlePlaceId ?? "",
    notes: defaultValues?.notes ?? "",
    visited: defaultValues?.visited ?? false,
    categories: [...(defaultValues?.categoryIds ?? [])].sort(),
    rating: defaultValues?.rating ? String(defaultValues.rating) : "",
    source: defaultValues?.source || "manual",
    city: defaultValues?.city ?? "",
    ward: defaultValues?.ward ?? "",
  });

  const checkDirty = useCallback(() => {
    if (!formRef.current || !isEdit) return;
    const form = formRef.current;
    const getVal = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement)
        ?.value ?? "";
    const init = initialValues.current;
    const dirty =
      getVal("title") !== init.title ||
      getVal("description") !== init.description ||
      getVal("address") !== init.address ||
      getVal("latitude") !== init.latitude ||
      getVal("longitude") !== init.longitude ||
      getVal("googleMapsUrl") !== init.googleMapsUrl ||
      getVal("googlePlaceId") !== init.googlePlaceId ||
      getVal("notes") !== init.notes ||
      getVal("city") !== init.city ||
      getVal("ward") !== init.ward ||
      visited !== init.visited ||
      selectedRating !== init.rating ||
      selectedSource !== init.source ||
      JSON.stringify([...selectedCategories].sort()) !==
        JSON.stringify(init.categories);
    setIsDirty(dirty);
  }, [isEdit, visited, selectedCategories, selectedRating, selectedSource]);

  useEffect(() => {
    checkDirty();
  }, [checkDirty]);

  function toggleCategory(catId: number) {
    setSelectedCategories((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId],
    );
  }

  return (
    <form ref={formRef} action={formAction} onChange={checkDirty}>
      <PageHeader
        title={title}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={cancelHref}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isPending || (isEdit && !isDirty)}>
              {isPending
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Create Place"}
            </Button>
          </div>
        }
      />
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Hidden fields for non-standard inputs */}
          <input type="hidden" name="visited" value={String(visited)} />
          <input type="hidden" name="rating" value={selectedRating} />
          <input type="hidden" name="source" value={selectedSource} />
          {selectedCategories.map((catId) => (
            <input key={catId} type="hidden" name="categoryIds" value={catId} />
          ))}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Ichiran Ramen Shibuya"
              defaultValue={defaultValues?.title}
              required
            />
          </div>

          {/* Place photo */}
          {isEdit && defaultValues?.googlePhotoRef && (
            <PlaceImage
              photoRef={defaultValues.googlePhotoRef}
              alt={defaultValues.title}
              className="h-56"
            />
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="A brief description of this place..."
              defaultValue={defaultValues?.description ?? ""}
              rows={3}
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              placeholder="e.g. 1-22-7 Jinnan, Shibuya City, Tokyo"
              defaultValue={defaultValues?.address ?? ""}
            />
          </div>

          {/* City / Ward */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                placeholder="e.g. Tokyo"
                defaultValue={defaultValues?.city ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ward">Ward</Label>
              <Input
                id="ward"
                name="ward"
                placeholder="e.g. Shibuya"
                defaultValue={defaultValues?.ward ?? ""}
              />
            </div>
          </div>

          {/* Lat/Lng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                placeholder="35.6762"
                defaultValue={defaultValues?.latitude}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                placeholder="139.6503"
                defaultValue={defaultValues?.longitude}
                required
              />
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className="transition-opacity"
                  >
                    <Badge
                      style={
                        isSelected
                          ? {
                              backgroundColor: cat.color,
                              color: getContrastColor(cat.color),
                            }
                          : undefined
                      }
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer"
                    >
                      {cat.name}
                    </Badge>
                  </button>
                );
              })}
            </div>
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No categories yet. Create categories first.
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Personal Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Your personal notes about this place..."
              defaultValue={defaultValues?.notes ?? ""}
              rows={3}
            />
          </div>

          {/* Visited + Rating row */}
          <div className="flex items-start gap-8">
            <div className="flex items-center gap-3">
              <Label htmlFor="visited-switch">Visited</Label>
              <Switch
                id="visited-switch"
                checked={visited}
                onCheckedChange={setVisited}
              />
            </div>

            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() =>
                      setSelectedRating(
                        selectedRating === String(n) ? "" : String(n),
                      )
                    }
                    className="p-0.5"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        Number(selectedRating) >= n
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label>Source</Label>
            <div className="w-48">
              <Combobox
                items={SOURCE_OPTIONS.map((o) => o.value)}
                value={selectedSource}
                onValueChange={(val) =>
                  setSelectedSource((val as string) ?? "manual")
                }
              >
                <ComboboxInput placeholder="Select source" />
                <ComboboxContent>
                  <ComboboxList>
                    {(value) => {
                      const opt = SOURCE_OPTIONS.find((o) => o.value === value);
                      return (
                        <ComboboxItem key={value} value={value}>
                          {opt?.label ?? value}
                        </ComboboxItem>
                      );
                    }}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>

          {/* Google Maps URL */}
          <div className="space-y-2">
            <Label htmlFor="googleMapsUrl">Google Maps URL</Label>
            <Input
              id="googleMapsUrl"
              name="googleMapsUrl"
              type="url"
              placeholder="https://maps.google.com/..."
              defaultValue={defaultValues?.googleMapsUrl ?? ""}
            />
          </div>

          {/* Google Place ID */}
          <div className="space-y-2">
            <Label htmlFor="googlePlaceId">Google Place ID</Label>
            <Input
              id="googlePlaceId"
              name="googlePlaceId"
              placeholder="ChIJ..."
              defaultValue={defaultValues?.googlePlaceId ?? ""}
            />
          </div>

          {/* Map preview */}
          {isEdit && gmapsUrl && (
            <div className="space-y-2">
              <Label>Location</Label>
              <div className="group relative overflow-hidden rounded-md border">
                {apiKey ? (
                  <iframe
                    src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${embedQuery}&zoom=15`}
                    className="h-[250px] w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="flex h-[200px] items-center justify-center bg-muted">
                    <div className="text-center text-sm text-muted-foreground">
                      <MapPin className="mx-auto mb-2 h-8 w-8" />
                      <p>Click to view on Google Maps</p>
                      <p className="mt-1 text-xs">
                        Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for embedded preview
                      </p>
                    </div>
                  </div>
                )}
                <a
                  href={gmapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-end justify-end p-2"
                >
                  <span className="flex items-center gap-1 rounded bg-background/80 px-2 py-1 text-xs font-medium opacity-0 shadow transition-opacity group-hover:opacity-100">
                    <ExternalLink className="h-3 w-3" />
                    Open in Google Maps
                  </span>
                </a>
              </div>
            </div>
          )}

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
        </div>
      </div>
    </form>
  );
}
