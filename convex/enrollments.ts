import { ConvexError, v } from "convex/values"
import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server"
import { mutation, query } from "./_generated/server"
import schema from "./schema"
import { requireRole } from "./lib/auth"
import { getEnrollment, requireOwnedCourse } from "./lib/access"

export const request = mutation({
  args: { courseId: v.id("courses") },
  returns: v.id("enrollments"),
  handler: async (ctx, args) => {
    const student = await requireRole(ctx, "student")
    const course = await ctx.db.get("courses", args.courseId)
    if (!course || !course.active)
      throw new ConvexError("This course is not open for enrollment.")
    const instructor = await ctx.db.get("users", course.instructorId)
    if (
      !instructor ||
      instructor.deletedAt !== null ||
      instructor.role !== "instructor"
    )
      throw new ConvexError("This course is not open for enrollment.")
    const existing = await getEnrollment(ctx, course._id, student._id)
    if (existing) {
      if (existing.status === "rejected")
        throw new ConvexError("Your request for this course was rejected.")
      return existing._id
    }
    if (course.approvedCount >= course.maxStudents)
      throw new ConvexError("This course is full.")
    return await ctx.db.insert("enrollments", {
      courseId: course._id,
      studentId: student._id,
      status: "pending",
    })
  },
})

export const pending = query({
  args: { courseId: v.id("courses"), paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(
    schema
      .doc("enrollments")
      .extend({ studentName: v.union(v.string(), v.null()) })
  ),
  handler: async (ctx, args) => {
    const instructor = await requireRole(ctx, "instructor")
    const course = await requireOwnedCourse(ctx, instructor._id, args.courseId)
    const result = await ctx.db
      .query("enrollments")
      .withIndex("by_courseId_and_status", (q) =>
        q.eq("courseId", course._id).eq("status", "pending")
      )
      .order("desc")
      .paginate(args.paginationOpts)
    const page = await Promise.all(
      result.page.map(async (enrollment) => {
        const student = await ctx.db.get("users", enrollment.studentId)
        return {
          ...enrollment,
          studentName: student?.deletedAt === null ? student.name : null,
        }
      })
    )
    return { ...result, page }
  },
})

export const decide = mutation({
  args: {
    enrollmentId: v.id("enrollments"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const instructor = await requireRole(ctx, "instructor")
    const enrollment = await ctx.db.get("enrollments", args.enrollmentId)
    if (!enrollment) throw new ConvexError("Enrollment request not found.")
    const course = await requireOwnedCourse(
      ctx,
      instructor._id,
      enrollment.courseId,
      "Enrollment request not found."
    )
    if (enrollment.status === args.decision) return null
    if (enrollment.status !== "pending")
      throw new ConvexError("This request has already been decided.")
    if (args.decision === "approved") {
      if (!course.active)
        throw new ConvexError(
          "Activate the course before approving enrollment."
        )
      const student = await ctx.db.get("users", enrollment.studentId)
      if (!student || student.deletedAt !== null || student.role !== "student")
        throw new ConvexError("This student account is no longer active.")
      if (course.approvedCount >= course.maxStudents)
        throw new ConvexError("This course is full.")
      // Both writes share one transaction, so concurrent approvals cannot
      // allocate the same final seat or increment the count twice.
      await ctx.db.patch("courses", course._id, {
        approvedCount: course.approvedCount + 1,
      })
    }
    await ctx.db.patch("enrollments", enrollment._id, {
      status: args.decision,
      decidedAt: Date.now(),
    })
    return null
  },
})

export const mine = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(
    schema.doc("enrollments").extend({
      courseName: v.string(),
      courseCode: v.string(),
      courseActive: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const student = await requireRole(ctx, "student")
    const result = await ctx.db
      .query("enrollments")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .order("desc")
      .paginate(args.paginationOpts)
    const page = await Promise.all(
      result.page.map(async (enrollment) => {
        const course = await ctx.db.get("courses", enrollment.courseId)
        return {
          ...enrollment,
          courseName: course?.name ?? "Unavailable course",
          courseCode: course?.code ?? "",
          courseActive: course?.active ?? false,
        }
      })
    )
    return { ...result, page }
  },
})
