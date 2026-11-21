import type { PaginationStatus } from "convex/react"
import type { Doc } from "@/convex/_generated/dataModel"
import { Card, CardContent } from "@/components/ui/card"
import { ClassProgress } from "@/components/shared/class-progress"

export function TeachingOverview({
  courses,
  status,
}: {
  courses: Doc<"courses">[]
  status: PaginationStatus
}) {
  const totals = courses.reduce(
    (sum, course) => ({
      assignments: sum.assignments + (course.assignmentCount ?? 0),
      submissions: sum.submissions + (course.submissionCount ?? 0),
      completed: sum.completed + (course.completedCount ?? 0),
      graded: sum.graded + (course.gradedCount ?? 0),
      expected:
        sum.expected + (course.assignmentCount ?? 0) * course.approvedCount,
    }),
    { assignments: 0, submissions: 0, completed: 0, graded: 0, expected: 0 }
  )

  return (
    <section aria-label="Teaching overview" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Teaching overview</h2>
        <p className="text-xs text-muted-foreground">
          {status === "LoadingFirstPage"
            ? "Loading…"
            : `Across ${courses.length} loaded courses`}
          {status === "CanLoadMore"
            ? " · Load more courses for additional totals"
            : ""}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Assignments", value: totals.assignments },
          { label: "Submission attempts", value: totals.submissions },
          {
            label: "Students’ work submitted",
            value: `${totals.completed} / ${totals.expected}`,
          },
          {
            label: "Graded submissions",
            value: `${totals.graded} / ${totals.completed}`,
          },
        ].map((metric) => (
          <Card key={metric.label} size="sm">
            <CardContent>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {status === "LoadingFirstPage" ? "—" : metric.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent>
          <ClassProgress
            completed={totals.completed}
            expected={totals.expected}
          />
        </CardContent>
      </Card>
    </section>
  )
}
