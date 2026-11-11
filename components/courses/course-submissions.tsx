"use client"

import { useCourseShell } from "./course-shell"
import CourseSubmissionHistory from "@/components/submissions/course-submission-history"

export default function CourseSubmissions() {
  const { course, role } = useCourseShell()
  if (role !== "student")
    return <p>Submission history is available to students.</p>
  return <CourseSubmissionHistory courseId={course._id} />
}
