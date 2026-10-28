import { v } from "convex/values"
import { internalMutation } from "./_generated/server"
import { internal } from "./_generated/api"
import { countAssignment, countSubmission } from "./lib/progress"

// Safe to run again: each source row is counted once, in the same transaction.
export const backfill = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_statsCounted", (q) => q.eq("statsCounted", undefined))
      .take(100)
    for (const assignment of assignments) await countAssignment(ctx, assignment)
    if (assignments.length) {
      await ctx.scheduler.runAfter(0, internal.progress.backfill, {})
      return null
    }
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_statsCounted", (q) => q.eq("statsCounted", undefined))
      .take(100)
    for (const submission of submissions) await countSubmission(ctx, submission)
    if (submissions.length)
      await ctx.scheduler.runAfter(0, internal.progress.backfill, {})
    return null
  },
})
