import type { FormEventHandler } from "react"
import type { Doc } from "@/convex/_generated/dataModel"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// <Input type="datetime-local"> works in local time without a timezone suffix.
function toLocalInputValue(timestamp: number) {
  const date = new Date(timestamp)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function AssignmentForm({
  editing,
  busy,
  onSubmit,
  onCancel,
}: {
  editing: Doc<"assignments"> | null
  busy: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
  onCancel: () => void
}) {
  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <h3 className="text-lg font-semibold">
        {editing ? "Edit assignment" : "New assignment"}
      </h3>
      <Label className="block space-y-1">
        <span>Title</span>
        <Input
          name="title"
          required
          maxLength={150}
          disabled={busy}
          defaultValue={editing?.title}
        />
      </Label>
      <Label className="block space-y-1">
        <span>Description</span>
        <Textarea
          name="description"
          rows={4}
          maxLength={5000}
          disabled={busy}
          defaultValue={editing?.description}
        />
      </Label>
      <Label className="block space-y-1">
        <span>Due date</span>
        <Input
          name="dueDate"
          type="datetime-local"
          required
          disabled={busy}
          defaultValue={editing ? toLocalInputValue(editing.dueDate) : ""}
        />
      </Label>
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
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
