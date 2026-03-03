"use client";

import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
  CloudLightning,
  CloudFog,
  CloudSun,
  X,
} from "lucide-react";
import { useTokyoWeather } from "@/hooks/use-tokyo-weather";
import { useWeather } from "@/hooks/use-weather";
import { getWeatherIcon as getWeatherIconLarge } from "@/lib/weather-utils";
import { Label } from "@/components/ui/label";
import { Widget, WidgetContent } from "@/components/ui/widget";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const TOKYO_LAT = 35.6762;
const TOKYO_LON = 139.6503;

function getWeatherIcon(code: number) {
  if (code === 0) return <Sun className="h-5 w-5 text-amber-500" />;
  if (code <= 2) return <CloudSun className="h-5 w-5 text-amber-400" />;
  if (code === 3) return <Cloud className="h-5 w-5 text-gray-400" />;
  if (code <= 48) return <CloudFog className="h-5 w-5 text-gray-400" />;
  if (code <= 57) return <CloudDrizzle className="h-5 w-5 text-blue-400" />;
  if (code <= 67) return <CloudRain className="h-5 w-5 text-blue-500" />;
  if (code <= 77) return <CloudSnow className="h-5 w-5 text-blue-200" />;
  if (code <= 82) return <CloudRain className="h-5 w-5 text-blue-500" />;
  if (code <= 86) return <CloudSnow className="h-5 w-5 text-blue-200" />;
  return <CloudLightning className="h-5 w-5 text-yellow-500" />;
}

function getDayName(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export function WeatherWidget() {
  const { weather } = useTokyoWeather();
  const { data: forecast } = useWeather(TOKYO_LAT, TOKYO_LON);

  if (!weather) return null;

  const days =
    forecast?.daily?.time.slice(0, 4).map((time, index) => ({
      day: getDayName(time),
      min: forecast.daily.temperatureMin[index],
      max: forecast.daily.temperatureMax[index],
      weatherCode: forecast.daily.weatherCode[index],
    })) || [];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded-lg bg-background/90 backdrop-blur shadow-md border px-3 py-2 cursor-pointer transition-colors hover:bg-background"
        >
          <div className="flex items-center gap-2">
            {getWeatherIcon(weather.weatherCode)}
            <span className="text-sm font-medium">{weather.temperature}°C</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {weather.description}
          </p>
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="w-auto min-w-0 p-0 border-0 bg-transparent shadow-none"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Tokyo Weather Forecast</DialogTitle>
        </DialogHeader>
        <Widget design="mumbai" className="relative">
          <DialogClose className="absolute top-3 right-3 rounded-full opacity-70 transition-opacity hover:opacity-100">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <WidgetContent className="mt-4 flex w-full flex-col gap-2">
            {days.map((el, index) => (
              <div
                key={index}
                className="grid w-full grid-cols-4 items-center gap-3 border-b pb-2 last:border-none"
              >
                <Label className="text-muted-foreground text-base">
                  {el.day}
                </Label>
                {getWeatherIconLarge(el.weatherCode, "size-4", {
                  className: "mx-auto",
                })}
                <Label className="mx-auto text-base">{el.min}&deg;</Label>
                <Label className="mx-auto text-base">{el.max}&deg;</Label>
              </div>
            ))}
          </WidgetContent>
        </Widget>
      </DialogContent>
    </Dialog>
  );
}
