import type { MutationCtx } from "../_generated/server"
import type { Doc } from "../_generated/dataModel"

// Flags make the historical backfill and live writes idempotent, even if they overlap.
export async function countAssignment(
  ctx: MutationCtx,
  assignment: Doc<"assignments">
) {
  if (assignment.statsCounted) return
  const course = await ctx.db.get("courses", assignment.courseId)
  if (!course) {
    await ctx.db.patch("assignments", assignment._id, { statsCounted: true })
    return
  }
  await ctx.db.patch("courses", course._id, {
    assignmentCount: (course.assignmentCount ?? 0) + 1,
  })
  await ctx.db.patch("assignments", assignment._id, { statsCounted: true })
}

export async function countSubmission(
  ctx: MutationCtx,
  submission: Doc<"submissions">
) {
  if (submission.statsCounted) return
  const assignment = await ctx.db.get("assignments", submission.assignmentId)
  const course = assignment
    ? await ctx.db.get("courses", assignment.courseId)
    : null
  if (!assignment || !course) {
    await ctx.db.patch("submissions", submission._id, { statsCounted: true })
    return
  }
  await countAssignment(ctx, assignment)
  // Refresh after countAssignment, which may have changed the course counter.
  const currentCourse = (await ctx.db.get("courses", course._id))!
  const result = await ctx.db
    .query("assignmentResults")
    .withIndex("by_assignmentId_and_studentId", (q) =>
      q.eq("assignmentId", assignment._id).eq("studentId", submission.studentId)
    )
    .unique()
  if (!result) {
    await ctx.db.insert("assignmentResults", {
      assignmentId: assignment._id,
      courseId: course._id,
      studentId: submission.studentId,
      latestSubmissionId: submission._id,
    })
  } else {
    const latest = await ctx.db.get("submissions", result.latestSubmissionId)
    if (
      !latest ||
      submission._creationTime > latest._creationTime ||
      (submission._creationTime === latest._creationTime &&
        submission._id > latest._id)
    ) {
      await ctx.db.patch("assignmentResults", result._id, {
        latestSubmissionId: submission._id,
      })
    }
  }
  await ctx.db.patch("assignments", assignment._id, {
    submissionCount: (assignment.submissionCount ?? 0) + 1,
    completedCount: (assignment.completedCount ?? 0) + (result ? 0 : 1),
  })
  await ctx.db.patch("courses", course._id, {
    submissionCount: (currentCourse.submissionCount ?? 0) + 1,
    completedCount: (currentCourse.completedCount ?? 0) + (result ? 0 : 1),
  })
  await ctx.db.patch("submissions", submission._id, { statsCounted: true })
}
