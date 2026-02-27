"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { CategoryWithCount } from "@/db/queries/categories";
import { deleteCategory } from "@/app/admin/categories/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Trash2 } from "lucide-react";
import { ICON_OPTIONS } from "@/lib/constants";
import * as LucideIcons from "lucide-react";

function getIcon(iconName: string) {
  const pascalCase = iconName
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
  const Icon =
    // biome-ignore lint: dynamic icon lookup
    (
      LucideIcons as unknown as Record<
        string,
        React.ComponentType<Record<string, unknown>>
      >
    )[pascalCase];
  return Icon || null;
}

interface CategoriesTableProps {
  categories: CategoryWithCount[];
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (deleteId === null) return;
    startTransition(async () => {
      await deleteCategory(deleteId);
      setDeleteId(null);
    });
  }

  return (
    <>
      <Table className="min-w-[500px]">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Icon</TableHead>
            <TableHead className="text-right">Places</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground py-8"
              >
                No categories yet. Create your first category.
              </TableCell>
            </TableRow>
          )}
          {categories.map((category) => {
            const Icon = getIcon(category.icon);
            return (
              <TableRow
                key={category.id}
                className="cursor-pointer"
                onClick={() =>
                  router.push(`/admin/categories/${category.id}/edit`)
                }
              >
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-5 w-5 rounded-full border"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {category.color}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                    <span className="text-xs text-muted-foreground">
                      {category.icon}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {category.placeCount}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(category.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Category"
        description="Are you sure you want to delete this category? Places assigned to this category will have the association removed."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={isPending}
      />
    </>
  );
}
