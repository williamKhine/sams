import { ConvexError, v } from "convex/values"
import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server"
import {
  internalMutation,
  internalQuery,
  query,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import schema from "./schema"
import { requireRole } from "./lib/auth"

export const MAX_SUBMISSION_BYTES = 25 * 1024 * 1024

async function requireAssignment(
  ctx: QueryCtx | MutationCtx,
  assignmentId: Id<"assignments">
) {
  const student = await requireRole(ctx, "student")
  const assignment = await ctx.db.get("assignments", assignmentId)
  if (!assignment) throw new ConvexError("Assignment unavailable.")
  const course = await ctx.db.get("courses", assignment.courseId)
  const enrollment = await ctx.db
    .query("enrollments")
    .withIndex("by_courseId_and_studentId", (q) =>
      q.eq("courseId", assignment.courseId).eq("studentId", student._id)
    )
    .unique()
  if (!course || enrollment?.status !== "approved")
    throw new ConvexError("You must be enrolled in this course to submit work.")
  return { student, assignment, course }
}

// HTTP upload verifies access before storing bytes. Only that action can commit a file.
export const authorizeUpload = internalQuery({
  args: { assignmentId: v.id("assignments"), requestId: v.string() },
  returns: v.union(schema.doc("submissions"), v.null()),
  handler: async (ctx, args) => {
    const { student } = await requireAssignment(ctx, args.assignmentId)
    if (!/^[a-zA-Z0-9-]{16,80}$/.test(args.requestId))
      throw new ConvexError("Invalid submission request.")
    const existing = await ctx.db
      .query("submissions")
      .withIndex("by_studentId_and_requestId", (q) =>
        q.eq("studentId", student._id).eq("requestId", args.requestId)
      )
      .unique()
    if (existing && existing.assignmentId !== args.assignmentId)
      throw new ConvexError("Invalid submission request.")
    return existing
  },
})

export const save = internalMutation({
  args: {
    assignmentId: v.id("assignments"),
    requestId: v.string(),
    storageId: v.id("_storage"),
    fileName: v.string(),
  },
  returns: schema.doc("submissions"),
  handler: async (ctx, args) => {
    const { student, assignment, course } = await requireAssignment(
      ctx,
      args.assignmentId
    )
    if (!/^[a-zA-Z0-9-]{16,80}$/.test(args.requestId))
      throw new ConvexError("Invalid submission request.")
    const existing = await ctx.db
      .query("submissions")
      .withIndex("by_studentId_and_requestId", (q) =>
        q.eq("studentId", student._id).eq("requestId", args.requestId)
      )
      .unique()
    if (existing) {
      if (existing.assignmentId !== assignment._id)
        throw new ConvexError("Invalid submission request.")
      return existing
    }
    const fileName = args.fileName.trim()
    if (!fileName || fileName.length > 255 || /[\x00-\x1f\x7f]/.test(fileName))
      throw new ConvexError(
        "Please select a file with a valid name (up to 255 characters)."
      )
    const metadata = await ctx.db.system.get("_storage", args.storageId)
    if (
      !metadata ||
      metadata.size === 0 ||
      metadata.size > MAX_SUBMISSION_BYTES
    )
      throw new ConvexError("Select a non-empty file up to 25 MB.")
    const id = await ctx.db.insert("submissions", {
      ...args,
      fileName,
      studentId: student._id,
      size: metadata.size,
      assignmentTitle: assignment.title,
      courseId: course._id,
      courseName: course.name,
      courseCode: course.code,
      dueDate: assignment.dueDate,
    })
    const submission = await ctx.db.get("submissions", id)
    if (!submission) throw new ConvexError("Could not save submission.")
    return submission
  },
})

const submissionWithUrl = schema
  .doc("submissions")
  .extend({ url: v.union(v.string(), v.null()) })

export const forAssignment = query({
  args: {
    assignmentId: v.id("assignments"),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(submissionWithUrl),
  handler: async (ctx, args) => {
    const { student } = await requireAssignment(ctx, args.assignmentId)
    const result = await ctx.db
      .query("submissions")
      .withIndex("by_assignmentId_and_studentId", (q) =>
        q.eq("assignmentId", args.assignmentId).eq("studentId", student._id)
      )
      .order("desc")
      .paginate(args.paginationOpts)
    return {
      ...result,
      page: await Promise.all(
        result.page.map(async (s) => ({
          ...s,
          url: await ctx.storage.getUrl(s.storageId),
        }))
      ),
    }
  },
})

export const mine = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(submissionWithUrl),
  handler: async (ctx, args) => {
    const student = await requireRole(ctx, "student")
    const result = await ctx.db
      .query("submissions")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .order("desc")
      .paginate(args.paginationOpts)
    return {
      ...result,
      page: await Promise.all(
        result.page.map(async (s) => ({
          ...s,
          url: await ctx.storage.getUrl(s.storageId),
        }))
      ),
    }
  },
})
