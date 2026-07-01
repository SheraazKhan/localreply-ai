import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getSubscriptionStatus, isActiveStatus } from "@/lib/services/subscription"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const status = await getSubscriptionStatus(session.user.id)

  if (!isActiveStatus(status)) {
    redirect("/pricing?reason=subscription_required")
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}
