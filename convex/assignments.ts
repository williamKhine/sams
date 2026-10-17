import { ConvexError, v } from "convex/values"
import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server"
import { mutation, query, type MutationCtx } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import schema from "./schema"
import { requireRole } from "./lib/auth"

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
    return await ctx.db.insert("assignments", {
      courseId: course._id,
      ...validateFields(args),
    })
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
    await ctx.db.delete("assignments", assignment._id)
    return null
  },
})

export const forEnrolledCourse = query({
  args: { courseId: v.id("courses"), paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(schema.doc("assignments")),
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
    return await ctx.db
      .query("assignments")
      .withIndex("by_courseId_and_dueDate", (q) =>
        q.eq("courseId", args.courseId)
      )
      .order("asc")
      .paginate(args.paginationOpts)
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
