import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export const dynamic = "force-dynamic"

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  RUNNING: "default",
  COMPLETED: "outline",
  FAILED: "destructive",
}

export default async function Dashboard() {
  const [contactCount, templateCount, campaigns] = await Promise.all([
    prisma.contact.count({ where: { active: true } }),
    prisma.template.count(),
    prisma.campaign.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { template: { select: { displayName: true } } },
    }),
  ])

  const totalSent = await prisma.campaignMessage.count({ where: { status: "SENT" } })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Resumen de tu actividad</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Contactos activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{contactCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{templateCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Mensajes enviados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalSent}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Campañas recientes</h2>
          <Link href="/campaigns/new" className="text-sm text-green-600 hover:underline">
            + Nueva campaña
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <p className="text-sm text-zinc-400 py-4">No hay campañas todavía.</p>
        ) : (
          <div className="space-y-2">
            {campaigns.map((c) => (
              <Link key={c.id} href={`/campaigns/${c.id}`}>
                <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-lg px-4 py-3 hover:border-zinc-300 transition-colors">
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-zinc-400">{c.template.displayName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500">
                      {c.sentCount}/{c.totalCount} enviados
                    </span>
                    <Badge variant={statusColors[c.status] ?? "secondary"}>{c.status}</Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
