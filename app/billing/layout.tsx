import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"

export default async function BillingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}
