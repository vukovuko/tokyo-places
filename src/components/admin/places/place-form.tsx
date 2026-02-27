"use client";

import {
  Fragment,
  useActionState,
  useState,
  useCallback,
  useRef,
  useEffect,
  useTransition,
} from "react";
import Link from "next/link";
import {
  createPlace,
  updatePlace,
  refreshFromGoogle,
} from "@/app/admin/places/actions";
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
import { PhotoCarousel } from "@/components/photo-carousel";
import { ReviewsSection } from "@/components/reviews-section";
import { SOURCE_OPTIONS } from "@/lib/constants";
import { getContrastColor } from "@/lib/utils";
import { Star, MapPin, ExternalLink, RefreshCw } from "lucide-react";
import { OpenClosedBadge } from "@/components/open-closed-badge";
import { formatWeekdayHours, type OpeningHoursData } from "@/lib/opening-hours";

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
    source: string | null;
    city: string | null;
    ward: string | null;
    neighborhood: string | null;
    googlePhotoRef: string | null;
    googlePhotoRefs: string[] | null;
    openingHours: OpeningHoursData | null;
    businessStatus: string | null;
    googleRating: number | null;
    googleReviewCount: number | null;
    googleReviews: Array<{
      authorName: string;
      rating: number;
      text: string;
      relativeTime: string;
      publishTime: string;
    }> | null;
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
  const [selectedSource, setSelectedSource] = useState(
    defaultValues?.source || "manual",
  );
  const [isRefreshing, startRefresh] = useTransition();

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
    source: defaultValues?.source || "manual",
    city: defaultValues?.city ?? "",
    ward: defaultValues?.ward ?? "",
    neighborhood: defaultValues?.neighborhood ?? "",
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
      getVal("neighborhood") !== init.neighborhood ||
      visited !== init.visited ||
      selectedSource !== init.source ||
      JSON.stringify([...selectedCategories].sort()) !==
        JSON.stringify(init.categories);
    setIsDirty(dirty);
  }, [isEdit, visited, selectedCategories, selectedSource]);

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

          {/* Place photos */}
          {isEdit && (
            <PhotoCarousel
              photoRefs={defaultValues?.googlePhotoRefs}
              alt={defaultValues?.title ?? ""}
              className="h-56"
            />
          )}

          {/* Opening Hours + Refresh from Google */}
          {isEdit &&
            defaultValues?.googlePlaceId &&
            (() => {
              const hasHours =
                defaultValues.openingHours || defaultValues.businessStatus;
              const hours =
                formatWeekdayHours(defaultValues.openingHours) ??
                defaultValues.openingHours?.weekdayDescriptions;

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Opening Hours</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isRefreshing}
                      onClick={() =>
                        startRefresh(async () => {
                          await refreshFromGoogle(defaultValues.id);
                        })
                      }
                    >
                      <RefreshCw
                        className={`mr-1 h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
                      />
                      {isRefreshing ? "Refreshing..." : "Refresh"}
                    </Button>
                  </div>
                  <div className="rounded-md border bg-muted/50 px-3 py-2">
                    {hasHours ? (
                      <>
                        <OpenClosedBadge
                          openingHours={defaultValues.openingHours}
                          businessStatus={defaultValues.businessStatus}
                          size="sm"
                        />
                        {hours && (
                          <div className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                            {hours.map((line, i) => {
                              const colonIdx = line.indexOf(": ");
                              const day =
                                colonIdx >= 0 ? line.slice(0, colonIdx) : line;
                              const time =
                                colonIdx >= 0 ? line.slice(colonIdx + 2) : "";
                              return (
                                <Fragment key={i}>
                                  <span className="font-medium text-foreground/70">
                                    {day}
                                  </span>
                                  <span>{time}</span>
                                </Fragment>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground py-0.5">
                        No hours data — click Refresh to fetch from Google
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

          {/* Google Rating (read-only) */}
          {isEdit && defaultValues?.googleRating != null && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">
                {defaultValues.googleRating}
              </span>
              {defaultValues.googleReviewCount != null && (
                <span>
                  ({defaultValues.googleReviewCount.toLocaleString()} reviews)
                </span>
              )}
            </div>
          )}

          {/* Google Reviews (read-only) */}
          {isEdit && (
            <ReviewsSection
              reviews={defaultValues?.googleReviews}
              placeName={defaultValues?.title}
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

          {/* City / Ward / Neighborhood */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Neighborhood</Label>
              <Input
                id="neighborhood"
                name="neighborhood"
                placeholder="e.g. Harajuku"
                defaultValue={defaultValues?.neighborhood ?? ""}
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

          {/* Visited */}
          <div className="flex items-center gap-3">
            <Label htmlFor="visited-switch">Visited</Label>
            <Switch
              id="visited-switch"
              checked={visited}
              onCheckedChange={setVisited}
            />
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
            <div className="relative">
              <Input
                id="googleMapsUrl"
                name="googleMapsUrl"
                type="url"
                placeholder="https://maps.google.com/..."
                defaultValue={defaultValues?.googleMapsUrl ?? ""}
                className="pr-9"
              />
              {defaultValues?.googleMapsUrl && (
                <a
                  href={defaultValues.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
                  title="Open in Google Maps"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
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
