"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Template {
  id: number
  name: string
  displayName: string
  body: string
  status: string
  buttons: string | null
}

interface Contact {
  id: number
  name: string
  phone: string
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [templates, setTemplates] = useState<Template[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [selectedContactIds, setSelectedContactIds] = useState<Set<number>>(new Set())
  const [campaignName, setCampaignName] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/wa/api/templates").then((r) => r.json()),
      fetch("/wa/api/contacts").then((r) => r.json()),
    ]).then(([t, c]) => {
      setTemplates(t)
      setContacts(c)
    })
  }, [])

  function toggleContact(id: number) {
    setSelectedContactIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedContactIds.size === filteredContacts.length) {
      setSelectedContactIds(new Set())
    } else {
      setSelectedContactIds(new Set(filteredContacts.map((c) => c.id)))
    }
  }

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!selectedTemplate) {
      setError("Selecciona un template")
      return
    }
    if (selectedContactIds.size === 0) {
      setError("Selecciona al menos un contacto")
      return
    }

    setLoading(true)

    const res = await fetch("/wa/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: campaignName || `Campaña ${new Date().toLocaleDateString("es-CL")}`,
        templateId: selectedTemplate.id,
        contactIds: Array.from(selectedContactIds),
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? "Error al crear la campaña")
      setLoading(false)
      return
    }

    router.push(`/campaigns/${data.id}`)
  }

  const approvedTemplates = templates.filter((t) => t.status === "APPROVED")

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nueva campaña</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Selecciona un template aprobado y los contactos a los que deseas enviar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Nombre de la campaña</Label>
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder={`Campaña ${new Date().toLocaleDateString("es-CL")}`}
              />
            </div>

            <div className="space-y-1">
              <Label>Template</Label>
              {approvedTemplates.length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                  No hay templates aprobados. Ve a{" "}
                  <a href="/templates" className="underline">Templates</a> para crear uno.
                </p>
              ) : (
                <Select
                  onValueChange={(val) => {
                    if (!val) return
                    const t = approvedTemplates.find((t) => String(t.id) === val)
                    setSelectedTemplate(t ?? null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedTemplates.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedTemplate && (
              <div className="bg-zinc-50 rounded-lg p-3 text-sm">
                <p className="text-xs text-zinc-400 mb-1">Vista previa del mensaje:</p>
                <p className="whitespace-pre-wrap">{selectedTemplate.body}</p>
                {selectedTemplate.buttons && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {JSON.parse(selectedTemplate.buttons).map((b: { text: string; type?: string; value?: string }, i: number) => (
                      <span
                        key={i}
                        className="text-xs border border-zinc-300 rounded px-2 py-1 flex items-center gap-1"
                      >
                        {b.type === "URL" && "🔗"}
                        {b.type === "PHONE_NUMBER" && "📞"}
                        {b.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Contactos ({selectedContactIds.size} seleccionados)
              </CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-7 text-sm w-40"
                />
                <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
                  {selectedContactIds.size === filteredContacts.length ? "Deseleccionar todos" : "Seleccionar todos"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <p className="text-sm text-zinc-400">
                No hay contactos. <a href="/contacts" className="underline text-green-600">Importa un Excel primero</a>.
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100">
                {filteredContacts.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 py-2 cursor-pointer hover:bg-zinc-50 px-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedContactIds.has(c.id)}
                      onChange={() => toggleContact(c.id)}
                      className="accent-green-600"
                    />
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-zinc-400">{c.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading || approvedTemplates.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? "Creando..." : "Crear campaña"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/campaigns")}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
