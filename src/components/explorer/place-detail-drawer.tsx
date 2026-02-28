"use client";

import { useState, useTransition, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhotoCarousel } from "@/components/photo-carousel";
import {
  X,
  Star,
  MapPin,
  Check,
  ExternalLink,
  Navigation,
  ChevronDown,
  ChevronUp,
  Share2,
  MapIcon,
} from "lucide-react";
import { getContrastColor } from "@/lib/utils";
import { OpenClosedBadge } from "@/components/open-closed-badge";
import { getTodayHours, formatWeekdayHours } from "@/lib/opening-hours";
import { ReviewsSection } from "@/components/reviews-section";
import { toggleVisited } from "@/app/admin/places/actions";
import type { Place } from "./explorer";

interface PlaceDetailDrawerProps {
  place: Place;
  onClose: () => void;
  onShowOnMap?: () => void;
  isAdmin?: boolean;
}

export function PlaceDetailDrawer({
  place,
  onClose,
  onShowOnMap,
  isAdmin,
}: PlaceDetailDrawerProps) {
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [optimisticVisited, setOptimisticVisited] = useState(place.visited);
  const [isToggling, startToggle] = useTransition();

  // Reset when a different place is opened
  useEffect(() => {
    setOptimisticVisited(place.visited);
  }, [place.id, place.visited]);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;

  return (
    <>
      {/* Backdrop — blocks touch events from reaching the map */}
      <div
        className="fixed inset-0 z-19 bg-black/20 md:bg-transparent md:pointer-events-none"
        onClick={onClose}
        onTouchMove={(e) => e.preventDefault()}
      />
      <div className="fixed inset-y-0 right-0 z-20 w-full max-w-sm border-l bg-background shadow-lg flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header — sticky top */}
        <div className="shrink-0 border-b bg-background px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold truncate">{place.title}</h2>
            <Button
              variant="ghost"
              size="icon-xs"
              className="shrink-0 ml-2"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {place.placeCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {place.placeCategories.map((pc) => (
                <Badge
                  key={pc.categoryId}
                  style={{
                    backgroundColor: pc.category.color,
                    color: getContrastColor(pc.category.color),
                  }}
                >
                  {pc.category.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Address + status */}
          <div className="px-4 py-3">
            {place.address && (
              <p className="flex items-start gap-1 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                {place.address}
              </p>
            )}
            <OpenClosedBadge
              openingHours={place.openingHours}
              businessStatus={place.businessStatus}
            />
          </div>

          {/* Place photos */}
          <PhotoCarousel
            photoRefs={place.googlePhotoRefs}
            alt={place.title}
            className="mx-4 h-48"
          />

          <div className="space-y-4 p-4">
            {/* Rating + Reviews */}
            {place.googleRating != null && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {place.googleRating}
                {place.googleReviewCount != null && (
                  <span>
                    ({place.googleReviewCount.toLocaleString()} reviews)
                  </span>
                )}
              </p>
            )}
            <ReviewsSection
              reviews={place.googleReviews}
              placeName={place.title}
            />

            {/* Opening hours — collapsible */}
            {place.openingHours?.periods &&
              (() => {
                const todayHours = getTodayHours(place.openingHours);
                const allHours = formatWeekdayHours(place.openingHours);

                return (
                  <div>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between text-left"
                      onClick={() => setHoursExpanded((v) => !v)}
                    >
                      <span className="text-sm text-muted-foreground">
                        {todayHours || "Hours"}
                      </span>
                      {allHours &&
                        (hoursExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        ))}
                    </button>
                    {hoursExpanded && allHours && (
                      <div className="mt-2 space-y-0.5">
                        {allHours.map((line, i) => (
                          <p key={i} className="text-sm text-muted-foreground">
                            {line}
                          </p>
                        ))}
                        <p className="mt-1 text-xs text-muted-foreground/60 italic">
                          Hours may vary on holidays
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

            {/* Status row */}
            <div className="flex items-center gap-4">
              {isAdmin ? (
                <button
                  type="button"
                  disabled={isToggling}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 -mx-2 -my-1 transition-colors hover:bg-accent disabled:opacity-50"
                  onClick={() => {
                    const next = !optimisticVisited;
                    setOptimisticVisited(next);
                    startToggle(async () => {
                      try {
                        await toggleVisited(place.id, next);
                      } catch {
                        setOptimisticVisited(!next);
                      }
                    });
                  }}
                >
                  {optimisticVisited ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        Visited
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Not visited
                    </span>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  {optimisticVisited ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Visited</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Not visited
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            {place.description && (
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm text-muted-foreground">
                  {place.description}
                </p>
              </div>
            )}

            {/* Notes */}
            {place.notes && (
              <div>
                <p className="text-sm font-medium mb-1">Notes</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {place.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons — sticky bottom */}
        <div className="shrink-0 border-t bg-background p-3">
          <div className="grid grid-cols-2 gap-2">
            {onShowOnMap && (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950"
                onClick={onShowOnMap}
              >
                <MapIcon className="mr-1 h-4 w-4" />
                Show on Map
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
              asChild
            >
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                <Navigation className="mr-1 h-4 w-4" />
                Directions
              </a>
            </Button>
            {place.googleMapsUrl && (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-red-200 text-red-500 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                asChild
              >
                <a
                  href={place.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-1 h-4 w-4" />
                  Google Maps
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950"
              onClick={() => {
                const url = `${window.location.origin}/?place=${place.id}`;
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              <Share2 className="mr-1 h-4 w-4" />
              {copied ? "Copied!" : "Share"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
