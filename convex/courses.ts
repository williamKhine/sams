import { ConvexError, v } from "convex/values"
import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server"
import { query, mutation } from "./_generated/server"
import schema from "./schema"
import { requireRole } from "./lib/auth"

export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    maxStudents: v.number(),
    active: v.boolean(),
  },
  returns: v.id("courses"),
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "instructor")
    const name = args.name.trim()
    const code = args.code.trim().toUpperCase()
    if (!name || name.length > 120)
      throw new ConvexError("Course name must be between 1 and 120 characters.")
    if (!/^[A-Z0-9][A-Z0-9 _-]{0,39}$/.test(code))
      throw new ConvexError(
        "Course code must be 1–40 characters: letters, numbers, spaces, hyphens or underscores."
      )
    if (!Number.isSafeInteger(args.maxStudents) || args.maxStudents < 1) {
      throw new ConvexError("Maximum students must be a positive whole number.")
    }
    const duplicate = await ctx.db
      .query("courses")
      .withIndex("by_instructorId_and_code", (q) =>
        q.eq("instructorId", user._id).eq("code", code)
      )
      .unique()
    if (duplicate)
      throw new ConvexError("You already have a course with that code.")
    return await ctx.db.insert("courses", {
      ...args,
      name,
      code,
      instructorId: user._id,
      approvedCount: 0,
    })
  },
})

export const mine = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(schema.doc("courses")),
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "instructor")
    return await ctx.db
      .query("courses")
      .withIndex("by_instructorId", (q) => q.eq("instructorId", user._id))
      .order("desc")
      .paginate(args.paginationOpts)
  },
})

export const active = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(
    schema.doc("courses").extend({
      instructorName: v.union(v.string(), v.null()),
      enrollmentStatus: v.union(
        v.null(),
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected")
      ),
    })
  ),
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "student")
    const result = await ctx.db
      .query("courses")
      .withIndex("by_active", (q) => q.eq("active", true))
      .order("desc")
      .paginate(args.paginationOpts)
    const page = await Promise.all(
      result.page.map(async (course) => {
        const enrollment = await ctx.db
          .query("enrollments")
          .withIndex("by_courseId_and_studentId", (q) =>
            q.eq("courseId", course._id).eq("studentId", user._id)
          )
          .unique()
        const instructor = await ctx.db.get("users", course.instructorId)
        return {
          ...course,
          instructorName:
            instructor?.deletedAt === null ? instructor.name : null,
          enrollmentStatus: enrollment?.status ?? null,
        }
      })
    )
    return { ...result, page }
  },
})

export const setActive = mutation({
  args: { courseId: v.id("courses"), active: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "instructor")
    const course = await ctx.db.get("courses", args.courseId)
    if (!course || course.instructorId !== user._id)
      throw new ConvexError("Course not found.")
    await ctx.db.patch("courses", course._id, { active: args.active })
    return null
  },
})
