"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { PlaceWithCategories } from "@/db/queries/places";
import {
  deletePlaces,
  bulkSetCategories,
  bulkSetVisited,
  bulkRefreshFromGoogle,
} from "@/app/admin/places/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  Minus,
  Star,
  Trash2,
  Eye,
  EyeOff,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import { getContrastColor } from "@/lib/utils";
import { buildSearchParams } from "@/lib/search-params";
import { OpenClosedBadge } from "@/components/open-closed-badge";

interface Category {
  id: number;
  name: string;
  color: string;
}

interface PlacesTableProps {
  places: PlaceWithCategories[];
  categories: Category[];
}

export function PlacesTable({ places, categories }: PlacesTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams.get("sort") || "createdAt";
  const currentOrder = searchParams.get("order") || "desc";

  function toggleSort(column: string) {
    let newOrder: "asc" | "desc" = "asc";
    if (currentSort === column && currentOrder === "asc") {
      newOrder = "desc";
    }
    const params = buildSearchParams(
      { sort: column, order: newOrder },
      searchParams,
    );
    router.push(`?${params.toString()}`);
  }

  function SortIcon({ column }: { column: string }) {
    if (currentSort !== column) return <ArrowUpDown className="ml-1 h-3 w-3" />;
    return currentOrder === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  }

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === places.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(places.map((p) => p.id)));
    }
  }

  function handleBulkDelete() {
    startTransition(async () => {
      await deletePlaces(Array.from(selected));
      setSelected(new Set());
      setDeleteConfirm(false);
    });
  }

  function handleBulkVisited(visited: boolean) {
    startTransition(async () => {
      await bulkSetVisited(Array.from(selected), visited);
      setSelected(new Set());
    });
  }

  function handleBulkCategory(categoryId: number) {
    startTransition(async () => {
      await bulkSetCategories(Array.from(selected), [categoryId]);
      setSelected(new Set());
    });
  }

  function handleBulkRefresh() {
    startTransition(async () => {
      await bulkRefreshFromGoogle(Array.from(selected));
      setSelected(new Set());
    });
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <Table className="table-fixed min-w-[700px]">
          <colgroup>
            <col style={{ width: "36px" }} />
            <col style={{ width: "28%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "30%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-3">
                <Checkbox
                  checked={places.length > 0 && selected.size === places.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="pl-0">
                {selected.size > 0 ? (
                  <span className="text-sm font-medium">
                    {selected.size} selected
                  </span>
                ) : (
                  <button
                    type="button"
                    className="flex items-center font-medium"
                    onClick={() => toggleSort("title")}
                  >
                    Title
                    <SortIcon column="title" />
                  </button>
                )}
              </TableHead>
              <TableHead>{selected.size === 0 && "Categories"}</TableHead>
              <TableHead>
                {selected.size === 0 && (
                  <button
                    type="button"
                    className="flex items-center font-medium"
                    onClick={() => toggleSort("address")}
                  >
                    Address
                    <SortIcon column="address" />
                  </button>
                )}
              </TableHead>
              <TableHead>
                {selected.size === 0 && (
                  <button
                    type="button"
                    className="flex items-center font-medium"
                    onClick={() => toggleSort("visited")}
                  >
                    Visited
                    <SortIcon column="visited" />
                  </button>
                )}
              </TableHead>
              <TableHead className="text-right">
                {selected.size > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-xs">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          Set category
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {categories.map((cat) => (
                            <DropdownMenuItem
                              key={cat.id}
                              onClick={() => handleBulkCategory(cat.id)}
                              disabled={isPending}
                            >
                              <div
                                className="mr-2 h-3 w-3 rounded-full"
                                style={{ backgroundColor: cat.color }}
                              />
                              {cat.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuItem
                        onClick={() => handleBulkVisited(true)}
                        disabled={isPending}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Mark Visited
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleBulkVisited(false)}
                        disabled={isPending}
                      >
                        <EyeOff className="mr-2 h-4 w-4" />
                        Mark Unvisited
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleBulkRefresh}
                        disabled={isPending}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh from Google
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteConfirm(true)}
                        disabled={isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <button
                    type="button"
                    className="flex items-center font-medium ml-auto"
                    onClick={() => toggleSort("rating")}
                  >
                    Rating
                    <SortIcon column="rating" />
                  </button>
                )}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {places.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No places found. Try adjusting your filters or add a new
                  place.
                </TableCell>
              </TableRow>
            )}
            {places.map((place) => (
              <TableRow
                key={place.id}
                className="cursor-pointer"
                data-selected={selected.has(place.id) || undefined}
              >
                <TableCell
                  className="pl-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={selected.has(place.id)}
                    onCheckedChange={() => toggleSelect(place.id)}
                  />
                </TableCell>
                <TableCell
                  className="pl-0 font-medium"
                  onClick={() => router.push(`/admin/places/${place.id}/edit`)}
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className="truncate">{place.title}</span>
                    <OpenClosedBadge
                      openingHours={place.openingHours}
                      businessStatus={place.businessStatus}
                      size="sm"
                    />
                  </div>
                </TableCell>
                <TableCell
                  className="overflow-hidden"
                  onClick={() => router.push(`/admin/places/${place.id}/edit`)}
                >
                  <div className="flex flex-wrap gap-1">
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
                </TableCell>
                <TableCell
                  className="truncate"
                  onClick={() => router.push(`/admin/places/${place.id}/edit`)}
                >
                  {place.address || "—"}
                </TableCell>
                <TableCell
                  onClick={() => router.push(`/admin/places/${place.id}/edit`)}
                >
                  {place.visited ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Minus className="h-4 w-4 text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell
                  onClick={() => router.push(`/admin/places/${place.id}/edit`)}
                >
                  {place.rating ? (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-sm">{place.rating}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={deleteConfirm}
        onOpenChange={setDeleteConfirm}
        title="Delete Places"
        description={`Are you sure you want to delete ${selected.size} place${selected.size === 1 ? "" : "s"}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleBulkDelete}
        loading={isPending}
      />
    </>
  );
}
