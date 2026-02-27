"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PhotoCarouselProps {
  photoRefs: string[] | null | undefined;
  alt: string;
  className?: string;
}

function getPhotoUrl(ref: string, maxWidth: number) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  return `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=${maxWidth}&key=${apiKey}`;
}

export function PhotoCarousel({
  photoRefs,
  alt,
  className = "",
}: PhotoCarouselProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedRefs, setFailedRefs] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);
  const hasDragged = useRef(false);

  const handleImageError = useCallback((ref: string) => {
    setFailedRefs((prev) => new Set(prev).add(ref));
  }, []);

  // Reset to first slide when photos change (different place selected)
  const refsKey = photoRefs?.join(",") ?? "";
  useEffect(() => {
    setActiveIndex(0);
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [refsKey]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!photoRefs || photoRefs.length === 0 || !apiKey) return null;

  const validRefs = photoRefs.filter((ref) => !failedRefs.has(ref));
  if (validRefs.length === 0) return null;

  const isSingle = validRefs.length === 1;

  function scrollToIndex(index: number) {
    const container = scrollRef.current;
    if (!container) return;
    const children = container.children;
    if (children[index]) {
      (children[index] as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }

  function handleScroll() {
    const container = scrollRef.current;
    if (!container) return;
    const center = container.scrollLeft + container.offsetWidth / 2;
    let closest = 0;
    let closestDist = Infinity;
    for (let i = 0; i < container.children.length; i++) {
      const child = container.children[i] as HTMLElement;
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const dist = Math.abs(center - childCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    }
    setActiveIndex(closest);
  }

  // Mouse drag handlers for desktop
  function handleMouseDown(e: React.MouseEvent) {
    isDragging.current = true;
    hasDragged.current = false;
    dragStartX.current = e.clientX;
    scrollStartX.current = scrollRef.current?.scrollLeft ?? 0;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = "grabbing";
      scrollRef.current.style.scrollSnapType = "none";
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging.current || !scrollRef.current) return;
    const dx = e.clientX - dragStartX.current;
    if (Math.abs(dx) > 5) hasDragged.current = true;
    scrollRef.current.scrollLeft = scrollStartX.current - dx;
  }

  function handleMouseUp() {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = "grab";
      scrollRef.current.style.scrollSnapType = "x mandatory";
    }
  }

  function goCarouselPrev() {
    const next = Math.max(0, activeIndex - 1);
    scrollToIndex(next);
  }

  function goCarouselNext() {
    const next = Math.min(validRefs.length - 1, activeIndex + 1);
    scrollToIndex(next);
  }

  return (
    <>
      {/* Carousel strip */}
      <div
        className={`relative overflow-hidden rounded-md bg-muted ${className}`}
      >
        <div
          ref={scrollRef}
          className={`flex h-full gap-2 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] cursor-grab select-none ${isSingle ? "" : "px-[10%]"}`}
          onScroll={handleScroll}
          onMouseDown={isSingle ? undefined : handleMouseDown}
          onMouseMove={isSingle ? undefined : handleMouseMove}
          onMouseUp={isSingle ? undefined : handleMouseUp}
          onMouseLeave={isSingle ? undefined : handleMouseUp}
        >
          {validRefs.map((ref, i) => {
            const src = getPhotoUrl(ref, 800);
            if (!src) return null;
            return (
              <button
                key={ref}
                type="button"
                className={`h-full shrink-0 snap-center overflow-hidden rounded-md ${isSingle ? "w-full" : "w-[80%]"}`}
                onClick={() => {
                  if (!hasDragged.current) setPreviewIndex(i);
                }}
              >
                <img
                  src={src}
                  alt={`${alt} ${i + 1}`}
                  className="h-full w-full object-cover pointer-events-none"
                  draggable={false}
                  onError={() => handleImageError(ref)}
                />
              </button>
            );
          })}
        </div>

        {/* Carousel arrows */}
        {!isSingle && (
          <>
            <button
              type="button"
              className="absolute left-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              onClick={goCarouselPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="absolute right-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              onClick={goCarouselNext}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Counter overlay */}
        {!isSingle && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
            {activeIndex + 1} / {validRefs.length}
          </span>
        )}
      </div>

      {/* Dot indicators */}
      {!isSingle && (
        <div className="flex justify-center gap-1.5 mt-2">
          {validRefs.map((ref, i) => (
            <button
              key={ref}
              type="button"
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex
                  ? "w-3 bg-foreground"
                  : "w-1.5 bg-muted-foreground/40"
              }`}
              onClick={() => scrollToIndex(i)}
            />
          ))}
        </div>
      )}

      {/* Fullscreen preview — raw Radix to avoid DialogContent positioning */}
      <DialogPrimitive.Root
        open={previewIndex !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setPreviewIndex(null);
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-50 flex items-center justify-center outline-none"
            aria-describedby={undefined}
            onClick={() => setPreviewIndex(null)}
          >
            <DialogPrimitive.Title className="sr-only">
              {alt} — photo {(previewIndex ?? 0) + 1} of {validRefs.length}
            </DialogPrimitive.Title>

            {/* Close button */}
            <DialogPrimitive.Close className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
              <span className="text-lg leading-none">&times;</span>
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>

            {previewIndex !== null && (
              <>
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
                <img
                  src={getPhotoUrl(validRefs[previewIndex], 1200)!}
                  alt={`${alt} ${previewIndex + 1}`}
                  className="max-w-[90vw] max-h-[85vh] object-contain"
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Preview arrows */}
                {validRefs.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewIndex(
                          (previewIndex - 1 + validRefs.length) %
                            validRefs.length,
                        );
                      }}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewIndex((previewIndex + 1) % validRefs.length);
                      }}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}

                {/* Preview counter */}
                {validRefs.length > 1 && (
                  <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
                    {previewIndex + 1} / {validRefs.length}
                  </span>
                )}
              </>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
