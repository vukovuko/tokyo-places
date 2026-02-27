"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PlaceImage } from "@/components/place-image";
import {
  X,
  Star,
  MapPin,
  Check,
  ExternalLink,
  Navigation,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getContrastColor } from "@/lib/utils";
import { OpenClosedBadge } from "@/components/open-closed-badge";
import {
  getTodayHours,
  formatWeekdayHours,
  type OpeningHoursData,
} from "@/lib/opening-hours";

interface Place {
  id: number;
  title: string;
  description: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  visited: boolean;
  rating: number | null;
  notes: string | null;
  googleMapsUrl: string | null;
  googlePhotoRef: string | null;
  openingHours: OpeningHoursData | null;
  businessStatus: string | null;
  placeCategories: {
    categoryId: number;
    category: {
      id: number;
      name: string;
      color: string;
    };
  }[];
}

interface PlaceDetailDrawerProps {
  place: Place;
  onClose: () => void;
}

export function PlaceDetailDrawer({ place, onClose }: PlaceDetailDrawerProps) {
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;

  return (
    <div className="fixed inset-y-0 right-0 z-20 w-full max-w-sm border-l bg-background shadow-lg overflow-y-auto animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-start justify-between p-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{place.title}</h2>
          {place.address && (
            <p className="mt-1 flex items-start gap-1 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
              {place.address}
            </p>
          )}
          <OpenClosedBadge
            openingHours={place.openingHours}
            businessStatus={place.businessStatus}
          />
        </div>
        <Button variant="ghost" size="icon-xs" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Place photo */}
      {place.googlePhotoRef && (
        <PlaceImage
          photoRef={place.googlePhotoRef}
          alt={place.title}
          className="mx-4 h-48"
        />
      )}

      <Separator />

      <div className="space-y-4 p-4">
        {/* Categories */}
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
          <div className="flex items-center gap-1.5">
            {place.visited ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Visited</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Not visited</span>
            )}
          </div>
          {place.rating && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < place.rating!
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        {place.description && (
          <div>
            <p className="text-sm font-medium mb-1">Description</p>
            <p className="text-sm text-muted-foreground">{place.description}</p>
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

        <Separator />

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation className="mr-1 h-4 w-4" />
              Directions
            </a>
          </Button>
          {place.googleMapsUrl && (
            <Button variant="outline" size="sm" className="flex-1" asChild>
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
        </div>
      </div>
    </div>
  );
}
