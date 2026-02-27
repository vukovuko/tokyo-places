"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
import { buildSearchParams } from "@/lib/search-params";
import { getContrastColor } from "@/lib/utils";
import { RATING_OPTIONS, VISITED_OPTIONS } from "@/lib/constants";

interface Category {
  id: number;
  name: string;
  color: string;
}

interface PlacesToolbarProps {
  categories: Category[];
  cities: string[];
  wards: string[];
}

export function PlacesToolbar({
  categories,
  cities,
  wards,
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
      updateParams({ search: value || undefined });
    }, 300);
  }

  const currentVisited = searchParams.get("visited") || "all";
  const currentCategories = searchParams.getAll("category");
  const currentRating = searchParams.get("rating") || "";
  const currentCity = searchParams.get("city") || "";
  const currentWard = searchParams.get("ward") || "";
  const currentSearch = searchParams.get("search") || "";
  const hasFilters =
    currentVisited !== "all" ||
    currentCategories.length > 0 ||
    currentRating ||
    currentCity ||
    currentWard ||
    currentSearch;

  function toggleCategory(catId: number) {
    const idStr = String(catId);
    const next = currentCategories.includes(idStr)
      ? currentCategories.filter((c) => c !== idStr)
      : [...currentCategories, idStr];
    updateParams({ categories: next.length > 0 ? next : [] });
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
      <div className="flex flex-wrap items-center gap-3">
        {/* Visited filter */}
        <div className="w-40">
          <Combobox
            items={VISITED_OPTIONS.map((o) => o.value)}
            value={currentVisited}
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
        </div>

        {/* Rating filter */}
        <div className="w-36">
          <Combobox
            items={["", ...RATING_OPTIONS.map((o) => String(o.value))]}
            value={currentRating}
            onValueChange={(val) =>
              updateParams({
                rating: val ? Number(val as string) : undefined,
              })
            }
          >
            <ComboboxInput placeholder="Rating" />
            <ComboboxContent>
              <ComboboxList>
                {(value) => {
                  if (value === "") {
                    return (
                      <ComboboxItem key="all" value="">
                        All Ratings
                      </ComboboxItem>
                    );
                  }
                  const opt = RATING_OPTIONS.find(
                    (o) => String(o.value) === value,
                  );
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

        {/* City filter */}
        <div className="w-40">
          <Combobox
            items={["", ...cities]}
            value={currentCity}
            onValueChange={(val) =>
              updateParams({ city: (val as string) || undefined })
            }
          >
            <ComboboxInput placeholder="City" showClear />
            <ComboboxContent>
              <ComboboxList>
                {(value) => {
                  if (value === "") {
                    return (
                      <ComboboxItem key="all" value="">
                        All Cities
                      </ComboboxItem>
                    );
                  }
                  return (
                    <ComboboxItem key={value} value={value}>
                      {value}
                    </ComboboxItem>
                  );
                }}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        {/* Ward filter */}
        <div className="w-40">
          <Combobox
            items={["", ...wards]}
            value={currentWard}
            onValueChange={(val) =>
              updateParams({ ward: (val as string) || undefined })
            }
          >
            <ComboboxInput placeholder="Ward" showClear />
            <ComboboxContent>
              <ComboboxList>
                {(value) => {
                  if (value === "") {
                    return (
                      <ComboboxItem key="all" value="">
                        All Wards
                      </ComboboxItem>
                    );
                  }
                  return (
                    <ComboboxItem key={value} value={value}>
                      {value}
                    </ComboboxItem>
                  );
                }}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/places")}
          >
            <X className="mr-1 h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
