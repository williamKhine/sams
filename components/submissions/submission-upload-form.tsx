"use client"

import { useRef, useState, type FormEvent } from "react"
import { useAuth } from "@clerk/nextjs"
import type { Id } from "@/convex/_generated/dataModel"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getConvexToken } from "@/lib/convex-token"

export function SubmissionUploadForm({
  assignmentId,
  dueDate,
  now,
  hasSubmission,
}: {
  assignmentId: Id<"assignments">
  dueDate: number
  now: number
  hasSubmission: boolean
}) {
  const { getToken, sessionClaims } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const requestId = useRef<string | null>(null)
  const inFlight = useRef(false)

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
    <form onSubmit={submit} className="space-y-4">
      <Label className="block space-y-2">
        <span className="font-medium">
          {hasSubmission ? "Submit another attempt" : "Add a file"}
        </span>
        <Input
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
      </Label>
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
  )
}
