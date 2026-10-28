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
    assignmentCount: v.optional(v.number()),
    submissionCount: v.optional(v.number()),
    completedCount: v.optional(v.number()),
    gradedCount: v.optional(v.number()),
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

  assignments: defineTable({
    courseId: v.id("courses"),
    title: v.string(),
    description: v.string(),
    dueDate: v.number(),
    statsCounted: v.optional(v.boolean()),
    submissionCount: v.optional(v.number()),
    completedCount: v.optional(v.number()),
    gradedCount: v.optional(v.number()),
  })
    .index("by_statsCounted", ["statsCounted"])
    .index("by_courseId_and_dueDate", ["courseId", "dueDate"])
    .index("by_dueDate", ["dueDate"]),

  submissions: defineTable({
    assignmentId: v.id("assignments"),
    studentId: v.id("users"),
    storageId: v.id("_storage"),
    requestId: v.string(),
    statsCounted: v.optional(v.boolean()),
    fileName: v.string(),
    size: v.number(),
    assignmentTitle: v.string(),
    courseId: v.id("courses"),
    courseName: v.string(),
    courseCode: v.string(),
    dueDate: v.number(),
  })
    .index("by_statsCounted", ["statsCounted"])
    .index("by_studentId", ["studentId"])
    .index("by_studentId_and_courseId", ["studentId", "courseId"])
    .index("by_studentId_and_requestId", ["studentId", "requestId"])
    .index("by_assignmentId_and_studentId", ["assignmentId", "studentId"]),

  assignmentResults: defineTable({
    assignmentId: v.id("assignments"),
    courseId: v.id("courses"),
    studentId: v.id("users"),
    latestSubmissionId: v.id("submissions"),
    evaluatedSubmissionId: v.optional(v.id("submissions")),
    grade: v.optional(v.number()),
    feedback: v.optional(v.string()),
    evaluatedAt: v.optional(v.number()),
  }).index("by_assignmentId_and_studentId", ["assignmentId", "studentId"]),

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
