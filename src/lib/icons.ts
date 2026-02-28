import * as LucideIcons from "lucide-react";

export function getIcon(iconName: string) {
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
