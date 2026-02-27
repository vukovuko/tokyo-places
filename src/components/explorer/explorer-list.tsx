"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Check, Navigation } from "lucide-react";
import { getContrastColor } from "@/lib/utils";
import { formatDistance } from "@/lib/geo";
import { OpenClosedBadge } from "@/components/open-closed-badge";
import type { OpeningHoursData } from "@/lib/opening-hours";

interface Place {
  id: number;
  title: string;
  description: string | null;
  address: string | null;
  visited: boolean;
  rating: number | null;
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

interface ExplorerListProps {
  places: Place[];
  onPlaceSelect: (id: number) => void;
  distances: Map<number, number> | null;
}

export function ExplorerList({
  places,
  onPlaceSelect,
  distances,
}: ExplorerListProps) {
  if (places.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No places match your filters.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((place) => (
          <Card
            key={place.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => onPlaceSelect(place.id)}
          >
            <CardContent className="p-4">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-medium leading-tight">{place.title}</h3>
                {place.visited && (
                  <Check className="ml-2 h-4 w-4 shrink-0 text-green-600" />
                )}
              </div>

              {place.address && (
                <p className="mb-1 flex items-start gap-1 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                  {place.address}
                </p>
              )}
              {distances?.has(place.id) && (
                <p className="mb-1 flex items-center gap-1 text-xs text-blue-600">
                  <Navigation className="h-3 w-3 shrink-0" />
                  {formatDistance(distances.get(place.id)!)} away
                </p>
              )}

              <div className="mb-2">
                <OpenClosedBadge
                  openingHours={place.openingHours}
                  businessStatus={place.businessStatus}
                  size="sm"
                />
              </div>

              {place.description && (
                <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                  {place.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {place.placeCategories.map((pc) => (
                    <Badge
                      key={pc.categoryId}
                      className="text-xs"
                      style={{
                        backgroundColor: pc.category.color,
                        color: getContrastColor(pc.category.color),
                      }}
                    >
                      {pc.category.name}
                    </Badge>
                  ))}
                </div>
                {place.rating && (
                  <div className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs">{place.rating}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
