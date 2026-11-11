"use client"

import Link from "next/link"
import { useCourseShell } from "./course-shell"
import { PendingRequests } from "./pending-requests"
import { ClassProgress } from "@/components/shared/class-progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { courseRoutes } from "@/lib/routes"

export default function CourseOverview() {
  const { course, role } = useCourseShell()
  const courseUrl = courseRoutes(course._id).home
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to your course</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Find your assignments, review instructions, and keep track of
              deadlines in your course workspace.
            </p>
            <Link
              className="inline-block text-sm font-medium text-primary hover:underline"
              href={`${courseUrl}/assignments`}
            >
              View assignments →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Course information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Course code</dt>
                <dd className="font-medium">{course.code}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t pt-3">
                <dt className="text-muted-foreground">Enrollment</dt>
                <dd>
                  {course.approvedCount} / {course.maxStudents} students
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
      {role === "instructor" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Class progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {course.assignmentCount ?? 0} assignments ·{" "}
                {course.submissionCount ?? 0} submission attempts ·{" "}
                {course.gradedCount ?? 0} graded
              </p>
              <ClassProgress
                completed={course.completedCount ?? 0}
                expected={(course.assignmentCount ?? 0) * course.approvedCount}
              />
            </CardContent>
          </Card>
          <PendingRequests course={course} />
        </>
      )}
    </div>
  )
}
