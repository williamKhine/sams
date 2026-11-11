"use client"

import { useCourseShell } from "./course-shell"
import AssignmentsPanel from "@/components/assignments/assignments-panel"
import StudentAssignments from "@/components/assignments/student-assignments"

export default function CourseAssignments() {
  const { course, role } = useCourseShell()
  return role === "instructor" ? (
    <AssignmentsPanel key={course._id} course={course} />
  ) : (
    <StudentAssignments key={course._id} courseId={course._id} />
  )
}
