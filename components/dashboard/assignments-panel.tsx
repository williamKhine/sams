"use client"

import { useState, type FormEvent } from "react"
import { useMutation, usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { courseError, formatDue, inputClassName, LoadMore } from "./course-ui"

// <input type="datetime-local"> works in local time without a timezone suffix.
function toLocalInputValue(timestamp: number) {
  const date = new Date(timestamp)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function AssignmentsPanel({
  course,
}: {
  course: Doc<"courses">
}) {
  const assignments = usePaginatedQuery(
    api.assignments.listByCourse,
    { courseId: course._id },
    { initialNumItems: 20 }
  )
  const create = useMutation(api.assignments.create)
  const update = useMutation(api.assignments.update)
  const remove = useMutation(api.assignments.remove)
  const [editing, setEditing] = useState<Doc<"assignments"> | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const data = new FormData(form)
    const dueDate = new Date(String(data.get("dueDate"))).getTime()
    if (Number.isNaN(dueDate)) {
      setError("Please provide a valid due date.")
      return
    }
    const fields = {
      title: String(data.get("title")),
      description: String(data.get("description")),
      dueDate,
    }
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      if (editing) {
        await update({ assignmentId: editing._id, ...fields })
        setEditing(null)
        setNotice("Assignment updated.")
      } else {
        await create({ courseId: course._id, ...fields })
        form.reset()
        setNotice("Assignment created.")
      }
    } catch (error) {
      setError(courseError(error))
    } finally {
      setBusy(false)
    }
  }

  async function deleteAssignment(assignment: Doc<"assignments">) {
    if (busy) return
    if (!window.confirm(`Delete "${assignment.title}"? This can't be undone.`))
      return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await remove({ assignmentId: assignment._id })
      if (editing?._id === assignment._id) setEditing(null)
      setNotice("Assignment deleted.")
    } catch (error) {
      setError(courseError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-6 rounded-xl border p-6">
      <h2 className="text-xl font-semibold">
        Assignments for {course.name} ({course.code})
      </h2>
      <form
        // Re-mount when switching between create and each assignment's edit
        // so the uncontrolled inputs pick up the right default values.
        key={editing?._id ?? "new"}
        onSubmit={submit}
        className="max-w-xl space-y-4"
      >
        <h3 className="text-lg font-semibold">
          {editing ? "Edit assignment" : "New assignment"}
        </h3>
        <label className="block space-y-1">
          <span>Title</span>
          <input
            className={inputClassName}
            name="title"
            required
            maxLength={150}
            disabled={busy}
            defaultValue={editing?.title}
          />
        </label>
        <label className="block space-y-1">
          <span>Description</span>
          <textarea
            className={inputClassName}
            name="description"
            rows={4}
            maxLength={5000}
            disabled={busy}
            defaultValue={editing?.description}
          />
        </label>
        <label className="block space-y-1">
          <span>Due date</span>
          <input
            className={inputClassName}
            name="dueDate"
            type="datetime-local"
            required
            disabled={busy}
            defaultValue={editing ? toLocalInputValue(editing.dueDate) : ""}
          />
        </label>
        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>
            {busy
              ? "Please wait…"
              : editing
                ? "Save changes"
                : "Create assignment"}
          </Button>
          {editing && (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setEditing(null)
                setError(null)
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <div className="space-y-4">
        {assignments.status === "LoadingFirstPage" ? (
          <p role="status">Loading assignments…</p>
        ) : assignments.results.length === 0 ? (
          <p>No assignments for this course yet.</p>
        ) : null}
        {assignments.results.map((assignment) => (
          <article
            key={assignment._id}
            className="space-y-2 rounded-lg border p-4"
          >
            <h3 className="font-semibold">{assignment.title}</h3>
            <p className="text-sm">Due {formatDue(assignment.dueDate)}</p>
            {assignment.description && (
              <p className="whitespace-pre-wrap">{assignment.description}</p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setEditing(assignment)
                  setError(null)
                  setNotice(null)
                }}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void deleteAssignment(assignment)}
              >
                Delete
              </Button>
            </div>
          </article>
        ))}
        <LoadMore status={assignments.status} loadMore={assignments.loadMore} />
      </div>
    </section>
  )
}
