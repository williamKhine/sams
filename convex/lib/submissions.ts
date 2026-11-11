import { ConvexError } from "convex/values"
import type { Id } from "../_generated/dataModel"
import type { QueryCtx } from "../_generated/server"

export const MAX_SUBMISSION_BYTES = 25 * 1024 * 1024

export function validateFileName(value: string) {
  const fileName = value.trim()
  if (!fileName || value.length > 255 || /[\x00-\x1f\x7f]/.test(value))
    throw new ConvexError(
      "Please select a file with a valid name (up to 255 characters)."
    )
  return fileName
}

// Both the preflight query and save transaction enforce the same retry key.
export async function getSubmissionForRequest(
  ctx: Pick<QueryCtx, "db">,
  studentId: Id<"users">,
  assignmentId: Id<"assignments">,
  requestId: string
) {
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(requestId))
    throw new ConvexError("Invalid submission request.")
  const existing = await ctx.db
    .query("submissions")
    .withIndex("by_studentId_and_requestId", (q) =>
      q.eq("studentId", studentId).eq("requestId", requestId)
    )
    .unique()
  if (existing && existing.assignmentId !== assignmentId)
    throw new ConvexError("Invalid submission request.")
  return existing
}
