"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Review {
  authorName: string;
  rating: number;
  text: string;
  relativeTime: string;
  publishTime: string;
}

interface ReviewsSectionProps {
  reviews: Review[] | null | undefined;
  placeName?: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  truncate = true,
}: {
  review: Review;
  truncate?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium truncate">
          {review.authorName}
        </span>
        <span className="text-xs text-muted-foreground shrink-0">
          {review.relativeTime}
        </span>
      </div>
      <StarRating rating={review.rating} />
      {review.text && (
        <p
          className={`text-sm text-muted-foreground ${
            truncate ? "line-clamp-3" : ""
          }`}
        >
          {review.text}
        </p>
      )}
    </div>
  );
}

export function ReviewsSection({ reviews, placeName }: ReviewsSectionProps) {
  const [showAll, setShowAll] = useState(false);

  if (!reviews || reviews.length === 0) return null;

  const preview = reviews.slice(0, 2);
  const hasMore = reviews.length > 2;

  return (
    <>
      <div className="space-y-3">
        <p className="text-sm font-medium">Reviews ({reviews.length})</p>
        {preview.map((review, i) => (
          <ReviewCard key={i} review={review} />
        ))}
        {hasMore && (
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => setShowAll(true)}
          >
            See all {reviews.length} reviews
          </button>
        )}
      </div>

      <Dialog open={showAll} onOpenChange={setShowAll}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reviews</DialogTitle>
            <DialogDescription>
              {placeName
                ? `${reviews.length} reviews for ${placeName}`
                : `${reviews.length} reviews`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {reviews.map((review, i) => (
              <div key={i}>
                <ReviewCard review={review} truncate={false} />
                {i < reviews.length - 1 && <div className="mt-4 border-t" />}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
