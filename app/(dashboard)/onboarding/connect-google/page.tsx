import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ConnectGooglePageProps {
  searchParams: Promise<{ error?: string }>
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_request: "The connection request was invalid. Please try again.",
  state_mismatch: "We couldn't verify the connection request. Please try again.",
  connection_failed: "We couldn't connect to Google Business Profile. Please try again.",
  plan_limit_reached: "Your plan's business location limit is already reached. Upgrade to connect another.",
  no_locations: "We couldn't find any Business Profile locations on that Google account.",
}

export default async function ConnectGooglePage({ searchParams }: ConnectGooglePageProps) {
  const { error } = await searchParams

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-12 text-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Connect Google Business Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Connect your Google Business Profile so LocalReply AI can read your reviews and post
            approved replies on your behalf.
          </p>
          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {ERROR_MESSAGES[error] ?? "Something went wrong, please try again"}
            </p>
          )}
          <Button render={<Link href="/api/google-business/connect" />}>
            Connect with Google
          </Button>
          <Button variant="outline" render={<Link href="/locations" />}>
            Skip for now
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
