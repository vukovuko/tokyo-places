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
} from "lucide-react";
import { useTokyoWeather } from "@/hooks/use-tokyo-weather";

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

export function WeatherWidget() {
  const { weather } = useTokyoWeather();

  if (!weather) return null;

  return (
    <div className="rounded-lg bg-background/90 backdrop-blur shadow-md border px-3 py-2">
      <div className="flex items-center gap-2">
        {getWeatherIcon(weather.weatherCode)}
        <span className="text-sm font-medium">{weather.temperature}°C</span>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">
        {weather.description}
      </p>
    </div>
  );
}
