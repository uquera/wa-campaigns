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

  const [buttons, setButtons] = useState<string[]>([""])

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const btns = buttons.filter((b) => b.trim()).map((text) => ({ text: text.trim() }))

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
                placeholder="Ej: Promoción Salchichas Junio"
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
                placeholder="promocion_salchichas_junio"
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
                placeholder={"Hola {{1}} 👋\n\nTenemos descuentos especiales en salchichas esta semana.\n\nRevisa tu oferta aquí >"}
                rows={6}
                required
              />
              <p className="text-xs text-zinc-400">
                Usa {"{{"} {"1"} {"}}"}, {"{{"} {"2"} {"}}"} para variables (ej: nombre del cliente).
              </p>
            </div>

            <div className="space-y-2">
              <Label>
                Botones de respuesta rápida{" "}
                <span className="text-zinc-400 font-normal">(máx 3)</span>
              </Label>
              {buttons.map((btn, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={btn}
                    onChange={(e) => {
                      const next = [...buttons]
                      next[i] = e.target.value
                      setButtons(next)
                    }}
                    placeholder={`Botón ${i + 1} (ej: Realizar Pedido)`}
                  />
                  {buttons.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setButtons(buttons.filter((_, j) => j !== i))}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              {buttons.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setButtons([...buttons, ""])}
                >
                  + Agregar botón
                </Button>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                {loading ? "Guardando..." : "Guardar template"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/templates")}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
