import { ConvexError } from "convex/values"
import type { QueryCtx, MutationCtx } from "../_generated/server"

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  role: "instructor" | "student"
) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new ConvexError("Please sign in.")
  const user = await ctx.db
    .query("users")
    .withIndex("by_issuer_and_clerkId", (q) =>
      q.eq("issuer", identity.issuer).eq("clerkId", identity.subject)
    )
    .unique()
  if (!user || user.deletedAt !== null || user.role !== role) {
    throw new ConvexError(`An active ${role} account is required.`)
  }
  return user
}
