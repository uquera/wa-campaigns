import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export const dynamic = "force-dynamic"

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "secondary",
  APPROVED: "outline",
  REJECTED: "destructive",
}

export default async function TemplatesPage() {
  const templates = await prisma.template.findMany({ orderBy: { createdAt: "desc" } })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Los templates deben ser aprobados por Meta antes de usarlos.
          </p>
        </div>
        <Link
          href="/templates/new"
          className="text-sm bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          + Nuevo template
        </Link>
      </div>

      {templates.length === 0 ? (
        <p className="text-sm text-zinc-400 py-4">No hay templates todavía.</p>
      ) : (
        <div className="grid gap-4">
          {templates.map((t) => {
            const buttons = t.buttons ? JSON.parse(t.buttons) : []
            return (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{t.displayName}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{t.category}</Badge>
                      <Badge variant={statusColors[t.status] ?? "secondary"}>{t.status}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">{t.name}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {t.headerImage && (
                    <p className="text-xs text-zinc-500">
                      Imagen: <span className="font-mono">{t.headerImage}</span>
                    </p>
                  )}
                  <div className="bg-zinc-50 rounded-md p-3 text-sm whitespace-pre-wrap">
                    {t.body}
                  </div>
                  {buttons.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {buttons.map((btn: { text: string; type?: string; value?: string }, i: number) => (
                        <span
                          key={i}
                          className="text-xs border border-zinc-200 rounded px-2 py-1 text-zinc-600 flex items-center gap-1"
                        >
                          {btn.type === "URL" && <span>🔗</span>}
                          {btn.type === "PHONE_NUMBER" && <span>📞</span>}
                          <span>{btn.text}</span>
                          {btn.value && (
                            <span className="text-zinc-400 font-mono truncate max-w-[140px]">
                              → {btn.value}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="text-xs text-zinc-400 bg-amber-50 border border-amber-200 rounded-lg p-3">
        <strong>Importante:</strong> después de crear un template aquí, debes crearlo también en{" "}
        <strong>Meta Business Suite</strong> con el mismo nombre exacto y esperar aprobación (24-48h).
        Una vez aprobado, cambia el estado a APPROVED manualmente.
      </div>
    </div>
  )
}
