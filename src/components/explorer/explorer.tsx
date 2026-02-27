"use client";

import { useState, useMemo } from "react";
import type { getAllPlacesForMap } from "@/db/queries/places";
import type { getAllCategories } from "@/db/queries/categories";
import { ExplorerMap } from "./explorer-map";
import { ExplorerSidebar } from "./explorer-sidebar";
import { ExplorerList } from "./explorer-list";
import { PlaceDetailDrawer } from "./place-detail-drawer";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

type Place = Awaited<ReturnType<typeof getAllPlacesForMap>>[number];
type Category = Awaited<ReturnType<typeof getAllCategories>>[number];

export interface Filters {
  search: string;
  categoryIds: number[];
  visited: "all" | "true" | "false";
  cities: string[];
  wards: string[];
}

interface ExplorerProps {
  places: Place[];
  categories: Category[];
}

export function Explorer({ places, categories }: ExplorerProps) {
  const [view, setView] = useState<"map" | "list">("map");
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    categoryIds: [],
    visited: "all",
    cities: [],
    wards: [],
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
      />

      <div className="flex-1">
        {view === "map" ? (
          <ExplorerMap
            places={filteredPlaces}
            selectedPlaceId={selectedPlaceId}
            onPlaceSelect={setSelectedPlaceId}
          />
        ) : (
          <ExplorerList
            places={filteredPlaces}
            onPlaceSelect={setSelectedPlaceId}
          />
        )}
      </div>

      {selectedPlace && (
        <PlaceDetailDrawer
          place={selectedPlace}
          onClose={() => setSelectedPlaceId(null)}
        />
      )}
    </div>
  );
}
