"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ButtonRow {
  text: string
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER"
  value: string
}

const BUTTON_TYPE_LABELS: Record<string, string> = {
  QUICK_REPLY: "Respuesta rápida",
  URL: "Abrir URL",
  PHONE_NUMBER: "Llamar",
}

const BUTTON_VALUE_PLACEHOLDER: Record<string, string> = {
  QUICK_REPLY: "",
  URL: "https://wa.me/56912345678",
  PHONE_NUMBER: "+56912345678",
}

export default function NewTemplatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    displayName: "",
    name: "",
    category: "MARKETING",
    language: "es",
    headerImage: "",
    body: "",
  })

  const [buttons, setButtons] = useState<ButtonRow[]>([
    { text: "", type: "URL", value: "" },
  ])

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function autoName(displayName: string) {
    return displayName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
  }

  function updateButton(i: number, field: keyof ButtonRow, val: string) {
    setButtons((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: val }
      return next
    })
  }

  function addButton() {
    setButtons((prev) => [...prev, { text: "", type: "URL", value: "" }])
  }

  function removeButton(i: number) {
    setButtons((prev) => prev.filter((_, j) => j !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const btns = buttons
      .filter((b) => b.text.trim())
      .map((b) => ({
        text: b.text.trim(),
        type: b.type,
        value: b.value.trim() || undefined,
      }))

    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        buttons: btns.length > 0 ? btns : undefined,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? "Error al crear el template")
      setLoading(false)
      return
    }

    router.push("/templates")
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nuevo template</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Define el mensaje que se enviará en la campaña.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos del template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Nombre para mostrar</Label>
              <Input
                value={form.displayName}
                onChange={(e) => {
                  set("displayName", e.target.value)
                  set("name", autoName(e.target.value))
                }}
                placeholder="Ej: Promoción Junio"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>
                Nombre técnico{" "}
                <span className="text-zinc-400 font-normal">(debe coincidir exactamente en Meta)</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => set("name", autoName(e.target.value))}
                placeholder="promocion_junio"
                required
                className="font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Categoría</Label>
                <Select value={form.category} onValueChange={(v) => v && set("category", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MARKETING">MARKETING</SelectItem>
                    <SelectItem value="UTILITY">UTILITY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Idioma</Label>
                <Select value={form.language} onValueChange={(v) => v && set("language", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español (es)</SelectItem>
                    <SelectItem value="es_MX">Español México (es_MX)</SelectItem>
                    <SelectItem value="es_AR">Español Argentina (es_AR)</SelectItem>
                    <SelectItem value="pt_BR">Portugués Brasil (pt_BR)</SelectItem>
                    <SelectItem value="en_US">English (en_US)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>
                URL de imagen de encabezado{" "}
                <span className="text-zinc-400 font-normal">(opcional)</span>
              </Label>
              <Input
                value={form.headerImage}
                onChange={(e) => set("headerImage", e.target.value)}
                placeholder="https://ejemplo.com/imagen-producto.jpg"
              />
            </div>

            <div className="space-y-1">
              <Label>Cuerpo del mensaje</Label>
              <Textarea
                value={form.body}
                onChange={(e) => set("body", e.target.value)}
                placeholder={"Hola {{1}} 👋\n\nTenemos descuentos esta semana.\n\nRevisa tu oferta aquí >"}
                rows={6}
                required
              />
              <p className="text-xs text-zinc-400">
                Usa {"{{"} {"1"} {"}}"} para variables (ej: nombre del cliente).
              </p>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <Label>
                Botones{" "}
                <span className="text-zinc-400 font-normal">(máx 3)</span>
              </Label>

              {buttons.map((btn, i) => (
                <div key={i} className="border border-zinc-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500">Botón {i + 1}</span>
                    {buttons.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeButton(i)}
                        className="text-xs text-zinc-400 hover:text-red-500"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Tipo</Label>
                      <Select
                        value={btn.type}
                        onValueChange={(v) => v && updateButton(i, "type", v)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="URL">Abrir URL</SelectItem>
                          <SelectItem value="PHONE_NUMBER">Llamar</SelectItem>
                          <SelectItem value="QUICK_REPLY">Respuesta rápida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Texto del botón</Label>
                      <Input
                        value={btn.text}
                        onChange={(e) => updateButton(i, "text", e.target.value)}
                        placeholder="Ej: Ver oferta"
                        className="h-8 text-sm"
                        maxLength={25}
                      />
                    </div>
                  </div>

                  {btn.type !== "QUICK_REPLY" && (
                    <div className="space-y-1">
                      <Label className="text-xs">
                        {btn.type === "URL" ? "URL de destino" : "Número de teléfono"}
                      </Label>
                      <Input
                        value={btn.value}
                        onChange={(e) => updateButton(i, "value", e.target.value)}
                        placeholder={BUTTON_VALUE_PLACEHOLDER[btn.type]}
                        className="h-8 text-sm font-mono"
                      />
                      {btn.type === "URL" && (
                        <p className="text-xs text-zinc-400">
                          Para redirigir a WhatsApp usa: https://wa.me/56912345678
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {buttons.length < 3 && (
                <Button type="button" variant="outline" size="sm" onClick={addButton}>
                  + Agregar botón
                </Button>
              )}

              <div className="text-xs text-zinc-400 bg-amber-50 border border-amber-100 rounded p-2">
                <strong>Importante:</strong> configura los botones con los mismos valores en Meta Business Suite al crear el template. Meta aprueba el template completo incluyendo URLs y teléfonos.
              </div>
            </div>

            {/* Preview */}
            {(form.body || buttons.some((b) => b.text)) && (
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Vista previa</Label>
                <div className="bg-[#e9fbe5] rounded-xl p-3 text-sm space-y-2 max-w-xs">
                  {form.headerImage && (
                    <div className="bg-zinc-200 rounded-lg h-32 flex items-center justify-center text-xs text-zinc-400">
                      Imagen de encabezado
                    </div>
                  )}
                  <p className="whitespace-pre-wrap text-zinc-800">{form.body || "..."}</p>
                  {buttons.filter((b) => b.text).length > 0 && (
                    <div className="border-t border-green-200 pt-2 space-y-1">
                      {buttons.filter((b) => b.text).map((btn, i) => (
                        <div
                          key={i}
                          className="text-center text-[#00a884] text-xs font-medium py-1 border border-green-200 rounded"
                        >
                          {btn.type === "URL" && "🔗 "}
                          {btn.type === "PHONE_NUMBER" && "📞 "}
                          {btn.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                {loading ? "Guardando..." : "Guardar template"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/templates")}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
