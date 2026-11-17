"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState, type FormEvent } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useDashboardUser } from "@/components/layout/dashboard-shell"
import { CreateCourseForm } from "@/components/courses/create-course-form"
import { courseError } from "@/lib/errors"
import { courseRoutes } from "@/lib/routes"

export default function CreateCourse() {
  const user = useDashboardUser()
  const router = useRouter()
  const create = useMutation(api.courses.create)
  const inFlight = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    const data = new FormData(event.currentTarget)
    setError(null)
    const name = String(data.get("name") ?? "").trim()
    const code = String(data.get("code") ?? "").trim()
    const maxStudents = Number(data.get("maxStudents"))
    if (!name || !code) {
      setError(
        "Enter a course name and code. These cannot contain only spaces."
      )
      return
    }
    if (!Number.isSafeInteger(maxStudents) || maxStudents < 1) {
      setError("Enter a whole number of students greater than zero.")
      return
    }
    inFlight.current = true
    setBusy(true)
    try {
      const courseId = await create({
        name,
        code,
        maxStudents,
        active: data.get("active") === "on",
      })
      router.push(courseRoutes(courseId).home)
    } catch (error) {
      setError(courseError(error))
      inFlight.current = false
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-2xl space-y-6">
      <Link className="text-sm text-primary hover:underline" href="/dashboard">
        ← Back to my courses
      </Link>
      <div className="space-y-2">
        <h1>Create a course</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Set up your course details and choose whether students can request
          enrollment.
        </p>
      </div>
      {user.role === "instructor" ? (
        <CreateCourseForm busy={busy} onSubmit={createCourse} error={error} />
      ) : (
        <p role="alert">Only instructors can create courses.</p>
      )}
    </section>
  )
}
