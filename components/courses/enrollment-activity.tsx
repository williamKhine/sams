"use client"

import { courseRoutes } from "@/lib/routes"

import Link from "next/link"
import { usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadMore } from "@/components/shared/load-more"
import { enrollmentStatusLabels } from "./enrollment-status"

export function EnrollmentActivity() {
  const enrollments = usePaginatedQuery(
    api.enrollments.mine,
    {},
    { initialNumItems: 20 }
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrollment activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {enrollments.status === "LoadingFirstPage" ? (
          <p role="status" className="text-muted-foreground">
            Loading enrollments…
          </p>
        ) : enrollments.results.length === 0 ? (
          <p className="text-muted-foreground">
            Your enrollment requests and their status will appear here.
          </p>
        ) : (
          enrollments.results.map((enrollment) => (
            <div
              key={enrollment._id}
              className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 last:border-0 last:pb-0"
            >
              <div>
                <p className="font-medium">
                  {enrollment.status === "approved" ? (
                    <Link
                      className="hover:text-primary hover:underline"
                      href={courseRoutes(enrollment.courseId).home}
                    >
                      {enrollment.courseName}
                    </Link>
                  ) : (
                    enrollment.courseName
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {enrollment.courseCode}
                  {!enrollment.courseActive ? " · Course inactive" : ""}
                </p>
              </div>
              <Badge variant="secondary">
                {enrollmentStatusLabels[enrollment.status]}
              </Badge>
            </div>
          ))
        )}
        <LoadMore status={enrollments.status} loadMore={enrollments.loadMore} />
      </CardContent>
    </Card>
  )
}
