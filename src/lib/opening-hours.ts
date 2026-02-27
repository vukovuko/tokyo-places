export interface OpeningHoursData {
  periods: Array<{
    open: { day: number; hour: number; minute: number };
    close?: { day: number; hour: number; minute: number };
  }>;
  weekdayDescriptions: string[];
}

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatTime(hour: number, minute: number): string {
  return `${pad(hour)}:${pad(minute)}`;
}

/**
 * Determines if a place is currently open based on stored periods.
 * All computation uses Asia/Tokyo timezone.
 * Returns null if no opening hours data is available.
 */
export function isOpenNow(
  data: OpeningHoursData | null | undefined,
): boolean | null {
  if (!data?.periods || data.periods.length === 0) return null;

  const now = new Date();
  const tokyoTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }),
  );
  const currentDay = tokyoTime.getDay(); // 0=Sunday
  const currentMinutes = tokyoTime.getHours() * 60 + tokyoTime.getMinutes();

  // 24/7 place: single period with open but no close
  if (data.periods.length === 1 && !data.periods[0].close) {
    return true;
  }

  for (const period of data.periods) {
    const openDay = period.open.day;
    const openMinutes = period.open.hour * 60 + period.open.minute;
    const closeDay = period.close?.day ?? openDay;
    const closeMinutes = period.close
      ? period.close.hour * 60 + period.close.minute
      : 24 * 60;

    if (openDay === closeDay) {
      // Same-day period
      if (
        currentDay === openDay &&
        currentMinutes >= openMinutes &&
        currentMinutes < closeMinutes
      ) {
        return true;
      }
    } else {
      // Overnight period (e.g. open Friday 22:00, close Saturday 02:00)
      if (currentDay === openDay && currentMinutes >= openMinutes) {
        return true;
      }
      if (currentDay === closeDay && currentMinutes < closeMinutes) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Generates 24h-formatted weekday hours from periods data.
 * Returns 7 strings in Monday–Sunday order, e.g. "Monday: 09:00 – 17:00".
 * Returns null if no periods data available.
 */
export function formatWeekdayHours(
  data: OpeningHoursData | null | undefined,
): string[] | null {
  if (!data?.periods || data.periods.length === 0) return null;

  // 24/7 place
  if (data.periods.length === 1 && !data.periods[0].close) {
    return DAY_NAMES.map((name) => `${name}: Open 24 hours`);
  }

  // Google uses: 0=Sunday, 1=Monday, ..., 6=Saturday
  // We want output: Monday(1) through Sunday(0)
  // Group periods by open.day
  const byDay = new Map<number, string[]>();
  for (const period of data.periods) {
    const openStr = formatTime(period.open.hour, period.open.minute);
    const closeStr = period.close
      ? formatTime(period.close.hour, period.close.minute)
      : "00:00";
    const ranges = byDay.get(period.open.day) || [];
    ranges.push(`${openStr} – ${closeStr}`);
    byDay.set(period.open.day, ranges);
  }

  // Output order: Mon(1), Tue(2), Wed(3), Thu(4), Fri(5), Sat(6), Sun(0)
  const googleDayOrder = [1, 2, 3, 4, 5, 6, 0];
  return googleDayOrder.map((googleDay, i) => {
    const ranges = byDay.get(googleDay);
    if (!ranges || ranges.length === 0) {
      return `${DAY_NAMES[i]}: Closed`;
    }
    return `${DAY_NAMES[i]}: ${ranges.join(", ")}`;
  });
}

/**
 * Returns today's hours in 24h format from periods data.
 * Falls back to weekdayDescriptions if periods are unavailable.
 */
export function getTodayHours(
  data: OpeningHoursData | null | undefined,
): string | null {
  if (!data) return null;

  const now = new Date();
  const tokyoTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }),
  );
  const jsDay = tokyoTime.getDay(); // 0=Sun, 1=Mon, ...
  const descIndex = jsDay === 0 ? 6 : jsDay - 1; // Mon=0, Sun=6

  // Prefer 24h formatted from periods
  const formatted = formatWeekdayHours(data);
  if (formatted) return formatted[descIndex] ?? null;

  // Fallback to Google's weekdayDescriptions
  if (data.weekdayDescriptions?.length === 7) {
    return data.weekdayDescriptions[descIndex] ?? null;
  }

  return null;
}
