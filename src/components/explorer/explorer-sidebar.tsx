"use client";

import * as React from "react";
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
import { Map, List, Search } from "lucide-react";
import { getContrastColor } from "@/lib/utils";

interface Category {
  id: number;
  name: string;
  color: string;
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
}: Omit<ExplorerSidebarProps, "open" | "onOpenChange">) {
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
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search places..."
            className="pl-9"
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
          />
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
                    {cat.name}
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
