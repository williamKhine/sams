"use client"

import { CreateCourseForm } from "@/components/courses/create-course-form"
import { InstructorCourseCard } from "@/components/courses/course-cards"
import { useState, type FormEvent } from "react"
import { useMutation, usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { courseError } from "@/lib/errors"
import { LoadMore } from "@/components/shared/load-more"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TeachingOverview } from "@/components/courses/teaching-overview"
import { Input } from "@/components/ui/input"
import {
  WelcomeBanner,
  LearningSidebar,
  CourseSkeletons,
  EmptyState,
} from "@/components/shared/learning-ui"

export default function InstructorDashboard({ name }: { name: string | null }) {
  const courses = usePaginatedQuery(
    api.courses.mine,
    {},
    { initialNumItems: 20 }
  )
  const create = useMutation(api.courses.create)
  const setActive = useMutation(api.courses.setActive)
  const [search, setSearch] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const data = new FormData(form)
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await create({
        name: String(data.get("name")),
        code: String(data.get("code")),
        maxStudents: Number(data.get("maxStudents")),
        active: data.get("active") === "on",
      })
      form.reset()
      setNotice("Course created.")
    } catch (error) {
      setError(courseError(error))
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(course: Doc<"courses">) {
    if (busy) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await setActive({ courseId: course._id, active: !course.active })
    } catch (error) {
      setError(courseError(error))
    } finally {
      setBusy(false)
    }
  }

  const filteredCourses = courses.results.filter((course) =>
    `${course.name} ${course.code}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <section className="space-y-8">
      <WelcomeBanner name={name} instructor />
      <TeachingOverview courses={courses.results} status={courses.status} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <Card id="my-courses" className="scroll-mt-6">
            <CardHeader className="gap-4 sm:flex sm:items-center sm:justify-between">
              <CardTitle className="text-xl font-semibold">
                My courses
              </CardTitle>
              <Input
                className="sm:w-56"
                placeholder="Search courses"
                aria-label="Search courses"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </CardHeader>
            <CardContent className="space-y-5">
              {courses.status === "LoadingFirstPage" ? (
                <CourseSkeletons />
              ) : courses.results.length === 0 ? (
                <EmptyState title="Your classroom starts here">
                  Create your first course below, then add assignments and
                  welcome your students.
                </EmptyState>
              ) : null}
              {courses.status !== "LoadingFirstPage" &&
                courses.results.length > 0 &&
                filteredCourses.length === 0 && (
                  <EmptyState title="No matching courses">
                    Try another course name or code.
                  </EmptyState>
                )}
              <div className="grid gap-5 sm:grid-cols-2">
                {filteredCourses.map((course, index) => (
                  <InstructorCourseCard
                    key={course._id}
                    course={course}
                    index={index}
                    busy={busy}
                    onToggleActive={toggleActive}
                  />
                ))}
              </div>
              <LoadMore status={courses.status} loadMore={courses.loadMore} />
            </CardContent>
          </Card>
          <CreateCourseForm busy={busy} onSubmit={createCourse} />
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          {notice && <p role="status">{notice}</p>}
        </div>
        <LearningSidebar instructor />
      </div>
    </section>
  )
}
