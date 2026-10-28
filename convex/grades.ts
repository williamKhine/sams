import { ConvexError, v } from "convex/values"
import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server"
import {
  query,
  mutation,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import schema from "./schema"
import { requireRole } from "./lib/auth"

async function ownedAssignment(
  ctx: QueryCtx | MutationCtx,
  assignmentId: Id<"assignments">
) {
  const instructor = await requireRole(ctx, "instructor")
  const assignment = await ctx.db.get("assignments", assignmentId)
  const course = assignment
    ? await ctx.db.get("courses", assignment.courseId)
    : null
  if (!assignment || !course || course.instructorId !== instructor._id)
    throw new ConvexError("Assignment not found.")
  return { assignment, course }
}

export const saveFeedback = mutation({
  args: {
    submissionId: v.id("submissions"),
    grade: v.union(v.number(), v.null()),
    feedback: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const submission = await ctx.db.get("submissions", args.submissionId)
    if (!submission) throw new ConvexError("Submission not found.")
    const { assignment, course } = await ownedAssignment(
      ctx,
      submission.assignmentId
    )
    const enrollment = await ctx.db
      .query("enrollments")
      .withIndex("by_courseId_and_studentId", (q) =>
        q.eq("courseId", course._id).eq("studentId", submission.studentId)
      )
      .unique()
    if (enrollment?.status !== "approved")
      throw new ConvexError("This student is not enrolled in the course.")
    if (
      args.grade !== null &&
      (!Number.isFinite(args.grade) || args.grade < 0 || args.grade > 100)
    )
      throw new ConvexError("Grade must be a number between 0 and 100.")
    const feedback = args.feedback.trim()
    if (feedback.length > 10000)
      throw new ConvexError("Feedback must be at most 10,000 characters.")
    const result = await ctx.db
      .query("assignmentResults")
      .withIndex("by_assignmentId_and_studentId", (q) =>
        q
          .eq("assignmentId", assignment._id)
          .eq("studentId", submission.studentId)
      )
      .unique()
    if (!result || result.latestSubmissionId !== submission._id)
      throw new ConvexError(
        "A newer attempt is available. Refresh and review the latest submission."
      )
    const wasGraded = result.grade !== undefined
    const isGraded = args.grade !== null
    const difference = Number(isGraded) - Number(wasGraded)
    await ctx.db.patch("assignmentResults", result._id, {
      grade: args.grade ?? undefined,
      feedback,
      evaluatedAt: Date.now(),
      evaluatedSubmissionId: submission._id,
    })
    if (difference) {
      await ctx.db.patch("assignments", assignment._id, {
        gradedCount: (assignment.gradedCount ?? 0) + difference,
      })
      await ctx.db.patch("courses", course._id, {
        gradedCount: (course.gradedCount ?? 0) + difference,
      })
    }
    return null
  },
})

const evaluation = v.object({
  grade: v.union(v.number(), v.null()),
  feedback: v.union(v.string(), v.null()),
  evaluatedAt: v.union(v.number(), v.null()),
  evaluatedSubmissionId: v.union(v.id("submissions"), v.null()),
  latestSubmissionId: v.id("submissions"),
})

export const forStudent = query({
  args: { assignmentId: v.id("assignments") },
  returns: v.union(evaluation, v.null()),
  handler: async (ctx, args) => {
    const student = await requireRole(ctx, "student")
    const assignment = await ctx.db.get("assignments", args.assignmentId)
    if (!assignment) throw new ConvexError("Assignment not found.")
    const enrollment = await ctx.db
      .query("enrollments")
      .withIndex("by_courseId_and_studentId", (q) =>
        q.eq("courseId", assignment.courseId).eq("studentId", student._id)
      )
      .unique()
    if (enrollment?.status !== "approved")
      throw new ConvexError("You are not enrolled in this course.")
    const result = await ctx.db
      .query("assignmentResults")
      .withIndex("by_assignmentId_and_studentId", (q) =>
        q.eq("assignmentId", assignment._id).eq("studentId", student._id)
      )
      .unique()
    return result
      ? {
          grade: result.grade ?? null,
          feedback: result.feedback ?? null,
          evaluatedAt: result.evaluatedAt ?? null,
          evaluatedSubmissionId: result.evaluatedSubmissionId ?? null,
          latestSubmissionId: result.latestSubmissionId,
        }
      : null
  },
})

export const submissions = query({
  args: {
    assignmentId: v.id("assignments"),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(
    schema.doc("assignmentResults").extend({
      studentName: v.string(),
      fileName: v.string(),
      submittedAt: v.number(),
      url: v.union(v.string(), v.null()),
    })
  ),
  handler: async (ctx, args) => {
    await ownedAssignment(ctx, args.assignmentId)
    const result = await ctx.db
      .query("assignmentResults")
      .withIndex("by_assignmentId_and_studentId", (q) =>
        q.eq("assignmentId", args.assignmentId)
      )
      .paginate(args.paginationOpts)
    const page = await Promise.all(
      result.page.map(async (row) => {
        const student = await ctx.db.get("users", row.studentId)
        const submission = await ctx.db.get(
          "submissions",
          row.latestSubmissionId
        )
        return {
          ...row,
          studentName:
            student?.deletedAt === null
              ? (student.name ?? "Student")
              : "Unavailable student",
          fileName: submission?.fileName ?? "Unavailable file",
          submittedAt: submission?._creationTime ?? 0,
          url: submission
            ? await ctx.storage.getUrl(submission.storageId)
            : null,
        }
      })
    )
    return { ...result, page }
  },
})
