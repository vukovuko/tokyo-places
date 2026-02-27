"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { getAllPlacesForMap } from "@/db/queries/places";
import type { getCategoriesWithCounts } from "@/db/queries/categories";
import { ExplorerMap } from "./explorer-map";
import { ExplorerSidebar } from "./explorer-sidebar";
import { ExplorerList } from "./explorer-list";
import { PlaceDetailDrawer } from "./place-detail-drawer";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useUserLocation } from "@/hooks/use-user-location";
import { haversineDistance } from "@/lib/geo";

type Place = Awaited<ReturnType<typeof getAllPlacesForMap>>[number];
type Category = Awaited<ReturnType<typeof getCategoriesWithCounts>>[number];

export interface Filters {
  search: string;
  categoryIds: number[];
  visited: "all" | "true" | "false";
  cities: string[];
  wards: string[];
  nearMe: boolean;
}

interface ExplorerProps {
  places: Place[];
  categories: Category[];
}

export function Explorer({ places, categories }: ExplorerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [view, setView] = useState<"map" | "list">("map");
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(() => {
    const param = searchParams.get("place");
    if (!param) return null;
    const id = parseInt(param, 10);
    return !isNaN(id) && places.some((p) => p.id === id) ? id : null;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [panKey, setPanKey] = useState(0);

  const panTarget = useMemo(() => {
    if (!selectedPlaceId || panKey === 0) return null;
    const p = places.find((pl) => pl.id === selectedPlaceId);
    if (!p) return null;
    return { lat: p.latitude, lng: p.longitude, key: panKey };
  }, [selectedPlaceId, panKey, places]);
  const {
    position: userPosition,
    heading: userHeading,
    error: locationError,
  } = useUserLocation();
  const [filters, setFilters] = useState<Filters>({
    search: "",
    categoryIds: [],
    visited: "all",
    cities: [],
    wards: [],
    nearMe: false,
  });

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      // Search filter
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !place.title.toLowerCase().includes(q) &&
          !(place.address || "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      // Category filter
      if (filters.categoryIds.length > 0) {
        const placeCatIds = place.placeCategories.map((pc) => pc.categoryId);
        if (!filters.categoryIds.some((id) => placeCatIds.includes(id))) {
          return false;
        }
      }

      // Visited filter
      if (filters.visited === "true" && !place.visited) return false;
      if (filters.visited === "false" && place.visited) return false;

      // City filter
      if (
        filters.cities.length > 0 &&
        (!place.city || !filters.cities.includes(place.city))
      )
        return false;

      // Ward filter
      if (
        filters.wards.length > 0 &&
        (!place.ward || !filters.wards.includes(place.ward))
      )
        return false;

      return true;
    });
  }, [places, filters]);

  const distanceMap = useMemo(() => {
    if (!userPosition) return null;
    const map = new Map<number, number>();
    for (const p of filteredPlaces) {
      map.set(
        p.id,
        haversineDistance(
          userPosition.lat,
          userPosition.lng,
          p.latitude,
          p.longitude,
        ),
      );
    }
    return map;
  }, [filteredPlaces, userPosition]);

  const sortedPlaces = useMemo(() => {
    if (!filters.nearMe || !distanceMap) return filteredPlaces;
    return [...filteredPlaces].sort(
      (a, b) => (distanceMap.get(a.id) ?? 0) - (distanceMap.get(b.id) ?? 0),
    );
  }, [filteredPlaces, filters.nearMe, distanceMap]);

  const { cities, wards } = useMemo(() => {
    const citySet = new Set<string>();
    const wardSet = new Set<string>();
    for (const p of places) {
      if (p.city) citySet.add(p.city);
      if (p.ward) wardSet.add(p.ward);
    }
    return {
      cities: Array.from(citySet).sort(),
      wards: Array.from(wardSet).sort(),
    };
  }, [places]);

  const selectPlace = useCallback(
    (id: number | null) => {
      setSelectedPlaceId(id);
      const url = id ? `/?place=${id}` : "/";
      router.replace(url, { scroll: false });
    },
    [router],
  );

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) || null;

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      {/* Mobile menu button */}
      {!sidebarOpen && !selectedPlace && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 left-4 z-30 md:hidden shadow-lg"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      <ExplorerSidebar
        categories={categories}
        cities={cities}
        wards={wards}
        filters={filters}
        onFiltersChange={setFilters}
        view={view}
        onViewChange={setView}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        placeCount={filteredPlaces.length}
        totalCount={places.length}
        userPosition={userPosition}
        locationError={locationError}
        allPlaces={places}
        onPlaceSelect={(id: number) => {
          selectPlace(id);
          setSidebarOpen(false);
        }}
      />

      <div className="flex-1">
        {view === "map" ? (
          <ExplorerMap
            places={sortedPlaces}
            selectedPlaceId={selectedPlaceId}
            onPlaceSelect={selectPlace}
            userPosition={userPosition}
            userHeading={userHeading}
            locationError={locationError}
            panTarget={panTarget}
          />
        ) : (
          <ExplorerList
            places={sortedPlaces}
            onPlaceSelect={selectPlace}
            distances={filters.nearMe ? distanceMap : null}
          />
        )}
      </div>

      {selectedPlace && (
        <PlaceDetailDrawer
          place={selectedPlace}
          onClose={() => selectPlace(null)}
          onShowOnMap={() => {
            if (view !== "map") setView("map");
            setPanKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
