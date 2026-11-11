"use client"

import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"

export class GradesErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed)
      return (
        <div className="space-y-3 rounded-lg border border-destructive/30 p-5">
          <p role="alert" className="text-sm text-destructive">
            Unable to load grades and feedback. Please try again.
          </p>
          <Button
            variant="outline"
            onClick={() => this.setState({ failed: false })}
          >
            Try again
          </Button>
        </div>
      )
    return this.props.children
  }
}
