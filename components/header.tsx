import { Button } from "@/components/ui/button"
import { Show, UserButton } from '@clerk/nextjs'
import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b flex justify-center items-center">
      <div className="container flex justify-between items-center">
        <Link href="/" className="font-bold text-lg">
          SAMS.
        </Link>
        <div className="flex items-center gap-2 py-2">
          <Show when="signed-out">
            <Link href="/sign-in">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Sign Up</Button>
            </Link>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  )
}