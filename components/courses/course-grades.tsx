"use client"

import { useCourseShell } from "./course-shell"
import { CourseGrades } from "@/components/grades/student-grades"

export default function CourseGradesPage() {
  const { course, role } = useCourseShell()
  if (role !== "student")
    return <p>This grades view is available to students.</p>
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Grades</h2>
      <CourseGrades courseId={course._id} />
    </section>
  )
}
