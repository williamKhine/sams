import { useId, type FormEventHandler } from "react"
import Link from "next/link"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button, buttonVariants } from "@/components/ui/button"

export function CreateCourseForm({
  busy,
  onSubmit,
  error,
}: {
  busy: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
  error?: string | null
}) {
  const id = useId()
  return (
    <form
      onSubmit={onSubmit}
      aria-busy={busy}
      className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm"
    >
      <div className="space-y-6 p-5 sm:p-8">
        <div className="grid gap-2.5">
          <Label htmlFor={`${id}-name`}>Course name</Label>
          <Input
            id={`${id}-name`}
            name="name"
            required
            maxLength={120}
            disabled={busy}
            placeholder="e.g. Software Project Management"
            className="h-11"
          />
        </div>
        <div className="grid items-start gap-6 sm:grid-cols-2">
          <div className="grid min-w-0 gap-2.5">
            <Label htmlFor={`${id}-code`}>Course code</Label>
            <Input
              id={`${id}-code`}
              name="code"
              required
              maxLength={40}
              pattern={"[a-zA-Z0-9][a-zA-Z0-9 _\\-]*"}
              title="Start with a letter or number. Use only letters, numbers, spaces, hyphens, or underscores."
              aria-describedby={`${id}-code-help`}
              disabled={busy}
              placeholder="e.g. CPS714"
              className="h-11"
            />
            <p
              id={`${id}-code-help`}
              className="text-xs leading-relaxed text-muted-foreground"
            >
              Letters, numbers, spaces, hyphens, or underscores. Saved in
              uppercase.
            </p>
          </div>
          <div className="grid min-w-0 gap-2.5">
            <Label htmlFor={`${id}-capacity`}>Maximum students</Label>
            <Input
              id={`${id}-capacity`}
              name="maxStudents"
              type="number"
              min={1}
              max={Number.MAX_SAFE_INTEGER}
              step={1}
              required
              disabled={busy}
              placeholder="e.g. 30"
              className="h-11"
            />
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
          <input
            id={`${id}-active`}
            name="active"
            type="checkbox"
            defaultChecked
            disabled={busy}
            aria-describedby={`${id}-active-help`}
            className="mt-0.5 size-4 shrink-0 accent-primary"
          />
          <div className="space-y-2">
            <Label htmlFor={`${id}-active`} className="leading-5">
              Open for enrollment
            </Label>
            <p
              id={`${id}-active-help`}
              className="text-sm leading-relaxed text-muted-foreground"
            >
              Students can find this course and request a place. You approve
              each request.
            </p>
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3 border-t bg-muted/20 px-5 py-4 sm:px-8">
        {!busy && (
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "outline" })}
          >
            Cancel
          </Link>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? "Creating course…" : "Create course"}
        </Button>
      </div>
    </form>
  )
}
