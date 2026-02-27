"use client";

import {
  isOpenNow,
  getTodayHours,
  type OpeningHoursData,
} from "@/lib/opening-hours";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock } from "lucide-react";

interface OpenClosedBadgeProps {
  openingHours: OpeningHoursData | null | undefined;
  businessStatus: string | null | undefined;
  size?: "sm" | "default";
}

export function OpenClosedBadge({
  openingHours,
  businessStatus,
  size = "default",
}: OpenClosedBadgeProps) {
  // Priority 1: business status overrides
  if (businessStatus === "CLOSED_TEMPORARILY") {
    return (
      <StatusBadge
        color="red"
        label="Temporarily Closed"
        size={size}
        tooltip={null}
      />
    );
  }
  if (businessStatus === "CLOSED_PERMANENTLY") {
    return (
      <StatusBadge
        color="gray"
        label="Permanently Closed"
        size={size}
        tooltip={null}
      />
    );
  }

  // Priority 2: opening hours
  const open = isOpenNow(openingHours);
  if (open === null) return null;

  const todayHours = getTodayHours(openingHours);

  return (
    <StatusBadge
      color={open ? "green" : "red"}
      label={open ? "Open" : "Closed"}
      size={size}
      tooltip={todayHours}
    />
  );
}

function StatusBadge({
  color,
  label,
  size,
  tooltip,
}: {
  color: "green" | "red" | "gray";
  label: string;
  size: "sm" | "default";
  tooltip: string | null;
}) {
  const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  const colorClasses = {
    green: { dot: "bg-green-500", text: "text-green-600" },
    red: { dot: "bg-red-500", text: "text-red-500" },
    gray: { dot: "bg-muted-foreground", text: "text-muted-foreground" },
  }[color];

  const badge = (
    <span className={`inline-flex items-center gap-1 ${textSize}`}>
      <span
        className={`${dotSize} shrink-0 rounded-full ${colorClasses.dot}`}
      />
      <span className={colorClasses.text}>{label}</span>
    </span>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default">{badge}</span>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}
