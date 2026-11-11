"use client"

import { useEffect, useState } from "react"

export function useAssignmentClock() {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 60000) * 60000)
  useEffect(() => {
    const timer = setInterval(
      () => setNow(Math.floor(Date.now() / 60000) * 60000),
      60000
    )
    return () => clearInterval(timer)
  }, [])
  return now
}
