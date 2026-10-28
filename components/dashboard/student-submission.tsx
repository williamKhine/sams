"use client"

import { useRef, useState, type FormEvent } from "react"
import { useAuth } from "@clerk/nextjs"
import { usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { getConvexToken } from "@/lib/convex-token"
import { formatDue, LoadMore } from "./course-ui"
import { AssignmentStatus, useAssignmentClock } from "./assignment-status"

export default function StudentSubmission({
  assignmentId,
  dueDate,
}: {
  assignmentId: Id<"assignments">
  dueDate: number
}) {
  const history = usePaginatedQuery(
    api.submissions.forAssignment,
    { assignmentId },
    { initialNumItems: 10 }
  )
  const { getToken, sessionClaims } = useAuth()
  const now = useAssignmentClock()
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const requestId = useRef<string | null>(null)
  const inFlight = useRef(false)
  const latest = history.results[0]

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current || !file) return
    if (file.size === 0 || file.size > 25 * 1024 * 1024) {
      setError("Select a non-empty file up to 25 MB.")
      return
    }
    inFlight.current = true
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const token = await getConvexToken(getToken, sessionClaims)
      if (!token) throw new Error("Please sign in again before submitting.")
      const cloudUrl = process.env.NEXT_PUBLIC_CONVEX_URL!
      const siteUrl =
        process.env.NEXT_PUBLIC_CONVEX_SITE_URL ||
        cloudUrl.replace(/\.convex\.cloud$/, ".convex.site")
      requestId.current ??= crypto.randomUUID()
      const response = await fetch(
        `${siteUrl}/assignment-submissions?assignmentId=${encodeURIComponent(assignmentId)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": file.type || "application/octet-stream",
            "X-File-Name": encodeURIComponent(file.name),
            "X-Submission-Key": requestId.current,
          },
          body: file,
        }
      )
      const result: unknown = await response.json()
      if (!response.ok)
        throw new Error(
          result &&
            typeof result === "object" &&
            "error" in result &&
            typeof result.error === "string"
            ? result.error
            : "Upload failed. Please try again."
        )
      setNotice(
        "Submission saved. Your receipt and file appear in Submission history below."
      )
      setFile(null)
      requestId.current = null
      if (fileInput.current) fileInput.current.value = ""
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Upload failed. Your file has not been confirmed. Please try again."
      )
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  return (
    <section className="space-y-6 rounded-xl border p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">My submission</h2>
        {history.status !== "LoadingFirstPage" && (
          <AssignmentStatus
            submittedAt={latest?._creationTime ?? null}
            dueDate={dueDate}
            now={now}
          />
        )}
      </div>
      {latest && (
        <p className="text-sm text-muted-foreground">
          Last submitted {formatDue(latest._creationTime)}
        </p>
      )}
      <form onSubmit={submit} className="space-y-4">
        <label className="block space-y-2">
          <span className="font-medium">
            {latest ? "Submit another attempt" : "Add a file"}
          </span>
          <input
            ref={fileInput}
            type="file"
            required
            disabled={busy}
            aria-describedby="submission-file-help"
            className="block w-full rounded-md border p-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null)
              requestId.current = null
              setError(null)
              setNotice(null)
            }}
          />
        </label>
        <p id="submission-file-help" className="text-sm text-muted-foreground">
          One file per attempt, up to 25 MB. For multiple files, upload a ZIP.
          Earlier attempts remain in your history.
        </p>
        {file && (
          <p className="text-sm">
            Selected: {file.name} ·{" "}
            {(file.size / 1024).toLocaleString(undefined, {
              maximumFractionDigits: 1,
            })}{" "}
            KB
          </p>
        )}
        {now > dueDate && (
          <p className="text-sm text-amber-800 dark:text-amber-300">
            The deadline has passed. Your submission will be marked late.
          </p>
        )}
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        <Button type="submit" disabled={busy || !file}>
          {busy ? "Uploading and saving…" : "Submit assignment"}
        </Button>
      </form>
      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-semibold">Submission history</h3>
        {history.status === "LoadingFirstPage" ? (
          <p role="status">Loading submissions…</p>
        ) : history.results.length === 0 ? (
          <p className="text-muted-foreground">
            No submissions yet. Select a file and submit it to complete this
            assignment.
          </p>
        ) : null}
        {history.results.map((submission) => (
          <article
            key={submission._id}
            className="space-y-2 rounded-lg border p-4"
          >
            <p className="font-medium">{submission.fileName}</p>
            <p className="text-sm">
              Submitted {formatDue(submission._creationTime)} ·{" "}
              {(submission.size / 1024).toLocaleString(undefined, {
                maximumFractionDigits: 1,
              })}{" "}
              KB
              {submission._creationTime > submission.dueDate
                ? " · Late"
                : " · On time"}
            </p>
            {submission.url ? (
              <a
                className="text-sm text-primary hover:underline"
                href={submission.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View submitted file ↗
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">File unavailable</p>
            )}
          </article>
        ))}
        <LoadMore status={history.status} loadMore={history.loadMore} />
      </div>
    </section>
  )
}
