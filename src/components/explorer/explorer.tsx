"use client";

import { useState, useMemo, useCallback } from "react";
import Fuse from "fuse.js";
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

export type Place = Awaited<ReturnType<typeof getAllPlacesForMap>>[number];
type Category = Awaited<ReturnType<typeof getCategoriesWithCounts>>[number];

export interface Filters {
  search: string;
  categoryIds: number[];
  visited: "all" | "true" | "false";
  cities: string[];
  wards: string[];
  neighborhoods: string[];
  nearMe: boolean;
}

interface ExplorerProps {
  places: Place[];
  categories: Category[];
  isAdmin?: boolean;
}

export function Explorer({ places, categories, isAdmin }: ExplorerProps) {
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
    neighborhoods: [],
    nearMe: false,
  });
  const [fitBounds, setFitBounds] = useState<{
    south: number;
    west: number;
    north: number;
    east: number;
    key: number;
  } | null>(null);
  const [resetMapKey, setResetMapKey] = useState(0);

  const handleFiltersChange = useCallback(
    (next: Filters) => {
      const prev = filters.neighborhoods;
      setFilters(next);

      if (
        next.neighborhoods.length > 0 &&
        JSON.stringify(next.neighborhoods) !== JSON.stringify(prev)
      ) {
        const matching = places.filter(
          (p) => p.neighborhood && next.neighborhoods.includes(p.neighborhood),
        );
        if (matching.length > 0) {
          let south = Infinity;
          let west = Infinity;
          let north = -Infinity;
          let east = -Infinity;
          for (const p of matching) {
            if (p.latitude < south) south = p.latitude;
            if (p.latitude > north) north = p.latitude;
            if (p.longitude < west) west = p.longitude;
            if (p.longitude > east) east = p.longitude;
          }
          setFitBounds({ south, west, north, east, key: Date.now() });
        }
      } else if (next.neighborhoods.length === 0 && prev.length > 0) {
        setFitBounds(null);
        setResetMapKey((k) => k + 1);
      }
    },
    [filters.neighborhoods, places],
  );

  const fuse = useMemo(
    () =>
      new Fuse(places, {
        keys: [
          "title",
          "address",
          "description",
          "placeCategories.category.name",
        ],
        threshold: 0.4,
      }),
    [places],
  );

  const filteredPlaces = useMemo(() => {
    // Pre-compute fuzzy match set when there's a text search
    const fuzzyMatchIds = filters.search
      ? new Set(fuse.search(filters.search).map((r) => r.item.id))
      : null;

    return places.filter((place) => {
      // Search filter (fuzzy)
      if (fuzzyMatchIds && !fuzzyMatchIds.has(place.id)) {
        return false;
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

      // Neighborhood filter
      if (
        filters.neighborhoods.length > 0 &&
        (!place.neighborhood ||
          !filters.neighborhoods.includes(place.neighborhood))
      )
        return false;

      return true;
    });
  }, [places, filters, fuse]);

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

  const { cities, wards, neighborhoods } = useMemo(() => {
    const citySet = new Set<string>();
    const wardSet = new Set<string>();
    const neighborhoodSet = new Set<string>();
    for (const p of places) {
      if (p.city) citySet.add(p.city);
      if (p.ward) wardSet.add(p.ward);
      if (p.neighborhood) neighborhoodSet.add(p.neighborhood);
    }
    return {
      cities: Array.from(citySet).sort(),
      wards: Array.from(wardSet).sort(),
      neighborhoods: Array.from(neighborhoodSet).sort(),
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
        neighborhoods={neighborhoods}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        view={view}
        onViewChange={setView}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        placeCount={filteredPlaces.length}
        totalCount={places.length}
        userPosition={userPosition}
        locationError={locationError}
        allPlaces={places}
        filteredPlaces={sortedPlaces}
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
            fitBounds={fitBounds}
            resetMapKey={resetMapKey}
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
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
