"use client";

import { useState } from "react";

interface PlaceImageProps {
  photoRef: string | null | undefined;
  alt: string;
  className?: string;
}

export function PlaceImage({ photoRef, alt, className = "" }: PlaceImageProps) {
  const [error, setError] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!photoRef || !apiKey || error) {
    return null;
  }

  const src = `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=800&key=${apiKey}`;

  return (
    <div className={`overflow-hidden rounded-md bg-muted ${className}`}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-contain"
        onError={() => setError(true)}
      />
    </div>
  );
}
