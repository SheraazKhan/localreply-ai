import { MessageSquareText } from "lucide-react"
import Link from "next/link"

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 font-semibold text-lg ${className ?? ""}`}>
      <MessageSquareText className="size-5 text-primary" aria-hidden="true" />
      <span>LocalReply AI</span>
    </Link>
  )
}
