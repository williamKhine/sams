import { ConvexError } from "convex/values"

export function courseError(error: unknown) {
  return error instanceof ConvexError && typeof error.data === "string"
    ? error.data
    : "Something went wrong. Please try again."
}
