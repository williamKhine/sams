/** Course tools always live beneath their course shell. */
export function courseRoutes(courseId: string) {
  const home = `/dashboard/courses/${encodeURIComponent(courseId)}`
  const assignments = `${home}/assignments`
  return {
    home,
    assignments,
    grades: `${home}/grades`,
    submissions: `${home}/submissions`,
    assignment: (assignmentId: string) =>
      `${assignments}/${encodeURIComponent(assignmentId)}`,
  }
}
