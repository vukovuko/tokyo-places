"use client";

import { useState, useEffect } from "react";

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  description: string;
}

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Heavy freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light showers",
  81: "Showers",
  82: "Heavy showers",
  85: "Light snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};

const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

export function useTokyoWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchWeather() {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=35.6762&longitude=139.6503&current=temperature_2m,weather_code&timezone=Asia/Tokyo",
        );
        if (!res.ok) throw new Error(`Weather API ${res.status}`);
        const data = await res.json();
        if (!mounted) return;
        const code = data.current.weather_code as number;
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          weatherCode: code,
          description: WMO_DESCRIPTIONS[code] ?? "Unknown",
        });
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(
          err instanceof Error ? err.message : "Failed to fetch weather",
        );
      }
    }

    fetchWeather();
    const interval = setInterval(fetchWeather, REFRESH_INTERVAL);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { weather, error };
}
