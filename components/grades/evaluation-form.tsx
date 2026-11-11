"use client"

import { useRef, useState, type FormEvent } from "react"
import { useMutation } from "convex/react"
import type { FunctionReturnType } from "convex/server"
import { api } from "@/convex/_generated/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { courseError } from "@/lib/errors"
import { formatDue } from "@/lib/format-date"

type Review = FunctionReturnType<typeof api.grades.submissions>["page"][number]

export function EvaluationForm({ row }: { row: Review }) {
  const save = useMutation(api.grades.saveFeedback)
  const [grade, setGrade] = useState(row.grade?.toString() ?? "")
  const [feedback, setFeedback] = useState(row.feedback ?? "")
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const newerAttempt =
    row.evaluatedSubmissionId &&
    row.evaluatedSubmissionId !== row.latestSubmissionId
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await save({
        submissionId: row.latestSubmissionId,
        grade: grade.trim() === "" ? null : Number(grade),
        feedback,
      })
      setNotice(
        "Grade and feedback saved. The student can view this evaluation."
      )
    } catch (error) {
      setError(courseError(error))
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  return (
    <Card>
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>{row.studentName}</CardTitle>
          <p className="mt-2 text-xs text-muted-foreground">
            Submitted {formatDue(row.submittedAt)}
          </p>
        </div>
        <Badge variant="secondary">
          {newerAttempt
            ? "New attempt · review needed"
            : row.grade !== undefined
              ? `Graded · ${row.grade}%`
              : row.evaluatedAt
                ? "Feedback saved · not graded"
                : "Awaiting evaluation"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/40 p-3 text-sm">
          <span className="break-all">{row.fileName}</span>
          {row.url ? (
            <a
              href={row.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              View submission ↗
            </a>
          ) : (
            <span className="text-muted-foreground">File unavailable</span>
          )}
        </div>
        {newerAttempt && (
          <p className="text-sm text-muted-foreground">
            The current grade and feedback apply to an earlier attempt. Review
            this file and save to update the evaluation.
          </p>
        )}
        <form onSubmit={submit} className="space-y-4">
          <Label className="block max-w-48 space-y-2">
            <span>Grade (%)</span>
            <Input
              type="number"
              min={0}
              max={100}
              step="0.01"
              placeholder="Not graded"
              value={grade}
              onChange={(e) => {
                setGrade(e.target.value)
                setNotice(null)
              }}
              disabled={busy}
            />
          </Label>
          <Label className="block space-y-2">
            <span>Instructor feedback</span>
            <Textarea
              rows={5}
              maxLength={10000}
              placeholder="Share what went well and what to improve…"
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value)
                setNotice(null)
              }}
              disabled={busy}
            />
          </Label>
          <p className="text-xs text-muted-foreground">
            Leave the grade blank to save feedback without a grade, or to clear
            a previous grade.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save grade & feedback"}
            </Button>
            {row.evaluatedAt && (
              <span className="text-xs text-muted-foreground">
                Last saved {formatDue(row.evaluatedAt)}
              </span>
            )}
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="text-sm text-primary">
              {notice}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
