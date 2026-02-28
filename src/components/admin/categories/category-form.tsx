"use client";

import {
  useActionState,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import Link from "next/link";
import { createCategory, updateCategory } from "@/app/admin/categories/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { PageHeader } from "@/components/admin/page-header";
import { PRESET_COLORS, ICON_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { getIcon } from "@/lib/icons";

interface CategoryFormProps {
  title: string;
  cancelHref: string;
  defaultValues?: {
    id: number;
    name: string;
    color: string;
    icon: string;
  };
}

export function CategoryForm({
  title,
  cancelHref,
  defaultValues,
}: CategoryFormProps) {
  const isEdit = !!defaultValues;
  const formRef = useRef<HTMLFormElement>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [selectedColor, setSelectedColor] = useState(
    defaultValues?.color || PRESET_COLORS[0].value,
  );
  const [selectedIcon, setSelectedIcon] = useState(defaultValues?.icon || "");

  const action = defaultValues
    ? updateCategory.bind(null, defaultValues.id)
    : createCategory;

  const [state, formAction, isPending] = useActionState(action, {
    error: null as string | null,
  });

  // Store initial values for dirty comparison
  const initialValues = useRef({
    name: defaultValues?.name ?? "",
    color: defaultValues?.color || PRESET_COLORS[0].value,
    icon: defaultValues?.icon || "",
  });

  const checkDirty = useCallback(() => {
    if (!formRef.current || !isEdit) return;
    const form = formRef.current;
    const getVal = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement)?.value ?? "";
    const init = initialValues.current;
    const dirty =
      getVal("name") !== init.name ||
      selectedColor !== init.color ||
      selectedIcon !== init.icon;
    setIsDirty(dirty);
  }, [isEdit, selectedColor, selectedIcon]);

  useEffect(() => {
    checkDirty();
  }, [checkDirty]);

  return (
    <form ref={formRef} action={formAction} onChange={checkDirty}>
      <PageHeader
        title={title}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={cancelHref}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isPending || (isEdit && !isDirty)}>
              {isPending
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Create Category"}
            </Button>
          </div>
        }
      />
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Restaurants"
              defaultValue={defaultValues?.name}
              required
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Color</Label>
            <input type="hidden" name="color" value={selectedColor} />
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  title={color.label}
                  className={cn(
                    "relative h-8 w-8 rounded-full border-2 transition-all",
                    selectedColor === color.value
                      ? "border-foreground scale-110"
                      : "border-transparent hover:scale-105",
                  )}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.value)}
                >
                  {selectedColor === color.value && (
                    <Check
                      className="absolute inset-0 m-auto h-4 w-4"
                      style={{
                        color:
                          selectedColor === "#EAB308" ||
                          selectedColor === "#84CC16" ||
                          selectedColor === "#F59E0B"
                            ? "black"
                            : "white",
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <input type="hidden" name="icon" value={selectedIcon} />
            <Combobox
              items={[...ICON_OPTIONS]}
              value={selectedIcon || null}
              onValueChange={(val) => setSelectedIcon(val ?? "")}
            >
              <ComboboxInput placeholder="Search icons..." showClear />
              <ComboboxContent>
                <ComboboxEmpty>No icons found.</ComboboxEmpty>
                <ComboboxList>
                  {(iconName) => {
                    const Icon = getIcon(iconName);
                    return (
                      <ComboboxItem key={iconName} value={iconName}>
                        {Icon && <Icon className="h-4 w-4" />}
                        {iconName}
                      </ComboboxItem>
                    );
                  }}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            {selectedIcon && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Preview:
                {(() => {
                  const Icon = getIcon(selectedIcon);
                  return Icon ? (
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: selectedColor }}
                    >
                      <Icon
                        className="h-4 w-4"
                        style={{
                          color:
                            selectedColor === "#EAB308" ||
                            selectedColor === "#84CC16" ||
                            selectedColor === "#F59E0B"
                              ? "black"
                              : "white",
                        }}
                      />
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
        </div>
      </div>
    </form>
  );
}
