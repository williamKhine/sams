import { Progress } from "@/components/ui/progress"

export function ClassProgress({
  completed,
  expected,
  label = "Class completion",
}: {
  completed: number
  expected: number
  label?: string
}) {
  const percent =
    expected > 0 ? Math.min(100, Math.round((completed / expected) * 100)) : 0
  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {expected > 0 ? `${percent}%` : "Not started"}
        </span>
      </div>
      <Progress value={percent} aria-label={label} />
      <p className="text-xs leading-relaxed text-muted-foreground">
        {completed} of {expected} expected student submissions received. Repeat
        attempts count once.
      </p>
    </div>
  )
}
