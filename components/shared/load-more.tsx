"use client"

import { Button } from "@/components/ui/button"

export function LoadMore({
  status,
  loadMore,
}: {
  status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted"
  loadMore: (count: number) => void
}) {
  if (status === "Exhausted" || status === "LoadingFirstPage") return null
  return (
    <Button
      variant="outline"
      disabled={status === "LoadingMore"}
      onClick={() => loadMore(20)}
    >
      {status === "LoadingMore" ? "Loading…" : "Load more"}
    </Button>
  )
}
