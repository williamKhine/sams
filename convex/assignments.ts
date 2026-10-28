import { ConvexError, v } from "convex/values"
import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server"
import { mutation, query, type MutationCtx } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import schema from "./schema"
import { accessibleCourse } from "./courses"
import { requireRole } from "./lib/auth"
import { countAssignment } from "./lib/progress"

const assignmentFields = {
  title: v.string(),
  description: v.string(),
  dueDate: v.number(),
}

function validateFields(args: {
  title: string
  description: string
  dueDate: number
}) {
  const title = args.title.trim()
  const description = args.description.trim()
  if (!title || title.length > 150)
    throw new ConvexError(
      "Assignment title must be between 1 and 150 characters."
    )
  if (description.length > 5000)
    throw new ConvexError(
      "Assignment description must be at most 5000 characters."
    )
  if (!Number.isFinite(args.dueDate))
    throw new ConvexError("Please provide a valid due date.")
  return { title, description, dueDate: args.dueDate }
}

async function requireOwnedCourse(
  ctx: MutationCtx,
  instructorId: Id<"users">,
  courseId: Id<"courses">
) {
  const course = await ctx.db.get("courses", courseId)
  if (!course || course.instructorId !== instructorId)
    throw new ConvexError("Course not found.")
  return course
}

export const create = mutation({
  args: { courseId: v.id("courses"), ...assignmentFields },
  returns: v.id("assignments"),
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "instructor")
    const course = await requireOwnedCourse(ctx, user._id, args.courseId)
    const id = await ctx.db.insert("assignments", {
      courseId: course._id,
      ...validateFields(args),
    })
    await countAssignment(ctx, (await ctx.db.get("assignments", id))!)
    return id
  },
})

export const update = mutation({
  args: { assignmentId: v.id("assignments"), ...assignmentFields },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "instructor")
    const assignment = await ctx.db.get("assignments", args.assignmentId)
    if (!assignment) throw new ConvexError("Assignment not found.")
    await requireOwnedCourse(ctx, user._id, assignment.courseId)
    await ctx.db.patch("assignments", assignment._id, validateFields(args))
    return null
  },
})

