import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  courses: defineTable({
    instructorId: v.id("users"),
    name: v.string(),
    code: v.string(),
    maxStudents: v.number(),
    active: v.boolean(),
    approvedCount: v.number(),
  })
    .index("by_instructorId", ["instructorId"])
    .index("by_instructorId_and_code", ["instructorId", "code"])
    .index("by_active", ["active"]),

  enrollments: defineTable({
    courseId: v.id("courses"),
    studentId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    decidedAt: v.optional(v.number()),
  })
    .index("by_courseId_and_studentId", ["courseId", "studentId"])
    .index("by_courseId_and_status", ["courseId", "status"])
    .index("by_studentId", ["studentId"]),

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
