import type { FormEventHandler } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function CreateCourseForm({
  busy,
  onSubmit,
}: {
  busy: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-5 rounded-lg border bg-card p-6 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <h2 className="text-lg font-semibold">Create a course</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up a new learning space for your students.
        </p>
      </div>
      <Label className="block space-y-1">
        <span>Course name</span>
        <Input name="name" required maxLength={120} disabled={busy} />
      </Label>
      <Label className="block space-y-1">
        <span>Course code</span>
        <Input
          name="code"
          required
          maxLength={40}
          disabled={busy}
          placeholder="e.g. CPS714"
        />
      </Label>
      <Label className="block space-y-1">
        <span>Maximum students</span>
        <Input
          name="maxStudents"
          type="number"
          min={1}
          step={1}
          required
          disabled={busy}
        />
      </Label>
      <Label className="flex items-center gap-2">
        <input name="active" type="checkbox" defaultChecked disabled={busy} />
        Open for enrollment
      </Label>
      <Button type="submit" disabled={busy}>
        {busy ? "Please wait…" : "Create course"}
      </Button>
    </form>
  )
}