export const remove = mutation({
  args: { assignmentId: v.id("assignments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "instructor")
    const assignment = await ctx.db.get("assignments", args.assignmentId)
    if (!assignment) throw new ConvexError("Assignment not found.")
    await requireOwnedCourse(ctx, user._id, assignment.courseId)
    await countAssignment(ctx, assignment)
    const course = await requireOwnedCourse(ctx, user._id, assignment.courseId)
    await ctx.db.patch("courses", course._id, {
      assignmentCount: Math.max(0, (course.assignmentCount ?? 0) - 1),
      submissionCount: Math.max(
        0,
        (course.submissionCount ?? 0) - (assignment.submissionCount ?? 0)
      ),
      completedCount: Math.max(
        0,
        (course.completedCount ?? 0) - (assignment.completedCount ?? 0)
      ),
      gradedCount: Math.max(
        0,
        (course.gradedCount ?? 0) - (assignment.gradedCount ?? 0)
      ),
    })
    await ctx.db.delete("assignments", assignment._id)
    return null
  },
})

export const forEnrolledCourse = query({
  args: { courseId: v.id("courses"), paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(
    schema.doc("assignments").extend({
      submittedAt: v.union(v.number(), v.null()),
      grade: v.union(v.number(), v.null()),
      feedback: v.union(v.string(), v.null()),
      evaluatedAt: v.union(v.number(), v.null()),
      evaluatedSubmissionId: v.union(v.id("submissions"), v.null()),
      latestSubmissionId: v.union(v.id("submissions"), v.null()),
    })
  ),
  handler: async (ctx, args) => {
    const student = await requireRole(ctx, "student")
    const enrollment = await ctx.db
      .query("enrollments")
      .withIndex("by_courseId_and_studentId", (q) =>
        q.eq("courseId", args.courseId).eq("studentId", student._id)
      )
      .unique()
    if (!enrollment || enrollment.status !== "approved")
      throw new ConvexError("You are not enrolled in this course.")
    const result = await ctx.db
      .query("assignments")
      .withIndex("by_courseId_and_dueDate", (q) =>
        q.eq("courseId", args.courseId)
      )
      .order("asc")
      .paginate(args.paginationOpts)
    const page = await Promise.all(
      result.page.map(async (assignment) => {
        const latest = await ctx.db
          .query("submissions")
          .withIndex("by_assignmentId_and_studentId", (q) =>
            q.eq("assignmentId", assignment._id).eq("studentId", student._id)
          )
          .order("desc")
          .first()
        const result = await ctx.db
          .query("assignmentResults")
          .withIndex("by_assignmentId_and_studentId", (q) =>
            q.eq("assignmentId", assignment._id).eq("studentId", student._id)
          )
          .unique()
        return {
          ...assignment,
          submittedAt: latest?._creationTime ?? null,
          grade: result?.grade ?? null,
          feedback: result?.feedback ?? null,
          evaluatedAt: result?.evaluatedAt ?? null,
          evaluatedSubmissionId: result?.evaluatedSubmissionId ?? null,
          latestSubmissionId: latest?._id ?? null,
        }
      })
    )
    return { ...result, page }
  },
})

export const getForStudent = query({
  args: { assignmentId: v.id("assignments") },
  returns: schema.doc("assignments").extend({ courseName: v.string() }),
  handler: async (ctx, args) => {
    const student = await requireRole(ctx, "student")
    const assignment = await ctx.db.get("assignments", args.assignmentId)
    const enrollment = assignment
      ? await ctx.db
          .query("enrollments")
          .withIndex("by_courseId_and_studentId", (q) =>
            q.eq("courseId", assignment.courseId).eq("studentId", student._id)
          )
          .unique()
      : null
    if (!assignment || enrollment?.status !== "approved")
      throw new ConvexError("Assignment not found.")
    const course = await ctx.db.get("courses", assignment.courseId)
    return { ...assignment, courseName: course?.name ?? "Unavailable course" }
  },
})

export const listByCourse = query({
  args: { courseId: v.id("courses"), paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(schema.doc("assignments")),
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "instructor")
    const course = await ctx.db.get("courses", args.courseId)
    if (!course || course.instructorId !== user._id)
      throw new ConvexError("Course not found.")
    return await ctx.db
      .query("assignments")
      .withIndex("by_courseId_and_dueDate", (q) => q.eq("courseId", course._id))
      .order("asc")
      .paginate(args.paginationOpts)
  },
})

export const get = query({
  args: {
    courseId: v.id("courses"),
    assignmentId: v.id("assignments"),
    role: v.union(v.literal("instructor"), v.literal("student")),
  },
  returns: v.union(schema.doc("assignments"), v.null()),
  handler: async (ctx, args) => {
    const course = await accessibleCourse(ctx, args.courseId, args.role)
    if (!course) return null
    const assignment = await ctx.db.get("assignments", args.assignmentId)
    return assignment?.courseId === course._id ? assignment : null
  },
})

export const upcoming = query({
  args: { now: v.number(), paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(
    schema
      .doc("assignments")
      .extend({ courseName: v.string(), courseCode: v.string() })
  ),
  handler: async (ctx, args) => {
    const student = await requireRole(ctx, "student")
    if (!Number.isFinite(args.now)) throw new ConvexError("Invalid date.")
    const result = await ctx.db
      .query("assignments")
      .withIndex("by_dueDate", (q) => q.gte("dueDate", args.now))
      .order("asc")
      .paginate(args.paginationOpts)
    const rows = await Promise.all(
      result.page.map(async (assignment) => {
        const enrollment = await ctx.db
          .query("enrollments")
          .withIndex("by_courseId_and_studentId", (q) =>
            q.eq("courseId", assignment.courseId).eq("studentId", student._id)
          )
          .unique()
        if (enrollment?.status !== "approved") return null
        const submitted = await ctx.db
          .query("submissions")
          .withIndex("by_assignmentId_and_studentId", (q) =>
            q.eq("assignmentId", assignment._id).eq("studentId", student._id)
          )
          .first()
        if (submitted) return null
        const course = await ctx.db.get("courses", assignment.courseId)
        return course
          ? { ...assignment, courseName: course.name, courseCode: course.code }
          : null
      })
    )
    return { ...result, page: rows.filter((row) => row !== null) }
  },
})
