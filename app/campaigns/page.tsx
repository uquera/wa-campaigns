import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export const dynamic = "force-dynamic"

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  RUNNING: "default",
  COMPLETED: "outline",
  FAILED: "destructive",
}

export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { template: { select: { displayName: true } } },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campañas</h1>
          <p className="text-sm text-zinc-500 mt-1">{campaigns.length} campañas creadas</p>
        </div>
        <Link
          href="/campaigns/new"
          className="text-sm bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          + Nueva campaña
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <p className="text-sm text-zinc-400 py-4">No hay campañas todavía.</p>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => {
            const pct = c.totalCount > 0 ? Math.round((c.sentCount / c.totalCount) * 100) : 0
            return (
              <Link key={c.id} href={`/campaigns/${c.id}`}>
                <div className="bg-white border border-zinc-200 rounded-lg px-4 py-3 hover:border-zinc-300 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-zinc-400">{c.template.displayName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500">
                        {c.sentCount}/{c.totalCount} enviados
                        {c.failedCount > 0 && (
                          <span className="text-red-500 ml-1">({c.failedCount} fallidos)</span>
                        )}
                      </span>
                      <Badge variant={statusColors[c.status] ?? "secondary"}>{c.status}</Badge>
                    </div>
                  </div>
                  {c.status !== "DRAFT" && (
                    <div className="w-full bg-zinc-100 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
