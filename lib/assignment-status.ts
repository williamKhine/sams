export const DUE_SOON_WINDOW = 7 * 24 * 60 * 60 * 1000

export function deadlineLabel(dueDate: number, now: number) {
  if (dueDate < now) return "Past due"
  if (dueDate <= now + DUE_SOON_WINDOW) return "Due soon"
  return null
}
