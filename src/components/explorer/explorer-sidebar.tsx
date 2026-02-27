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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Map, List, Search, MapPin, Info } from "lucide-react";
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
  const [inputValue, setInputValue] = useState(filters.search);
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

  const categoryFuse = useMemo(
    () => new Fuse(categories, { keys: ["name"], threshold: 0.3 }),
    [categories],
  );

  const wardItems = useMemo(() => wards.map((w) => ({ name: w })), [wards]);
  const wardFuse = useMemo(
    () => new Fuse(wardItems, { keys: ["name"], threshold: 0.3 }),
    [wardItems],
  );

  const autoFiltersRef = useRef<{ categoryIds: number[]; wards: string[] }>({
    categoryIds: [],
    wards: [],
  });

  const suggestions = useMemo(() => {
    if (!inputValue) return [];
    return fuse.search(inputValue, { limit: 8 }).map((r) => r.item);
  }, [fuse, inputValue]);

  // Match query against categories: exact/prefix first, fuzzy fallback
  function matchCategory(query: string): Category | null {
    const q = query.toLowerCase();
    // Exact name match
    for (const cat of categories) {
      if (cat.name.toLowerCase() === q) return cat;
    }
    // Word-prefix match (min 3 chars to avoid false positives)
    if (q.length >= 3) {
      for (const cat of categories) {
        const words = cat.name
          .toLowerCase()
          .split(/[\s&,]+/)
          .filter(Boolean);
        if (words.some((w) => w.startsWith(q))) return cat;
      }
    }
    // Fuzzy fallback
    const r = categoryFuse.search(query, { limit: 1 })[0];
    return r && r.score !== undefined && r.score <= 0.4 ? r.item : null;
  }

  // Match query against wards: exact/prefix first, fuzzy fallback
  function matchWard(query: string): string | null {
    const q = query.toLowerCase();
    for (const w of wards) {
      if (w.toLowerCase() === q) return w;
    }
    if (q.length >= 3) {
      for (const w of wards) {
        if (w.toLowerCase().startsWith(q)) return w;
      }
    }
    const r = wardFuse.search(query, { limit: 1 })[0];
    return r && r.score !== undefined && r.score <= 0.4 ? r.item.name : null;
  }

  // Smart search: auto-select categories/wards from search tokens
  React.useEffect(() => {
    const raw = inputValue.trim();
    const prev = autoFiltersRef.current;

    if (!raw) {
      // Search cleared — remove all auto-selected filters
      if (prev.categoryIds.length > 0 || prev.wards.length > 0) {
        autoFiltersRef.current = { categoryIds: [], wards: [] };
        onFiltersChange({
          ...filters,
          search: "",
          categoryIds: filters.categoryIds.filter(
            (id) => !prev.categoryIds.includes(id),
          ),
          wards: filters.wards.filter((w) => !prev.wards.includes(w)),
        });
      } else if (filters.search !== "") {
        onFiltersChange({ ...filters, search: "" });
      }
      return;
    }

    const matchedCatIds: number[] = [];
    const matchedWards: string[] = [];
    const consumed = new Set<number>();
    const tokens = raw.split(/\s+/);

    // 1) Try full query as one unit (handles "fast food", "parks & nature")
    const noSpaces = raw.replace(/\s+/g, "");
    const fullCat =
      matchCategory(raw) || (noSpaces !== raw ? matchCategory(noSpaces) : null);
    const fullWard = !fullCat
      ? matchWard(raw) || (noSpaces !== raw ? matchWard(noSpaces) : null)
      : null;

    if (fullCat) {
      matchedCatIds.push(fullCat.id);
      tokens.forEach((_, i) => consumed.add(i));
    } else if (fullWard) {
      matchedWards.push(fullWard);
      tokens.forEach((_, i) => consumed.add(i));
    }

    // 2) Try bigrams (adjacent pairs)
    if (tokens.length > 1) {
      for (let i = 0; i < tokens.length - 1; i++) {
        if (consumed.has(i) || consumed.has(i + 1)) continue;
        const bigram = `${tokens[i]} ${tokens[i + 1]}`;
        const joined = `${tokens[i]}${tokens[i + 1]}`;
        const catMatch = matchCategory(bigram) || matchCategory(joined);
        if (catMatch) {
          matchedCatIds.push(catMatch.id);
          consumed.add(i);
          consumed.add(i + 1);
          continue;
        }
        const wardMatch = matchWard(bigram) || matchWard(joined);
        if (wardMatch) {
          matchedWards.push(wardMatch);
          consumed.add(i);
          consumed.add(i + 1);
        }
      }
    }

    // 3) Try remaining individual tokens (always, not just multi-token)
    for (let i = 0; i < tokens.length; i++) {
      if (consumed.has(i)) continue;
      const catMatch = matchCategory(tokens[i]);
      if (catMatch) {
        matchedCatIds.push(catMatch.id);
        consumed.add(i);
        continue;
      }
      const wardMatch = matchWard(tokens[i]);
      if (wardMatch) {
        matchedWards.push(wardMatch);
        consumed.add(i);
      }
    }

    // Build remainder text from unconsumed tokens
    const remainder = tokens.filter((_, i) => !consumed.has(i)).join(" ");

    // Check if anything changed
    const prevCatSet = new Set(prev.categoryIds);
    const prevWardSet = new Set(prev.wards);
    const catsSame =
      matchedCatIds.length === prev.categoryIds.length &&
      matchedCatIds.every((id) => prevCatSet.has(id));
    const wardsSame =
      matchedWards.length === prev.wards.length &&
      matchedWards.every((w) => prevWardSet.has(w));

    if (catsSame && wardsSame && filters.search === remainder) return;

    // Remove old auto-selections, add new ones
    let nextCatIds = filters.categoryIds.filter(
      (id) => !prev.categoryIds.includes(id),
    );
    for (const id of matchedCatIds) {
      if (!nextCatIds.includes(id)) nextCatIds = [...nextCatIds, id];
    }

    let nextWards = filters.wards.filter((w) => !prev.wards.includes(w));
    for (const w of matchedWards) {
      if (!nextWards.includes(w)) nextWards = [...nextWards, w];
    }

    autoFiltersRef.current = {
      categoryIds: matchedCatIds,
      wards: matchedWards,
    };
    onFiltersChange({
      ...filters,
      search: remainder,
      categoryIds: nextCatIds,
      wards: nextWards,
    });
  }, [inputValue, categoryFuse, wardFuse]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 text-lg font-semibold hover:text-muted-foreground transition-colors"
            >
              Discover Japan
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>How to use</DialogTitle>
              <DialogDescription>
                A quick guide to get you started.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <p>
                <strong>Search</strong> — Type a place name, category, or ward.
                The app auto-selects matching filters for you (e.g. &quot;ramen
                shibuya&quot; shows all Ramen spots in Shibuya).
              </p>
              <p>
                <strong>Categories</strong> — Tap the colored badges to filter
                by type (Ramen, Cafes, Landmarks, etc). Pick multiple at once.
              </p>
              <p>
                <strong>City &amp; Ward</strong> — Narrow results to a specific
                area using the dropdowns at the bottom.
              </p>
              <p>
                <strong>Map / List</strong> — Switch between the map view with
                pins and a scrollable list.
              </p>
              <p>
                <strong>Near Me</strong> — Sort places by distance from your
                current location.
              </p>
              <p>
                <strong>Place details</strong> — Tap any pin or list item to see
                details, get directions, or share.
              </p>
            </div>
          </DialogContent>
        </Dialog>
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
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setDropdownOpen(e.target.value.length > 0);
            }}
            onFocus={() => {
              if (inputValue.length > 0) setDropdownOpen(true);
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
