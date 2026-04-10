"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface CampaignDetail {
  id: number
  name: string
  status: string
  totalCount: number
  sentCount: number
  failedCount: number
  template: {
    displayName: string
    name: string
    body: string
    headerImage: string | null
    buttons: string | null
  }
  messages: Array<{
    id: number
    status: string
    error: string | null
    sentAt: string | null
    contact: { name: string; phone: string }
  }>
}

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  RUNNING: "default",
  COMPLETED: "outline",
  FAILED: "destructive",
}

const msgStatusColors: Record<string, string> = {
  PENDING: "text-zinc-400",
  SENT: "text-green-600",
  FAILED: "text-red-500",
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [progress, setProgress] = useState<{ sent: number; failed: number; total: number; status: string } | null>(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const loadCampaign = useCallback(async () => {
    const res = await fetch(`/api/campaigns/${id}`)
    const data = await res.json()
    setCampaign(data)
  }, [id])

  useEffect(() => {
    loadCampaign()
  }, [loadCampaign])

  async function startSend() {
    setSending(true)
    setSendError(null)

    const res = await fetch(`/api/campaigns/${id}/send`, { method: "POST" })
    const data = await res.json()

    if (!res.ok) {
      setSendError(data.error ?? "Error al iniciar el envío")
      setSending(false)
      return
    }

    // Start SSE stream for progress
    const eventSource = new EventSource(`/api/campaigns/${id}/progress`)

    eventSource.onmessage = (e) => {
      const p = JSON.parse(e.data)
      setProgress(p)
      if (p.status === "COMPLETED" || p.status === "FAILED") {
        eventSource.close()
        setSending(false)
        loadCampaign()
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
      setSending(false)
      loadCampaign()
    }
  }

  if (!campaign) {
    return <p className="text-sm text-zinc-400">Cargando...</p>
  }

  const pct =
    progress && progress.total > 0
      ? Math.round((progress.sent / progress.total) * 100)
      : campaign.totalCount > 0
      ? Math.round((campaign.sentCount / campaign.totalCount) * 100)
      : 0

  const currentSent = progress?.sent ?? campaign.sentCount
  const currentFailed = progress?.failed ?? campaign.failedCount
  const currentTotal = progress?.total ?? campaign.totalCount

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <p className="text-sm text-zinc-400 mt-1">{campaign.template.displayName}</p>
        </div>
        <Badge variant={statusColors[campaign.status] ?? "secondary"}>{campaign.status}</Badge>
      </div>

      {/* Progress */}
      {campaign.status !== "DRAFT" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Progreso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="w-full bg-zinc-100 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-600 font-medium">{currentSent} enviados</span>
              {currentFailed > 0 && (
                <span className="text-red-500">{currentFailed} fallidos</span>
              )}
              <span className="text-zinc-400">{currentTotal} total</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {campaign.status === "DRAFT" && (
        <div className="space-y-2">
          <Button
            onClick={startSend}
            disabled={sending}
            className="bg-green-600 hover:bg-green-700"
          >
            {sending ? "Enviando..." : `Enviar a ${campaign.totalCount} contactos`}
          </Button>
          {sendError && (
            <p className="text-sm text-red-600">{sendError}</p>
          )}
        </div>
      )}

      {/* Template preview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Template: {campaign.template.displayName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {campaign.template.headerImage && (
            <p className="text-xs text-zinc-500 font-mono">[Imagen: {campaign.template.headerImage}]</p>
          )}
          <div className="bg-zinc-50 rounded-lg p-3 text-sm whitespace-pre-wrap">
            {campaign.template.body}
          </div>
          {campaign.template.buttons && (
            <div className="flex gap-2">
              {JSON.parse(campaign.template.buttons).map((b: { text: string }, i: number) => (
                <span key={i} className="text-xs border border-zinc-200 rounded px-2 py-1">
                  {b.text}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Mensajes ({campaign.messages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto divide-y divide-zinc-100">
            {campaign.messages.map((msg) => (
              <div key={msg.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{msg.contact.name}</p>
                  <p className="text-xs text-zinc-400">{msg.contact.phone}</p>
                  {msg.error && <p className="text-xs text-red-500">{msg.error}</p>}
                </div>
                <span className={`text-xs font-medium ${msgStatusColors[msg.status]}`}>
                  {msg.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
