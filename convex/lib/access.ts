import { ConvexError } from "convex/values"
import type { Id } from "../_generated/dataModel"
import type { QueryCtx } from "../_generated/server"
import { requireRole } from "./auth"

// Mutation contexts also provide this read-only database/auth surface.
type AccessCtx = Pick<QueryCtx, "db" | "auth">

export function getEnrollment(
  ctx: AccessCtx,
  courseId: Id<"courses">,
  studentId: Id<"users">
) {
  return ctx.db
    .query("enrollments")
    .withIndex("by_courseId_and_studentId", (q) =>
      q.eq("courseId", courseId).eq("studentId", studentId)
    )
    .unique()
}

export async function requireEnrollment(
  ctx: AccessCtx,
  courseId: Id<"courses">,
  studentId: Id<"users">,
  message = "You are not enrolled in this course."
) {
  const enrollment = await getEnrollment(ctx, courseId, studentId)
  if (enrollment?.status !== "approved") throw new ConvexError(message)
  return enrollment
}

// The caller derives instructorId from requireRole, never from client input.
export async function requireOwnedCourse(
  ctx: AccessCtx,
  instructorId: Id<"users">,
  courseId: Id<"courses">,
  message = "Course not found."
) {
  const course = await ctx.db.get("courses", courseId)
  if (!course || course.instructorId !== instructorId)
    throw new ConvexError(message)
  return course
}

export async function requireOwnedAssignment(
  ctx: QueryCtx,
  assignmentId: Id<"assignments">
) {
  const instructor = await requireRole(ctx, "instructor")
  const assignment = await ctx.db.get("assignments", assignmentId)
  if (!assignment) throw new ConvexError("Assignment not found.")
  const course = await requireOwnedCourse(
    ctx,
    instructor._id,
    assignment.courseId,
    "Assignment not found."
  )
  return { assignment, course }
}

export async function accessibleCourse(
  ctx: QueryCtx,
  courseId: Id<"courses">,
  role: "instructor" | "student"
) {
  const user = await requireRole(ctx, role)
  const course = await ctx.db.get("courses", courseId)
  if (!course) return null
  if (role === "instructor")
    return course.instructorId === user._id ? course : null
  const enrollment = await getEnrollment(ctx, courseId, user._id)
  return enrollment?.status === "approved" ? course : null
}
