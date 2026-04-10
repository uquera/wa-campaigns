import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseContactsExcel } from "@/lib/excel"

export async function GET() {
  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(contacts)
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const rows = parseContactsExcel(buffer)

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No contacts found in file. Make sure the Excel has 'nombre' and 'telefono' columns." },
      { status: 400 }
    )
  }

  let imported = 0
  let skipped = 0

  for (const row of rows) {
    try {
      await prisma.contact.upsert({
        where: { phone: row.phone },
        update: { name: row.name, extra: row.extra ? JSON.stringify(row.extra) : null },
        create: {
          name: row.name,
          phone: row.phone,
          extra: row.extra ? JSON.stringify(row.extra) : null,
        },
      })
      imported++
    } catch {
      skipped++
    }
  }

  return NextResponse.json({ imported, skipped, total: rows.length })
}
