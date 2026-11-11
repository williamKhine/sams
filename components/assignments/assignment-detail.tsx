"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useCourseShell } from "@/components/courses/course-shell"
import { formatDue } from "@/lib/format-date"
import InstructorReview from "@/components/grades/instructor-review"
import StudentSubmission from "@/components/submissions/student-submission"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useAssignmentClock } from "./use-assignment-clock"
import { courseRoutes } from "@/lib/routes"

export default function AssignmentDetail({
  assignmentId,
}: {
  assignmentId: string
}) {
  const { course, role } = useCourseShell()
  const assignment = useQuery(api.assignments.get, {
    courseId: course._id,
    assignmentId: assignmentId as Id<"assignments">,
    role,
  })
  const now = useAssignmentClock()
  if (assignment === undefined) return <p role="status">Loading assignment…</p>
  if (assignment === null)
    return (
      <p role="alert">
        Assignment unavailable. It may have been deleted or you may not have
        access.
      </p>
    )

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-2xl">{assignment.title}</h2>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Due {formatDue(assignment.dueDate)}
            {assignment.dueDate < now ? " · Past due" : ""}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="font-semibold">Description</h3>
          <p className="whitespace-pre-wrap">
            {assignment.description || "No description provided."}
          </p>
          {role === "instructor" && (
            <Link
              className="text-primary hover:underline"
              href={courseRoutes(course._id).assignments}
            >
              Manage assignments
            </Link>
          )}
        </CardContent>
      </Card>
      {role === "instructor" ? (
        <InstructorReview
          assignment={assignment}
          studentCount={course.approvedCount}
        />
      ) : (
        <StudentSubmission
          key={assignment._id}
          assignmentId={assignment._id}
          dueDate={assignment.dueDate}
        />
      )}
    </section>
  )
}
