import Link from "next/link"
import { Logo } from "@/components/shared/logo"

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 text-sm text-muted-foreground md:flex-row md:justify-between">
        <Logo className="text-foreground" />
        <p>© {new Date().getFullYear()} LocalReply AI. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  )
}
