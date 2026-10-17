import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  tasks: defineTable({
    isCompleted: v.boolean(),
    text: v.string(),
  }),

  users: defineTable({
    issuer: v.string(),
    clerkId: v.string(),
    name: v.union(v.string(), v.null()),
    imageUrl: v.union(v.string(), v.null()),
    email: v.union(v.string(), v.null()),
    sourceUpdatedAt: v.number(),
    eventTimestamp: v.number(),
    deletedAt: v.union(v.number(), v.null()),
    role: v.optional(v.union(v.literal("instructor"), v.literal("student"))),
    roleSelectedAt: v.optional(v.number()),
  }).index("by_issuer_and_clerkId", ["issuer", "clerkId"]),
})
