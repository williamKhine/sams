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
import { getEnrollment } from "./lib/access"
import {
  MAX_SUBMISSION_BYTES,
  getSubmissionForRequest,
  validateFileName,
} from "./lib/submissions"
import { countSubmission } from "./lib/progress"

async function requireAssignment(
  ctx: QueryCtx | MutationCtx,
  assignmentId: Id<"assignments">
) {
  const student = await requireRole(ctx, "student")
  const assignment = await ctx.db.get("assignments", assignmentId)
  if (!assignment) throw new ConvexError("Assignment unavailable.")
  const course = await ctx.db.get("courses", assignment.courseId)
  const enrollment = await getEnrollment(ctx, assignment.courseId, student._id)
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
    return await getSubmissionForRequest(
      ctx,
      student._id,
      args.assignmentId,
      args.requestId
    )
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
    const existing = await getSubmissionForRequest(
      ctx,
      student._id,
      assignment._id,
      args.requestId
    )
    if (existing) return existing
    const fileName = validateFileName(args.fileName)
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
    await countSubmission(ctx, submission)
    return (await ctx.db.get("submissions", id))!
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

export const forCourse = query({
  args: {
    courseId: v.id("courses"),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(submissionWithUrl),
  handler: async (ctx, args) => {
    const student = await requireRole(ctx, "student")
    const course = await ctx.db.get("courses", args.courseId)
    const enrollment = await getEnrollment(ctx, args.courseId, student._id)
    if (!course || enrollment?.status !== "approved")
      throw new ConvexError(
        "You must be enrolled in this course to view submission history."
      )
    const result = await ctx.db
      .query("submissions")
      .withIndex("by_studentId_and_courseId", (q) =>
        q.eq("studentId", student._id).eq("courseId", args.courseId)
      )
      .order("desc")
      .paginate(args.paginationOpts)
    return {
      ...result,
      page: await Promise.all(
        result.page.map(async (submission) => ({
          ...submission,
          url: await ctx.storage.getUrl(submission.storageId),
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
