"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Contact {
  id: number
  name: string
  phone: string
  active: boolean
  createdAt: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function loadContacts() {
    setLoading(true)
    const res = await fetch("/wa/api/contacts")
    const data = await res.json()
    setContacts(data)
    setLoading(false)
  }

  useEffect(() => {
    loadContacts()
  }, [])

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setImportResult(null)

    const form = new FormData()
    form.append("file", file)

    const res = await fetch("/wa/api/contacts", { method: "POST", body: form })
    const data = await res.json()

    if (res.ok) {
      setImportResult(`Importados: ${data.imported} | Actualizados/omitidos: ${data.skipped}`)
      loadContacts()
    } else {
      setImportResult(`Error: ${data.error}`)
    }

    setUploading(false)
    e.target.value = ""
  }

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contactos</h1>
          <p className="text-sm text-zinc-500 mt-1">{contacts.length} contactos en total</p>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="bg-green-600 hover:bg-green-700"
          >
            {uploading ? "Importando..." : "Importar Excel"}
          </Button>
        </div>
      </div>

      {importResult && (
        <div className={`text-sm px-4 py-2 rounded-lg border ${importResult.startsWith("Error") ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>
          {importResult}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Lista de contactos</CardTitle>
            <Input
              placeholder="Buscar por nombre o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs h-8 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-zinc-400">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-zinc-400 py-4">
              {contacts.length === 0
                ? "No hay contactos. Importa un archivo Excel para comenzar."
                : "Sin resultados para esa búsqueda."}
            </p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {filtered.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{contact.name}</p>
                    <p className="text-xs text-zinc-400">{contact.phone}</p>
                  </div>
                  <Badge variant={contact.active ? "outline" : "secondary"}>
                    {contact.active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-zinc-400 space-y-1">
        <p><strong>Formato del Excel:</strong> debe tener columnas <code>nombre</code> y <code>telefono</code> (o variantes como name, phone, celular).</p>
        <p>Los teléfonos sin código de país se asumen como Chile (+56).</p>
      </div>
    </div>
  )
}
