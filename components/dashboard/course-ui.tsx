import { ConvexError } from "convex/values"
import { Button } from "@/components/ui/button"

export const inputClassName = "w-full rounded-md border bg-background px-3 py-2"

export function formatDue(timestamp: number) {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function courseError(error: unknown) {
  return error instanceof ConvexError && typeof error.data === "string"
    ? error.data
    : "Something went wrong. Please try again."
}

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
