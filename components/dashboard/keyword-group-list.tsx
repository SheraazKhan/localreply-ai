"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { KeywordGroupForm } from "@/components/dashboard/keyword-group-form"
import { EmptyState } from "@/components/shared/empty-state"
import { deleteKeywordGroup } from "@/lib/actions/keyword-actions"

export interface KeywordGroupData {
  id: string
  categoryLabel: string
  keywords: string[]
}

interface KeywordGroupListProps {
  locationId: string
  groups: KeywordGroupData[]
}

export function KeywordGroupList({ locationId, groups }: KeywordGroupListProps) {
  const router = useRouter()

  async function handleDelete(groupId: string) {
    const result = await deleteKeywordGroup(groupId)
    if (!result.success) {
      toast.error(result.error ?? "Unable to process request")
      return
    }
    toast.success("Keyword group deleted")
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Keyword groups</h2>
        <KeywordGroupForm locationId={locationId} />
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="No keyword groups yet"
          description="Add a group of keywords to weave naturally into positive review replies."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{group.categoryLabel}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(group.id)}
                  aria-label={`Delete ${group.categoryLabel}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {group.keywords.map((keyword) => (
                    <span key={keyword} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                      {keyword}
                    </span>
                  ))}
                </div>
                <KeywordGroupForm locationId={locationId} existingGroup={group} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
