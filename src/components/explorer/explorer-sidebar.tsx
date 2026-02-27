"use client";

import * as React from "react";
import { useMemo, useState, useRef } from "react";
import Fuse from "fuse.js";
import type { Filters } from "./explorer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Map, List, Search, MapPin } from "lucide-react";
import { getContrastColor } from "@/lib/utils";

interface Category {
  id: number;
  name: string;
  color: string;
  placeCount: number;
}

interface SearchPlace {
  id: number;
  title: string;
  address: string | null;
}

interface ExplorerSidebarProps {
  categories: Category[];
  cities: string[];
  wards: string[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  view: "map" | "list";
  onViewChange: (view: "map" | "list") => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeCount: number;
  totalCount: number;
  userPosition: { lat: number; lng: number } | null;
  locationError: string | null;
  allPlaces: SearchPlace[];
  onPlaceSelect: (id: number) => void;
}

function MultiSelectLocation({
  items,
  value,
  onValueChange,
  placeholder,
}: {
  items: string[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder: string;
}) {
  const anchor = useComboboxAnchor();

  return (
    <Combobox
      multiple
      autoHighlight
      items={items}
      value={value}
      onValueChange={onValueChange}
    >
      <ComboboxChips ref={anchor} className="w-full">
        <ComboboxValue>
          {(values) => (
            <React.Fragment>
              {(values as string[]).map((v) => (
                <ComboboxChip key={v}>{v}</ComboboxChip>
              ))}
              <ComboboxChipsInput
                placeholder={value.length === 0 ? placeholder : ""}
              />
            </React.Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No matches.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function SidebarContent({
  categories,
  cities,
  wards,
  filters,
  onFiltersChange,
  view,
  onViewChange,
  placeCount,
  totalCount,
  userPosition,
  locationError,
  allPlaces,
  onPlaceSelect,
}: Omit<ExplorerSidebarProps, "open" | "onOpenChange">) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fuse = useMemo(
    () =>
      new Fuse(allPlaces, {
        keys: ["title", "address"],
        threshold: 0.4,
      }),
    [allPlaces],
  );

  const suggestions = useMemo(() => {
    if (!filters.search) return [];
    return fuse.search(filters.search, { limit: 8 }).map((r) => r.item);
  }, [fuse, filters.search]);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggleCategory(catId: number) {
    const current = filters.categoryIds;
    const next = current.includes(catId)
      ? current.filter((id) => id !== catId)
      : [...current, catId];
    onFiltersChange({ ...filters, categoryIds: next });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h1 className="text-lg font-semibold">Places Explorer</h1>
        <p className="text-xs text-muted-foreground">
          {placeCount} of {totalCount} places
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Search with autocomplete */}
        <div className="relative" ref={wrapperRef}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
          <Input
            placeholder="Search places..."
            className="pl-9"
            value={filters.search}
            onChange={(e) => {
              onFiltersChange({ ...filters, search: e.target.value });
              setDropdownOpen(e.target.value.length > 0);
            }}
            onFocus={() => {
              if (filters.search.length > 0) setDropdownOpen(true);
            }}
          />
          {dropdownOpen && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-md border bg-popover shadow-md">
              {suggestions.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-accent transition-colors"
                  onClick={() => {
                    onPlaceSelect(place.id);
                    setDropdownOpen(false);
                  }}
                >
                  <span className="text-sm font-medium">{place.title}</span>
                  {place.address && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {place.address}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View toggle */}
        <div className="flex gap-1 rounded-md border p-1">
          <Button
            variant={view === "map" ? "default" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => onViewChange("map")}
          >
            <Map className="mr-1 h-4 w-4" />
            Map
          </Button>
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => onViewChange("list")}
          >
            <List className="mr-1 h-4 w-4" />
            List
          </Button>
        </div>

        {/* Near Me */}
        <Button
          variant={filters.nearMe ? "default" : "outline"}
          className="w-full"
          onClick={() =>
            onFiltersChange({ ...filters, nearMe: !filters.nearMe })
          }
          disabled={!userPosition && !locationError}
        >
          <MapPin className="mr-2 h-4 w-4" />
          {!userPosition && !locationError ? "Locating..." : "Near Me"}
        </Button>
        {locationError && filters.nearMe && (
          <p className="text-xs text-destructive">{locationError}</p>
        )}

        <Separator />

        {/* Categories */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Categories</p>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const isActive = filters.categoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                >
                  <Badge
                    variant={isActive ? "default" : "outline"}
                    style={
                      isActive
                        ? {
                            backgroundColor: cat.color,
                            color: getContrastColor(cat.color),
                          }
                        : undefined
                    }
                    className="cursor-pointer"
                  >
                    {cat.name} ({cat.placeCount})
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Visited filter */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Status</p>
          <div className="flex gap-1.5">
            {(["all", "true", "false"] as const).map((val) => (
              <Button
                key={val}
                variant={filters.visited === val ? "default" : "outline"}
                size="sm"
                onClick={() => onFiltersChange({ ...filters, visited: val })}
              >
                {val === "all"
                  ? "All"
                  : val === "true"
                    ? "Visited"
                    : "Unvisited"}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Location filters */}
        <div className="space-y-2">
          <p className="text-sm font-medium">City</p>
          <MultiSelectLocation
            items={cities}
            value={filters.cities}
            onValueChange={(val) =>
              onFiltersChange({ ...filters, cities: val as string[] })
            }
            placeholder="Filter by city..."
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium">Ward</p>
          <MultiSelectLocation
            items={wards}
            value={filters.wards}
            onValueChange={(val) =>
              onFiltersChange({ ...filters, wards: val as string[] })
            }
            placeholder="Filter by ward..."
          />
        </div>
      </div>
    </div>
  );
}

export function ExplorerSidebar(props: ExplorerSidebarProps) {
  const { open, onOpenChange, ...rest } = props;

  return (
    <>
      {/* Mobile sheet */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetTitle className="sr-only">Filters</SheetTitle>
          <SidebarContent {...rest} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden w-80 shrink-0 border-r md:block">
        <SidebarContent {...rest} />
      </aside>
    </>
  );
}
