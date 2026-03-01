"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxEmpty,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
import { buildSearchParams } from "@/lib/search-params";
import { getContrastColor } from "@/lib/utils";
import { VISITED_OPTIONS } from "@/lib/constants";

interface Category {
  id: number;
  name: string;
  color: string;
}

interface PlacesToolbarProps {
  categories: Category[];
  cities: string[];
  wards: string[];
  neighborhoods: string[];
}

function MultiSelectCombobox({
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
      <ComboboxChips ref={anchor} className="min-w-0">
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

export function PlacesToolbar({
  categories,
  cities,
  wards,
  neighborhoods,
}: PlacesToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string | string[] | undefined | number>) => {
      const params = buildSearchParams(
        updates as Parameters<typeof buildSearchParams>[0],
        searchParams,
      );
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ search: value || "" });
    }, 300);
  }

  const currentVisited = searchParams.get("visited") || "all";
  const currentCategories = searchParams.getAll("category");
  const currentCities = searchParams.getAll("city");
  const currentWards = searchParams.getAll("ward");
  const currentNeighborhoods = searchParams.getAll("neighborhood");
  const currentSearch = searchParams.get("search") || "";
  const hasFilters =
    currentVisited !== "all" ||
    currentCategories.length > 0 ||
    currentCities.length > 0 ||
    currentWards.length > 0 ||
    currentNeighborhoods.length > 0 ||
    currentSearch;

  function toggleCategory(catId: number) {
    const idStr = String(catId);
    const next = currentCategories.includes(idStr)
      ? currentCategories.filter((c) => c !== idStr)
      : [...currentCategories, idStr];
    updateParams({ categories: next.length > 0 ? next : [] });
  }

  function removeCategory(catId: string) {
    const next = currentCategories.filter((c) => c !== catId);
    updateParams({ categories: next });
  }

  function removeCity(city: string) {
    updateParams({ cities: currentCities.filter((c) => c !== city) });
  }

  function removeWard(ward: string) {
    updateParams({ wards: currentWards.filter((w) => w !== ward) });
  }

  function removeNeighborhood(neighborhood: string) {
    updateParams({
      neighborhoods: currentNeighborhoods.filter((n) => n !== neighborhood),
    });
  }

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by title or address..."
          className="pl-9"
          defaultValue={currentSearch}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Category filter badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        {categories.map((cat) => {
          const isActive = currentCategories.includes(String(cat.id));
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
            >
              <Badge
                variant={isActive ? "default" : "outline"}
                className="cursor-pointer"
                style={
                  isActive
                    ? {
                        backgroundColor: cat.color,
                        color: getContrastColor(cat.color),
                      }
                    : undefined
                }
              >
                {cat.name}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Other filters */}
      <div className="flex items-start gap-3">
        <div className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-4">
          {/* Visited filter */}
          <Combobox
            items={VISITED_OPTIONS.map((o) => o.value)}
            value={currentVisited}
            itemToStringLabel={(val) =>
              VISITED_OPTIONS.find((o) => o.value === val)?.label ?? val
            }
            onValueChange={(val) =>
              updateParams({ visited: (val as string) || "all" })
            }
          >
            <ComboboxInput placeholder="Visited status" />
            <ComboboxContent>
              <ComboboxList>
                {(value) => {
                  const opt = VISITED_OPTIONS.find((o) => o.value === value);
                  return (
                    <ComboboxItem key={value} value={value}>
                      {opt?.label ?? value}
                    </ComboboxItem>
                  );
                }}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>

          {/* City filter */}
          <MultiSelectCombobox
            items={cities}
            value={currentCities}
            onValueChange={(val) => updateParams({ cities: val })}
            placeholder="City"
          />

          {/* Ward filter */}
          <MultiSelectCombobox
            items={wards}
            value={currentWards}
            onValueChange={(val) => updateParams({ wards: val })}
            placeholder="Ward"
          />

          {/* Neighborhood filter */}
          <MultiSelectCombobox
            items={neighborhoods}
            value={currentNeighborhoods}
            onValueChange={(val) => updateParams({ neighborhoods: val })}
            placeholder="Neighborhood"
          />
        </div>

        {/* Clear all filters */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => router.push("/admin/places")}
          >
            <X className="mr-1 h-4 w-4" />
            Clear all
          </Button>
        )}
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          {currentSearch && (
            <Badge variant="secondary" className="gap-1">
              Search: {currentSearch}
              <button
                type="button"
                onClick={() => updateParams({ search: "" })}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {currentVisited !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {VISITED_OPTIONS.find((o) => o.value === currentVisited)?.label ??
                currentVisited}
              <button
                type="button"
                onClick={() => updateParams({ visited: "all" })}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {currentCategories.map((catId) => {
            const cat = categories.find((c) => String(c.id) === catId);
            return (
              <Badge
                key={catId}
                variant="secondary"
                className="gap-1"
                style={
                  cat
                    ? {
                        backgroundColor: cat.color,
                        color: getContrastColor(cat.color),
                      }
                    : undefined
                }
              >
                {cat?.name ?? catId}
                <button type="button" onClick={() => removeCategory(catId)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          {currentCities.map((city) => (
            <Badge key={city} variant="secondary" className="gap-1">
              City: {city}
              <button type="button" onClick={() => removeCity(city)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {currentWards.map((ward) => (
            <Badge key={ward} variant="secondary" className="gap-1">
              Ward: {ward}
              <button type="button" onClick={() => removeWard(ward)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {currentNeighborhoods.map((n) => (
            <Badge key={n} variant="secondary" className="gap-1">
              Neighborhood: {n}
              <button type="button" onClick={() => removeNeighborhood(n)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
